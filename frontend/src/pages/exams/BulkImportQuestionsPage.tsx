import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, FileSpreadsheet, Download, Upload, CheckCircle2, 
  Trash2, Search, Sparkles, BookOpen, Layers, Check, Database,
  RefreshCw, AlertCircle, HelpCircle, FileText, X
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { LatexRenderer } from './CompetitiveExamsPage';
import { PageHeader } from '../../components/UI/PageHeader';

interface ParsedRow {
  id?: string;
  category: string;
  subjectName: string;
  topicName: string;
  chapterName: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  explanation?: string | null;
}

export const BulkImportQuestionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters inside loaded rows
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Download Sample Filled Template (.xlsx)
  const handleDownloadSample = () => {
    const sampleData = [
      {
        Category: 'JEE',
        Subject: 'Mathematics',
        Topic: 'Trigonometry',
        Question: 'What is the exact value of $\\sin(30^\\circ) + \\cos(60^\\circ)$?',
        'Option A': '1',
        'Option B': '1/2',
        'Option C': '\\sqrt{3}/2',
        'Option D': '0',
        'Correct Answer': 'A',
        Difficulty: 'EASY',
        Explanation: 'sin(30) = 1/2 and cos(60) = 1/2. Their sum = 1.',
      },
      {
        Category: 'JEE',
        Subject: 'Mathematics',
        Topic: 'Calculus',
        Question: 'If $f(x) = x^3 - 3x + 2$, what is the derivative $f\'(x)$?',
        'Option A': '3x^2 - 3',
        'Option B': '3x^2 + 3',
        'Option C': 'x^2 - 1',
        'Option D': '3x - 3',
        'Correct Answer': '3x^2 - 3',
        Difficulty: 'MEDIUM',
        Explanation: 'd/dx (x^3 - 3x + 2) = 3x^2 - 3.',
      },
      {
        Category: 'NEET',
        Subject: 'Physics',
        Topic: 'Kinematics',
        Question: 'A particle starts from rest with acceleration $a = 4\\text{ m/s}^2$. What is its velocity after $5\\text{ seconds}$?',
        'Option A': '20 m/s',
        'Option B': '25 m/s',
        'Option C': '15 m/s',
        'Option D': '10 m/s',
        'Correct Answer': '20 m/s',
        Difficulty: 'EASY',
        Explanation: 'v = u + at = 0 + 4(5) = 20 m/s.',
      },
      {
        Category: 'NEET',
        Subject: 'Chemistry',
        Topic: 'Atomic Structure',
        Question: 'What is the maximum number of electrons that can be accommodated in the $n = 3$ shell?',
        'Option A': '18',
        'Option B': '8',
        'Option C': '32',
        'Option D': '2',
        'Correct Answer': '18',
        Difficulty: 'MEDIUM',
        Explanation: 'Max electrons = 2n^2 = 2(3^2) = 18.',
      },
      {
        Category: 'NEET',
        Subject: 'Biology',
        Topic: 'Cell Biology',
        Question: 'Which organelle is universally known as the powerhouse of the cell?',
        'Option A': 'Mitochondria',
        'Option B': 'Ribosome',
        'Option C': 'Endoplasmic Reticulum',
        'Option D': 'Golgi Body',
        'Correct Answer': 'Mitochondria',
        Difficulty: 'EASY',
        Explanation: 'Mitochondria produce cellular energy in the form of ATP.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions_Template');
    XLSX.writeFile(wb, 'Online-Exam-Question-Bank-Template-Filled.xlsx');
    toast.success('Sample Excel template downloaded successfully!');
  };

  // 2. Parse uploaded Excel or CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoadingFile(true);
    setFile(selectedFile);
    setFileName(selectedFile.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          toast.error('The selected file contains no question rows.');
          setRows([]);
          setLoadingFile(false);
          return;
        }

        const mapped: ParsedRow[] = rawRows
          .map((r: any, idx: number) => {
            // Flexible column resolution
            const getField = (keys: string[]) => {
              for (const k of keys) {
                if (r[k] !== undefined && r[k] !== '') return r[k];
              }
              return '';
            };

            const optA = String(getField(['Option A', 'OptionA', 'option A', 'optionA', 'A']) || '').trim();
            const optB = String(getField(['Option B', 'OptionB', 'option B', 'optionB', 'B']) || '').trim();
            const optC = String(getField(['Option C', 'OptionC', 'option C', 'optionC', 'C']) || '').trim();
            const optD = String(getField(['Option D', 'OptionD', 'option D', 'optionD', 'D']) || '').trim();
            const opts = [optA, optB, optC, optD].filter(Boolean);

            const qText = String(getField(['Question', 'question', 'QuestionText', 'questionText', 'QUESTION']) || '').trim();
            const rawAns = String(getField(['Correct Answer', 'CorrectAnswer', 'correct_answer', 'Answer', 'answer', 'Key', 'key', 'CORRECT ANSWER']) || '').trim();

            let correctAnswer = rawAns;
            const idxMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
            if (idxMap[rawAns.toUpperCase()] !== undefined && opts[idxMap[rawAns.toUpperCase()]]) {
              correctAnswer = opts[idxMap[rawAns.toUpperCase()]];
            } else if (!correctAnswer && opts.length > 0) {
              correctAnswer = opts[0];
            }

            const rawCat = String(getField(['Category', 'category', 'CATEGORY']) || 'JEE').trim().toUpperCase();
            const rawSub = String(getField(['Subject', 'subject', 'SUBJECT']) || 'Mathematics').trim();
            const rawTopic = String(getField(['Topic', 'topic', 'TOPIC', 'Chapter', 'chapter']) || 'General').trim();
            const rawDiff = String(getField(['Difficulty', 'difficulty', 'DIFFICULTY']) || 'MEDIUM').trim().toUpperCase();
            
            // Marks & Negative Marks are configured when creating an Exam, not inside the question bank
            const marks = 4;
            const negativeMarks = 0;

            const rawExp = String(getField(['Explanation', 'explanation', 'Solution', 'solution']) || '').trim();

            return {
              id: `q-temp-${idx}`,
              category: rawCat || 'JEE',
              subjectName: rawSub || 'Mathematics',
              topicName: rawTopic || 'General',
              chapterName: `${rawSub}: ${rawTopic}`,
              questionText: qText,
              options: opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer,
              difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(rawDiff) ? rawDiff : 'MEDIUM',
              marks,
              negativeMarks,
              explanation: rawExp || null,
            };
          })
          .filter((q) => q.questionText.length > 0);

        setRows(mapped);
        if (mapped.length === 0) {
          toast.error('No valid questions found. Please check column headers.');
        } else {
          toast.success(`Loaded ${mapped.length} questions successfully!`);
        }
      } catch (err: any) {
        console.error('File parse error:', err);
        toast.error('Failed to parse Excel/CSV file. Please ensure it is valid.');
      } finally {
        setLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Remove a single question row before saving
  const handleRemoveRow = (idxToRemove: number) => {
    setRows(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // 3. Save all rows to PostgreSQL Master Bank
  const handleSaveAll = async () => {
    if (rows.length === 0) {
      toast.error('No questions available to import.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/master-questions/bulk', { questions: rows });
      const count = res.data?.count ?? rows.length;
      toast.success(`Successfully saved ${count} questions permanently to Master Question Bank!`);
      navigate('/competitive-exams/question-bank');
    } catch (err: any) {
      console.error('Bulk save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save questions to database.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics & Stats
  const subjectStats = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach(r => {
      map[r.subjectName] = (map[r.subjectName] || 0) + 1;
    });
    return map;
  }, [rows]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach(r => {
      map[r.category] = (map[r.category] || 0) + 1;
    });
    return map;
  }, [rows]);

  // Filtered rows for the review table
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesSub = selectedSubject === 'ALL' || r.subjectName === selectedSubject;
      const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        r.questionText.toLowerCase().includes(q) ||
        r.topicName.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q);
      return matchesSub && matchesCat && matchesSearch;
    });
  }, [rows, selectedSubject, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col">
      {/* ══ STANDARD PAGE HEADER ══ */}
      <PageHeader
        title="Bulk Question Import Studio"
        icon={<FileSpreadsheet className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/competitive-exams/question-bank')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/20"
            >
              <ArrowLeft size={15} />
              <span>Question Bank</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>Sample Template (.xlsx)</span>
            </button>
          </div>
        }
      />

      {/* ══ MAIN BODY ══ */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Pastel Feature Summary Strip */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl px-4 py-3 bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black leading-tight">Excel &amp; CSV Studio</div>
              <div className="text-[11px] font-semibold text-indigo-100">100–1000+ MCQs Ready</div>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 bg-[#EAF3FF] border border-[#D4E6FF] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D7E8FF] text-[#2563EB] flex items-center justify-center shrink-0 font-serif font-black text-base">
              ∑
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-tight">KaTeX Math</div>
              <div className="text-[11px] font-bold text-[#2563EB]">Auto $...$ Equations</div>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 bg-[#EAFAEE] border border-[#CBEFD6] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D1F4DC] text-[#16A34A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-tight">Live Review</div>
              <div className="text-[11px] font-bold text-[#16A34A]">Verify Before Saving</div>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 bg-[#FFF4E5] border border-[#FDE2BA] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE7C4] text-[#D97706] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-tight">PostgreSQL Sync</div>
              <div className="text-[11px] font-bold text-[#D97706]">Permanent Master Bank</div>
            </div>
          </div>
        </div>

        {/* Step 1 & Step 2 Equal-Height Studio Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 1: Sample Template & Format Guide */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4E5] text-[#D97706] border border-[#FDE2BA] text-[11px] font-black uppercase">
                Step 1 • Instructions
              </div>
              <h3 className="text-base font-black text-slate-900 mt-2.5">
                Download Official Excel Template
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Fill your questions in our standard Excel format. The parser automatically detects LaTeX math ($...$), option letters, and explanations.
              </p>

              <div className="mt-4 p-3.5 bg-[#F8FAFD] rounded-2xl border border-slate-200/80 text-[11px] space-y-2 font-semibold text-slate-600">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Required Spreadsheet Columns:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Category', 'Subject', 'Topic', 'Question', 'Option A - D', 'Correct Answer', 'Difficulty', 'Explanation'].map((col) => (
                    <span key={col} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-[10.5px]">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug pt-0.5">
                  Marks &amp; Negative Marking are configured directly when creating the Online Exam.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="w-full py-3 rounded-xl bg-[#FFF4E5] hover:bg-[#FFE9CC] text-[#D97706] border border-[#FDE2BA] font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download size={15} />
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>

          {/* Card 2: Upload Zone */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-4">
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFF] text-[#5B3DF5] border border-[#DDD4FE] text-[11px] font-black uppercase">
                  Step 2 • File Upload
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFAEE] text-[#16A34A] text-[10px] font-extrabold">.XLSX</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#2563EB] text-[10px] font-extrabold">.XLS</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FFF4E5] text-[#D97706] text-[10px] font-extrabold">.CSV</span>
                </div>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-2.5">
                Upload Your Filled Excel / CSV File
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select your completed spreadsheet. Preview, search, verify math formulas, and edit before importing permanently.
              </p>

              <label className="mt-4 flex-1 min-h-[210px] flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#C7BDFC] hover:border-[#5B3DF5] bg-[#F8F6FF]/60 hover:bg-[#F3EEFF]/70 transition cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-[#EDE9FE] text-[#5B3DF5] flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-xs font-black text-slate-800">
                  {fileName ? fileName : 'Click to select or drag and drop your file here'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {loadingFile && (
              <div className="p-3 bg-indigo-50 rounded-xl flex items-center gap-2 text-xs font-bold text-indigo-700">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Reading and parsing questions from Excel...</span>
              </div>
            )}

            {fileName && !loadingFile && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Loaded File: <strong>{fileName}</strong></span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px]">
                    {rows.length} Questions Found
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFileName('');
                    setRows([]);
                  }}
                  className="text-xs text-emerald-700 hover:text-rose-600 underline cursor-pointer"
                >
                  Clear File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ STEP 3: QUESTIONS PREVIEW & VERIFICATION TABLE ══ */}
        {rows.length > 0 && (
          <div className="space-y-4">
            {/* KPI Badges - Unified Pastel Stat Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-gradient-to-br from-[#5B3DF5] to-[#7B3DF5] p-4 rounded-2xl text-white shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Total Questions</span>
                <div className="text-2xl font-black text-white mt-0.5 tabular-nums">{rows.length}</div>
                <div className="text-[11px] font-semibold text-white/85">Ready to sync</div>
              </div>
              <div className="bg-[#EAF3FF] p-4 rounded-2xl border border-[#D4E6FF]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">Subjects Found</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">{Object.keys(subjectStats).length}</div>
                <div className="text-[11px] font-semibold text-slate-600 truncate">
                  {Object.keys(subjectStats).join(', ') || 'General'}
                </div>
              </div>
              <div className="bg-[#EAFAEE] p-4 rounded-2xl border border-[#CBEFD6]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#16A34A]">Categories</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">{Object.keys(categoryStats).length}</div>
                <div className="text-[11px] font-semibold text-slate-600 truncate">
                  {Object.keys(categoryStats).join(', ') || 'JEE'}
                </div>
              </div>
              <div className="bg-[#FFF4E5] p-4 rounded-2xl border border-[#FDE2BA]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706]">Destination</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">PostgreSQL</div>
                <div className="text-[11px] font-semibold text-slate-600">Master Bank (Permanent)</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Subject Tabs */}
                <button
                  type="button"
                  onClick={() => setSelectedSubject('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedSubject === 'ALL'
                      ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All Subjects ({rows.length})
                </button>
                {Object.entries(subjectStats).map(([sub, count]) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedSubject === sub
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className="text-[10px] font-black opacity-80">({count})</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions in file..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500">
                  Showing <strong className="text-slate-900">{filteredRows.length}</strong> of {rows.length} questions
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  KaTeX Math Formulas Enabled ($...$)
                </span>
              </div>

              {filteredRows.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition space-y-3"
                >
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {r.category}
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {r.subjectName}
                      </span>
                      {r.topicName && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {r.topicName}
                        </span>
                      )}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.difficulty}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rows.indexOf(r))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove this question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-bold text-slate-900 leading-relaxed pl-0.5">
                    <LatexRenderer text={r.questionText} />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {r.options.map((opt, oIdx) => {
                      const optLetter = String.fromCharCode(65 + oIdx);
                      const isCorrect = String(opt).trim() === String(r.correctAnswer).trim() || optLetter === String(r.correctAnswer).trim();

                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-black ring-1 ring-emerald-400'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {optLetter}
                          </span>
                          <div className="flex-1 leading-snug">
                            <LatexRenderer text={opt} />
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                              <Check size={11} /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {r.explanation && (
                    <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <strong>Solution / Explanation:</strong> {r.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STICKY BOTTOM SAVE ACTION BAR ══ */}
        {rows.length > 0 && (
          <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#DDD4FE] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#5B3DF5]" />
                Ready to Import {rows.length} Questions to Central Master Bank
              </h4>
              <p className="text-xs text-slate-500">
                All questions will be stored permanently in PostgreSQL and immediately available in Question Bank.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setRows([]);
                  setFile(null);
                  setFileName('');
                }}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
              >
                Cancel & Clear
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAll}
                className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import All ({rows.length}) Questions Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportQuestionsPage;
