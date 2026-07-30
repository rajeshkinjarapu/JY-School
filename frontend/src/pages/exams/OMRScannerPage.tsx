import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, RefreshCw,
  Download, Save, Trash2, Eye, ChevronDown, BookOpen,
  FlaskConical, Calculator, Atom, Search, X
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScannedResult {
  name: string;
  student_id: string | null;
  answers: Record<string, string>;
  total_questions: number;
  filled_count: number;
  blank_count: number;
  score: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  max_score: number;
  maths_score: number | null;
  physics_score: number | null;
  chem_score: number | null;
  error: string | null;
  imagePreview?: string;
  status: 'pending' | 'scanning' | 'done' | 'error';
}

interface SavedExam {
  id: string;
  examName: string;
  className: string;
  examDate: string;
  answerKey: Record<string, string>;
}

const OPTIONS = ['A', 'B', 'C', 'D'];
const SUBJECTS = [
  { label: '📘 Maths', start: 1, end: 25, color: 'blue' },
  { label: '🔴 Physics', start: 26, end: 50, color: 'purple' },
  { label: '🟡 Chemistry', start: 51, end: 75, color: 'amber' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const OMRScannerPage: React.FC = () => {
  // Config
  const [examName, setExamName] = useState('');
  const [className, setClassName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({});
  const [keyTab, setKeyTab] = useState<'manual' | 'csv'>('manual');
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Upload
  const [fileQueue, setFileQueue] = useState<ScannedResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Results view
  const [activeResult, setActiveResult] = useState<ScannedResult | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  // Load saved exams on mount
  useEffect(() => {
    loadSavedExams();
  }, []);

  const loadSavedExams = async () => {
    try {
      const res = await api.get('/api/omr/answer-keys');
      setSavedExams(res.data || []);
    } catch {}
  };

  const loadExamKey = (examId: string) => {
    const exam = savedExams.find(e => e.id === examId);
    if (exam) {
      setAnswerKey(exam.answerKey);
      setExamName(exam.examName);
      setClassName(exam.className);
      setSelectedExamId(examId);
      toast.success(`"${exam.examName}" answer key loaded!`);
    }
  };

  // ─── Answer Key Grid ──────────────────────────────────────────────────────
  const toggleKey = (qNum: string, opt: string) => {
    setAnswerKey(prev => {
      const updated = { ...prev };
      if (updated[qNum] === opt) delete updated[qNum];
      else updated[qNum] = opt;
      return updated;
    });
  };

  const handleCsvKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const keyObj: Record<string, string> = {};
      let qCount = 1;
      text.split(/\r?\n/).forEach(line => {
        line.split(/[,;\t\s]+/).filter(Boolean).forEach(part => {
          const clean = part.toUpperCase().trim();
          if (clean.includes(':')) {
            const [q, a] = clean.split(':');
            if (q && OPTIONS.includes(a)) keyObj[q] = a;
          } else if (OPTIONS.includes(clean)) {
            keyObj[qCount.toString()] = clean;
            qCount++;
          }
        });
      });
      if (Object.keys(keyObj).length > 0) {
        setAnswerKey(keyObj);
        toast.success(`Answer key loaded: ${Object.keys(keyObj).length} questions`);
      } else {
        toast.error('Could not parse answer key from file');
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    let csv = 'QNo,Subject,Answer\n';
    for (let i = 1; i <= 75; i++) {
      const sub = i <= 25 ? 'Maths' : i <= 50 ? 'Physics' : 'Chemistry';
      csv += `${i},${sub},${OPTIONS[(i - 1) % 4]}\n`;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'OMR_AnswerKey_Template.csv';
    a.click();
  };

  const handleSaveKey = async () => {
    if (!examName.trim() || !className.trim()) {
      toast.error('Please enter Exam Name and Class Name first');
      return;
    }
    if (Object.keys(answerKey).length === 0) {
      toast.error('Please set the answer key first');
      return;
    }
    setSavingKey(true);
    try {
      await api.post('/api/omr/answer-key', { examName, className, examDate, answerKey });
      toast.success('Answer key saved successfully!');
      await loadSavedExams();
    } catch {
      toast.error('Failed to save answer key');
    } finally {
      setSavingKey(false);
    }
  };

  // ─── File Upload & Scanning ───────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Load PDF.js from CDN to avoid Vite bundler crashes
  const loadPdfJs = async (): Promise<any> => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Convert PDF pages to images using PDF.js
  const pdfToImages = async (file: File): Promise<Array<{ data: string; name: string; preview: string }>> => {
    const pdfjsLib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: Array<{ data: string; name: string; preview: string }> = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      images.push({
        data: dataUrl,
        name: `${file.name} - Page ${pageNum}`,
        preview: dataUrl,
      });
    }
    return images;
  };

  const addFilesToQueue = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newItems: ScannedResult[] = [];

    for (const file of arr) {
      if (file.type === 'application/pdf') {
        try {
          toast.loading(`Converting PDF: ${file.name}...`, { id: 'pdf-convert' });
          const pages = await pdfToImages(file);
          toast.dismiss('pdf-convert');
          for (const page of pages) {
            newItems.push({
              name: page.name,
              student_id: null,
              answers: {},
              total_questions: 75,
              filled_count: 0,
              blank_count: 0,
              score: null,
              correct_count: null,
              wrong_count: null,
              max_score: 300,
              maths_score: null,
              physics_score: null,
              chem_score: null,
              error: null,
              imagePreview: page.preview,
              status: 'pending',
            });
          }
          toast.success(`PDF converted: ${pages.length} pages added to queue`);
        } catch (err) {
          toast.error(`Failed to convert PDF: ${file.name}`);
        }
      } else {
        const preview = await fileToBase64(file);
        newItems.push({
          name: file.name,
          student_id: null,
          answers: {},
          total_questions: 75,
          filled_count: 0,
          blank_count: 0,
          score: null,
          correct_count: null,
          wrong_count: null,
          max_score: 300,
          maths_score: null,
          physics_score: null,
          chem_score: null,
          error: null,
          imagePreview: preview,
          status: 'pending',
        });
      }
    }

    setFileQueue(prev => [...prev, ...newItems]);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) addFilesToQueue(e.dataTransfer.files);
  }, [answerKey]);

  const handleBulkScan = async () => {
    const pending = fileQueue.filter(f => f.status === 'pending');
    if (pending.length === 0) { toast.error('No pending files to scan'); return; }
    if (Object.keys(answerKey).length === 0) {
      toast.error('Please set the answer key before scanning');
      return;
    }

    setIsScanning(true);
    setSavedToDb(false);
    let allDone: ScannedResult[] = [...fileQueue];

    // Process one-by-one with progress
    for (let i = 0; i < allDone.length; i++) {
      if (allDone[i].status !== 'pending') continue;
      allDone[i] = { ...allDone[i], status: 'scanning' };
      setFileQueue([...allDone]);

      try {
        const imageData = allDone[i].imagePreview!;
        const res = await api.post('/api/omr/bulk-scan', {
          images: [{ data: imageData, name: allDone[i].name }],
          answer_key: answerKey,
        });
        const r = res.data.results[0];
        allDone[i] = {
          ...allDone[i],
          ...r,
          imagePreview: allDone[i].imagePreview,
          status: r.error ? 'error' : 'done',
        };
      } catch (err: any) {
        allDone[i] = { ...allDone[i], status: 'error', error: err.message || 'Scan failed' };
      }

      setFileQueue([...allDone]);
      // Auto-select first successful result
      if (allDone[i].status === 'done' && !activeResult) {
        setActiveResult(allDone[i]);
      }
    }

    setIsScanning(false);
    const doneCount = allDone.filter(f => f.status === 'done').length;
    toast.success(`Scanning complete! ${doneCount} sheets processed.`);

    // Auto-save if enabled
    if (autoSave && selectedExamId && doneCount > 0) {
      await doSaveResults(selectedExamId, allDone.filter(f => f.status === 'done'));
    }
  };

  const doSaveResults = async (examId: string, results: ScannedResult[]) => {
    try {
      await api.post('/api/omr/results', { omrExamId: examId, results });
      setSavedToDb(true);
      toast.success('Results saved to database!');
    } catch {
      toast.error('Failed to save results');
    }
  };

  const handleSaveResults = async () => {
    if (!selectedExamId) {
      toast.error('Please save the answer key first to get an exam ID');
      return;
    }
    const doneResults = fileQueue.filter(f => f.status === 'done');
    if (doneResults.length === 0) { toast.error('No scanned results to save'); return; }
    await doSaveResults(selectedExamId, doneResults);
  };

  const doneResults = fileQueue.filter(f => f.status === 'done');
  const keyCount = Object.keys(answerKey).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" /> AI OMR Scanner
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini Vision AI • Bulk scan images & PDFs</p>
        </div>
        {doneResults.length > 0 && (
          <div className="flex items-center gap-3">
            {savedToDb && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Saved to DB
              </span>
            )}
            <button
              onClick={handleSaveResults}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Save All Results
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOX 1: EXAM CONFIG + ANSWER KEY                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Step 1: Exam Configuration & Answer Key
          </h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Exam Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Exam Name *</label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="JEE Mains Cumulative Test"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Class Name *</label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="7th B"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Load saved exam */}
          {savedExams.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <ChevronDown className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 whitespace-nowrap">Load Saved:</span>
              <select
                value={selectedExamId}
                onChange={e => loadExamKey(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg px-2 py-1.5 font-medium text-gray-800 dark:text-white"
              >
                <option value="">-- Select saved exam --</option>
                {savedExams.map(e => (
                  <option key={e.id} value={e.id}>{e.examName} ({e.className})</option>
                ))}
              </select>
            </div>
          )}

          {/* Answer Key Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setKeyTab('manual')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${keyTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-500'}`}
                >
                  📝 Manual Grid
                </button>
                <button
                  onClick={() => setKeyTab('csv')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${keyTab === 'csv' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-500'}`}
                >
                  📊 Upload CSV
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">{keyCount}/75 set</span>
                {keyCount > 0 && (
                  <button onClick={() => setAnswerKey({})} className="text-xs text-red-500 hover:underline font-bold">Clear</button>
                )}
                <button
                  onClick={handleSaveKey}
                  disabled={savingKey}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {savingKey ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save Key
                </button>
              </div>
            </div>

            {keyTab === 'manual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {SUBJECTS.map((sub) => (
                  <div key={sub.label} className={`rounded-xl border p-3 bg-${sub.color}-50 dark:bg-${sub.color}-900/10 border-${sub.color}-200 dark:border-${sub.color}-800`}>
                    <h4 className={`text-xs font-black text-${sub.color}-800 dark:text-${sub.color}-300 mb-3 uppercase tracking-wider`}>
                      {sub.label} (Q{sub.start.toString().padStart(2,'0')}–Q{sub.end.toString().padStart(2,'0')})
                    </h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {Array.from({ length: sub.end - sub.start + 1 }, (_, i) => {
                        const qNum = (sub.start + i).toString();
                        return (
                          <div key={qNum} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-lg px-2 py-1 border border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-black text-gray-500 w-7 shrink-0">Q{qNum.padStart(2,'0')}</span>
                            {OPTIONS.map(opt => (
                              <button
                                key={opt}
                                onClick={() => toggleKey(qNum, opt)}
                                className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                  answerKey[qNum] === opt
                                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center space-y-4">
                <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Upload CSV Answer Key</p>
                  <p className="text-xs text-gray-500 mt-1">Format: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">QNo,Subject,Answer</code> or just <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">1:A, 2:B, ...</code></p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <input type="file" accept=".csv,.txt" onChange={handleCsvKeyUpload} className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                  <button onClick={downloadSampleCsv} className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:underline">
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOX 2 + BOX 3: UPLOAD + RESULTS (side by side)                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* BOX 2: UPLOAD + QUEUE */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4" /> Step 2: Upload OMR Sheets
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Drop Zone */}
            <div
              ref={dropRef}
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 text-center bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
            >
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => e.target.files && addFilesToQueue(e.target.files)}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 dark:text-gray-300">Drop images or PDFs here</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP, PDF • Multi-file supported</p>
                </div>
              </div>
            </div>

            {/* Auto-save toggle */}
            {savedExams.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Auto-save results after scan</span>
                <button
                  onClick={() => setAutoSave(prev => !prev)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${autoSave ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${autoSave ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            )}

            {/* File Queue */}
            {fileQueue.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{fileQueue.length} Files Queued</span>
                  <button onClick={() => { setFileQueue([]); setActiveResult(null); setSavedToDb(false); }} className="text-xs text-red-500 hover:underline font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>
                {fileQueue.map((f, idx) => (
                  <div
                    key={idx}
                    onClick={() => f.status === 'done' && setActiveResult(f)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      f.status === 'done' && activeResult?.name === f.name
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                    } ${f.status === 'done' ? 'bg-white dark:bg-gray-900' : f.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}
                  >
                    {f.imagePreview && (
                      <img src={f.imagePreview} alt="" className="w-10 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{f.name}</p>
                      {f.student_id && <p className="text-[10px] font-mono text-indigo-600 mt-0.5">{f.student_id}</p>}
                      {f.error && <p className="text-[10px] text-red-500 mt-0.5">{f.error}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {f.status === 'pending' && <span className="text-[10px] text-gray-400 font-bold">PENDING</span>}
                      {f.status === 'scanning' && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                      {f.status === 'done' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-black text-emerald-700">{f.score}/{f.max_score}</span>
                        </>
                      )}
                      {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scan Button */}
            <button
              onClick={handleBulkScan}
              disabled={isScanning || fileQueue.filter(f => f.status === 'pending').length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
            >
              {isScanning ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Scanning with AI...</>
              ) : (
                <><Search className="w-5 h-5" /> Start Bulk AI Scan ({fileQueue.filter(f => f.status === 'pending').length} pending)</>
              )}
            </button>
          </div>
        </div>

        {/* BOX 3: RESULTS VIEW */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" /> Step 3: Scan Results
              {activeResult && <span className="ml-auto text-emerald-100 font-normal text-xs normal-case">{activeResult.name}</span>}
            </h2>
          </div>

          {activeResult ? (
            <div className="p-5 space-y-4">
              {/* Split View */}
              <div className="grid grid-cols-2 gap-4">
                {/* OMR Image Preview */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">OMR Sheet</p>
                  {activeResult.imagePreview ? (
                    <img
                      src={activeResult.imagePreview}
                      alt="OMR Sheet"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 object-cover max-h-64"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs">No Preview</div>
                  )}
                </div>

                {/* Score Panel */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Student ID</p>
                    <p className="text-lg font-black text-indigo-600 font-mono">{activeResult.student_id || '—'}</p>
                  </div>
                  <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Score</p>
                    <p className="text-3xl font-black text-white mt-1">{activeResult.score ?? '—'}</p>
                    <p className="text-xs text-gray-500">out of {activeResult.max_score}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{activeResult.correct_count ?? 0}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Correct +4</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-rose-700 dark:text-rose-400">{activeResult.wrong_count ?? 0}</p>
                      <p className="text-[10px] text-rose-600 font-bold">Wrong -1</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Calculator className="w-3.5 h-3.5" />, label: 'Maths', score: activeResult.maths_score, color: 'blue' },
                  { icon: <Atom className="w-3.5 h-3.5" />, label: 'Physics', score: activeResult.physics_score, color: 'purple' },
                  { icon: <FlaskConical className="w-3.5 h-3.5" />, label: 'Chemistry', score: activeResult.chem_score, color: 'amber' },
                ].map((sub) => (
                  <div key={sub.label} className={`bg-${sub.color}-50 dark:bg-${sub.color}-900/20 border border-${sub.color}-200 dark:border-${sub.color}-800 rounded-xl p-3 text-center`}>
                    <div className={`flex items-center justify-center gap-1 text-${sub.color}-600 dark:text-${sub.color}-400 mb-1`}>
                      {sub.icon}
                      <span className="text-[10px] font-bold">{sub.label}</span>
                    </div>
                    <p className={`text-xl font-black text-${sub.color}-700 dark:text-${sub.color}-300`}>{sub.score ?? '—'}</p>
                    <p className="text-[10px] text-gray-400">/ 100</p>
                  </div>
                ))}
              </div>

              {/* Answer Grid */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Question-wise Answers</p>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-52 overflow-y-auto p-1">
                  {Array.from({ length: 75 }, (_, i) => {
                    const qNum = (i + 1).toString();
                    const studentAns = activeResult.answers[qNum];
                    const keyAns = answerKey[qNum];
                    const isCorrect = keyAns && studentAns === keyAns;
                    const isWrong = keyAns && studentAns && studentAns !== keyAns && studentAns !== 'UNATTEMPTED';

                    return (
                      <div
                        key={qNum}
                        title={keyAns ? `Key: ${keyAns}` : ''}
                        className={`rounded-lg border text-center py-1.5 px-1 text-[10px] font-bold ${
                          !studentAns || studentAns === 'UNATTEMPTED'
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                            : isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 text-emerald-800 dark:text-emerald-400'
                            : isWrong
                            ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 text-rose-800 dark:text-rose-400'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        <div className="text-gray-400">Q{qNum.padStart(2,'0')}</div>
                        <div className="text-base">{studentAns || '–'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-80 flex flex-col items-center justify-center text-center p-8">
              <Eye className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
              <p className="font-bold text-gray-400 dark:text-gray-600">No Result Selected</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 max-w-xs">Upload OMR sheets and start scanning. Click on any completed result to view here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUMMARY TABLE (all scanned results)                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {doneResults.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3 flex items-center justify-between">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> All Scanned Results ({doneResults.length} students)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">Maths</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 uppercase tracking-wider">Physics</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider">Chemistry</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Correct</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Wrong</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...doneResults]
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                          {r.student_id || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-black text-blue-700 dark:text-blue-400">{r.maths_score ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-sm font-black text-purple-700 dark:text-purple-400">{r.physics_score ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-sm font-black text-amber-700 dark:text-amber-400">{r.chem_score ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600">{r.correct_count ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-rose-600">{r.wrong_count ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-base font-black text-gray-900 dark:text-white">{r.score ?? '—'}</span>
                        <span className="text-xs text-gray-400">/{r.max_score}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setActiveResult(r)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
