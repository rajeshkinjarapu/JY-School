import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, Trash2, Edit, Copy, RefreshCw, Sparkles, BookOpen,
  Database, X, FileSpreadsheet, Download, Upload, Image as ImageIcon,
  FolderOpen, ChevronRight, Zap, CheckSquare, Square, Eye, EyeOff, Printer, Layers,
  CheckCircle2, LayoutGrid, List
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { LatexRenderer, parseSingleRawQuestionAndOptions } from '../../pages/exams/CompetitiveExamsPage';
import { formatMCQText } from '../../pages/question-bank/MCQPaperGeneratorPage';
import { getPhotoUrl } from '../../utils/photo';

const CATEGORY_OPTIONS = ['ALL', 'SCHOOL', 'JEE', 'NEET', 'NAVODAYA', 'APPSC', 'SSC', 'GENERAL'];
const CLASS_PRESETS = ['10th', '9th', '8th', '7th', '6th', '5th', 'Foundation', 'Navodaya', 'IIT-JEE', 'NEET'];
const STANDARD_SUBJECTS = [
  'Telugu',
  'Hindi',
  'English',
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Social',
  'Mental Ability',
  'General',
];
const QUESTION_TYPES = [
  { key: 'ALL', label: 'All Types' },
  { key: 'MCQ', label: 'MCQ Single' },
  { key: 'INTEGER', label: 'Numerical / Integer' },
  { key: 'ASSERTION_REASON', label: 'Assertion & Reason' },
  { key: 'TRUE_FALSE', label: 'True / False' },
];

const normalizeSubjectLabel = (raw: string = ''): string => {
  const s = (raw || '').trim();
  if (!s) return 'General';
  const lower = s.toLowerCase();
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('phys')) return 'Physics';
  if (lower.includes('chem')) return 'Chemistry';
  if (lower.includes('bio') || lower.includes('botan') || lower.includes('zool')) return 'Biology';
  if (lower.includes('telugu')) return 'Telugu';
  if (lower.includes('hindi')) return 'Hindi';
  if (lower.includes('eng')) return 'English';
  if (lower.includes('soc') || lower.includes('hist') || lower.includes('geog') || lower.includes('civ')) return 'Social';
  if (lower.includes('scien') || lower.includes('evs')) return 'Science';
  if (lower.includes('mental') || lower.includes('reason') || lower.includes('arith') || lower.includes('mat')) return 'Mental Ability';
  if (lower === 'general') return 'General';
  return s.split(':')[0].trim() || 'General';
};

const extractChapterLabel = (q: any): string => {
  const raw = (q.topicName || q.chapterName || 'General').trim();
  if (!raw) return 'General';
  if (raw.includes(':')) {
    const after = raw.split(':').slice(1).join(':').trim();
    return after || raw;
  }
  return raw;
};

const safeParseOptions = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? ''));
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? ''));
    } catch {
      return [];
    }
  }
  return ['Option A', 'Option B', 'Option C', 'Option D'];
};

export interface MasterQuestionBankWorkspaceProps {
  exams: any[];
  selectedExamId?: string;
  setSelectedExamId?: (id: string) => void;
  onExamsUpdated: () => void;
  presetSubject?: string;
  openBulkImportInitially?: boolean;
  onConsumeBulkImportFlag?: () => void;
  navigate: any;
}

export const MasterQuestionBankWorkspace: React.FC<MasterQuestionBankWorkspaceProps> = ({
  exams,
  onExamsUpdated,
  presetSubject,
  openBulkImportInitially,
  onConsumeBulkImportFlag,
  navigate,
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<string[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>(presetSubject || 'ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSolutions, setShowSolutions] = useState<boolean>(true);
  const [compactView, setCompactView] = useState<boolean>(false);
  const [showEmptySubjects, setShowEmptySubjects] = useState<boolean>(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Multi-Select Cart
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [composerState, setComposerState] = useState<{ open: boolean; mode: 'ADD' | 'EDIT' | 'DUPLICATE'; question?: any }>({
    open: false,
    mode: 'ADD',
  });
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [showAutoPickModal, setShowAutoPickModal] = useState<boolean>(false);
  const [showSendToExamModal, setShowSendToExamModal] = useState<boolean>(false);

  const fetchMasterQuestions = async () => {
    setLoading(true);
    try {
      const [mqRes, subRes, clsRes] = await Promise.all([
        api.get('/api/master-questions'),
        api.get('/api/subjects?limit=200').catch(() => null),
        api.get('/api/classes?limit=200').catch(() => null),
      ]);
      const list = mqRes?.data?.data || mqRes?.data || [];
      setQuestions(Array.isArray(list) ? list : []);

      const dbSubNames: string[] = (subRes?.data?.data || [])
        .map((s: any) => normalizeSubjectLabel(s.name))
        .filter(Boolean);
      setSchoolSubjects(Array.from(new Set<string>(dbSubNames)));

      const dbClsNames: string[] = (clsRes?.data?.data || [])
        .map((c: any) => (c.name || '').trim())
        .filter(Boolean);
      setSchoolClasses(Array.from(new Set<string>(dbClsNames)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load Master Question Bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterQuestions();
  }, []);

  useEffect(() => {
    if (presetSubject) {
      setSelectedSubject(normalizeSubjectLabel(presetSubject));
      setSelectedChapter('ALL');
    }
  }, [presetSubject]);

  useEffect(() => {
    if (openBulkImportInitially) {
      setShowExcelModal(true);
      onConsumeBulkImportFlag?.();
    }
  }, [openBulkImportInitially]);

  // Combined subjects list (DB + Questions + Standard)
  const subjectList = useMemo(() => {
    const counts: Record<string, number> = {};
    const chaptersBySubject: Record<string, Record<string, number>> = {};

    STANDARD_SUBJECTS.forEach((s) => {
      counts[s] = 0;
      chaptersBySubject[s] = {};
    });
    schoolSubjects.forEach((s) => {
      if (counts[s] === undefined) {
        counts[s] = 0;
        chaptersBySubject[s] = {};
      }
    });

    questions.forEach((q: any) => {
      // Respect Category / Class pre-filters in sidebar counts if desired? Better keep Subject totals matching current Category+Class!
      const matchesCat = selectedCategory === 'ALL' || (q.category || 'GENERAL').toUpperCase() === selectedCategory;
      const matchesCls = selectedClass === 'ALL' || (q.className || '').toLowerCase() === selectedClass.toLowerCase();
      if (!matchesCat || !matchesCls) return;

      const sub = normalizeSubjectLabel(q.subjectName || q.subject?.name || q.chapterName);
      counts[sub] = (counts[sub] || 0) + 1;
      if (!chaptersBySubject[sub]) chaptersBySubject[sub] = {};
      const ch = extractChapterLabel(q);
      chaptersBySubject[sub][ch] = (chaptersBySubject[sub][ch] || 0) + 1;
    });

    // Put subjects with questions first, then standard school subjects
    const allNames = Object.keys(counts).sort((a, b) => {
      if ((counts[b] || 0) !== (counts[a] || 0)) return (counts[b] || 0) - (counts[a] || 0);
      return a.localeCompare(b);
    });

    return { allNames, counts, chaptersBySubject };
  }, [questions, schoolSubjects, selectedCategory, selectedClass]);

  const classOptions = useMemo(() => {
    const fromQs = questions.map((q) => (q.className || '').trim()).filter(Boolean);
    return ['ALL', ...Array.from(new Set([...schoolClasses, ...CLASS_PRESETS, ...fromQs]))];
  }, [questions, schoolClasses]);

  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return questions.filter((q: any) => {
      const catOk = selectedCategory === 'ALL' || (q.category || 'GENERAL').toUpperCase() === selectedCategory;
      const clsOk = selectedClass === 'ALL' || (q.className || '').toLowerCase() === selectedClass.toLowerCase();
      const sub = normalizeSubjectLabel(q.subjectName || q.subject?.name || q.chapterName);
      const subOk = selectedSubject === 'ALL' || sub === selectedSubject;
      const ch = extractChapterLabel(q);
      const chOk = selectedChapter === 'ALL' || ch === selectedChapter;
      const typeOk = selectedType === 'ALL' || (q.questionType || 'MCQ').toUpperCase() === selectedType;
      const diffOk = difficultyFilter === 'ALL' || (q.difficulty || 'MEDIUM').toUpperCase() === difficultyFilter;
      const searchOk =
        !qLower ||
        (q.questionText || '').toLowerCase().includes(qLower) ||
        (q.chapterName || '').toLowerCase().includes(qLower) ||
        (q.subjectName || '').toLowerCase().includes(qLower) ||
        (q.options || '').toLowerCase().includes(qLower);

      return catOk && clsOk && subOk && chOk && typeOk && diffOk && searchOk;
    });
  }, [questions, selectedCategory, selectedClass, selectedSubject, selectedChapter, selectedType, difficultyFilter, searchQuery]);

  const difficultyStats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    filteredQuestions.forEach((q) => {
      const d = (q.difficulty || 'MEDIUM').toUpperCase();
      if (d === 'EASY') easy += 1;
      else if (d === 'HARD') hard += 1;
      else medium += 1;
    });
    return { easy, medium, hard };
  }, [filteredQuestions]);

  const handleSyncFromExams = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/api/master-questions/sync-from-exams');
      toast.success(res.data?.message || 'Synced exam questions into Master Bank!');
      await fetchMasterQuestions();
      onExamsUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to sync exam questions');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question permanently from Master Question Bank?')) return;
    try {
      await api.delete(`/api/master-questions/${id}`);
      toast.success('Question deleted');
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      await fetchMasterQuestions();
      onExamsUpdated();
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allFilteredSelected =
    filteredQuestions.length > 0 && filteredQuestions.every((q) => selectedIds.includes(q.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const visibleSet = new Set(filteredQuestions.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...filteredQuestions.map((q) => q.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const handleSendToPaperGenerator = (idsToSend: string[]) => {
    const picked = questions.filter((q) => idsToSend.includes(q.id));
    if (picked.length === 0) {
      toast.error('Select at least one question');
      return;
    }

    const bySubject: Record<string, string[]> = {};
    const keysBySubject: Record<string, Record<string, string>> = {};
    const qCounts: Record<string, number> = {};

    picked.forEach((q) => {
      const sub = normalizeSubjectLabel(q.subjectName || q.subject?.name || q.chapterName);
      if (!bySubject[sub]) {
        bySubject[sub] = [];
        keysBySubject[sub] = {};
        qCounts[sub] = 0;
      }
      qCounts[sub] += 1;
      const num = qCounts[sub];
      const opts = safeParseOptions(q.options);

      let block = `${num}. ${(q.questionText || '').trim()}\n`;
      if (q.imageUrl) {
        block += `[IMAGE:${q.imageUrl}]\n`;
      }
      if ((q.questionType || 'MCQ').toUpperCase() !== 'INTEGER' && opts.length > 0) {
        opts.forEach((opt, oIdx) => {
          block += `(${String.fromCharCode(65 + oIdx)}) ${opt.trim()}\n`;
        });
        const ansIdx = opts.findIndex((o) => o.trim() === (q.correctAnswer || '').trim());
        keysBySubject[sub][String(num)] =
          ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : String(q.correctAnswer || 'A').trim();
      } else {
        keysBySubject[sub][String(num)] = String(q.correctAnswer || '');
      }
      bySubject[sub].push(block.trim());
    });

    const subjectContents: Record<string, string> = {};
    Object.entries(bySubject).forEach(([sub, blocks]) => {
      subjectContents[sub] = formatMCQText(blocks.join('\n\n'));
    });

    localStorage.setItem(
      'mcq_imported_from_bank',
      JSON.stringify({
        subjects: Object.keys(subjectContents),
        subjectContents,
        answerKeys: keysBySubject,
      })
    );
    toast.success(`Opening ${picked.length} questions in A4 Paper Generator!`);
    navigate('/question-bank/mcq-generator?fromBank=true');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. CLEAN SINGLE-LINE SUMMARY & UNIFIED FILTER BAR (Soft Light-Colorful) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
        {/* Top Row: Live Summary Pills + Primary Action Buttons (Never wraps Stream awkwardly) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 text-xs font-black flex items-center gap-1.5">
              <Database size={13} className="text-indigo-600" />
              {questions.length} Questions
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 text-xs font-bold">
              {subjectList.allNames.filter((s) => (subjectList.counts[s] || 0) > 0).length} Active Subjects
            </span>
            {questions.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-600">
                <span className="inline-flex items-center gap-1 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{difficultyStats.easy} Easy</span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{difficultyStats.medium} Med</span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-rose-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{difficultyStats.hard} Hard</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncFromExams}
              disabled={syncing}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Import any existing Online Exam questions into Master Bank"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>Sync Exams</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAutoPickModal(true)}
              disabled={questions.length === 0}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              title="Randomly pick Easy/Medium/Hard questions by count"
            >
              <Zap size={13} />
              <span>Auto-Pick Paper</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExcelModal(true)}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span>Bulk Excel</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/competitive-exams/ai-studio')}
              className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles size={14} />
              <span>AI Extract</span>
            </button>

            <button
              type="button"
              onClick={() => setComposerState({ open: true, mode: 'ADD' })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Second Row: Sleek Single-Line Search + Stream + Class + Type + Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions, formulas, chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Streams' : cat === 'NAVODAYA' ? 'Navodaya' : cat === 'SCHOOL' ? 'School' : cat === 'GENERAL' ? 'General' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Classes' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="EASY">Easy ({difficultyStats.easy})</option>
              <option value="MEDIUM">Medium ({difficultyStats.medium})</option>
              <option value="HARD">Hard ({difficultyStats.hard})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT SUBJECT & CHAPTER TREE + RIGHT QUESTIONS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Smart Subject & Chapter Explorer */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2 lg:sticky lg:top-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" /> Subjects & Chapters
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedSubject('ALL');
              setSelectedChapter('ALL');
            }}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
              selectedSubject === 'ALL'
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                : 'text-slate-700 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-600" /> All Subjects
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedSubject === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {questions.length}
            </span>
          </button>

          {(() => {
            const activeSubs = subjectList.allNames.filter((s) => (subjectList.counts[s] || 0) > 0 || selectedSubject === s);
            const emptySubs = subjectList.allNames.filter((s) => (subjectList.counts[s] || 0) === 0 && selectedSubject !== s);
            const renderSubjectNode = (subName: string) => {
              const count = subjectList.counts[subName] || 0;
              const chapters = subjectList.chaptersBySubject[subName] || {};
              const chapterEntries = Object.entries(chapters).sort((a, b) => b[1] - a[1]);
              const isSelected = selectedSubject === subName;
              const isExpanded = isSelected || expandedSubjects[subName];

              return (
                <div key={subName} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subName);
                      setSelectedChapter('ALL');
                      setExpandedSubjects((prev) => ({ ...prev, [subName]: !prev[subName] }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : count > 0
                        ? 'bg-slate-50/70 text-slate-800 hover:bg-indigo-50/60 border border-slate-100'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                          isExpanded && chapterEntries.length > 0 ? 'rotate-90 text-blue-600' : ''
                        }`}
                      />
                      {count > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                      <span className="truncate">{subName}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : count > 0
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>

                  {isExpanded && chapterEntries.length > 0 && (
                    <div className="pl-5 pr-1 space-y-0.5 border-l-2 border-indigo-100 ml-3.5">
                      {chapterEntries.map(([chName, chCount]) => {
                        const isChActive = isSelected && selectedChapter === chName;
                        return (
                          <button
                            key={chName}
                            type="button"
                            onClick={() => {
                              setSelectedSubject(subName);
                              setSelectedChapter(isChActive ? 'ALL' : chName);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition cursor-pointer ${
                              isChActive
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <FolderOpen className="w-3 h-3 shrink-0 opacity-75" />
                              <span className="truncate">{chName}</span>
                            </span>
                            <span className="text-[10px] font-bold opacity-80 shrink-0">{chCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="space-y-1.5 pt-1">
                {activeSubs.map(renderSubjectNode)}

                {emptySubs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEmptySubjects((s) => !s)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Other Subjects ({emptySubs.length})</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showEmptySubjects ? 'rotate-90' : ''}`} />
                    </button>
                    {showEmptySubjects && (
                      <div className="space-y-0.5 mt-1">
                        {emptySubs.map(renderSubjectNode)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Panel: Question List */}
        <div className="lg:col-span-9 space-y-3.5">
          {/* Top List Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                disabled={filteredQuestions.length === 0}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-700 cursor-pointer disabled:opacity-40"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All ({filteredQuestions.length})</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-500">
                Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> of {questions.length}
              </span>
              {(selectedSubject !== 'ALL' || selectedChapter !== 'ALL' || selectedCategory !== 'ALL' || selectedClass !== 'ALL' || difficultyFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedClass('ALL');
                    setSelectedSubject('ALL');
                    setSelectedChapter('ALL');
                    setSelectedType('ALL');
                    setDifficultyFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X size={11} /> Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompactView(false)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    !compactView ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={12} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setCompactView(true)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    compactView ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={12} /> Compact
                </button>
              </div>

              {!compactView && (
                <button
                  type="button"
                  onClick={() => setShowSolutions((s) => !s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                    showSolutions
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {showSolutions ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>Solutions</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mb-2.5" />
              <p className="text-xs font-bold text-slate-500">Loading Question Bank...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-800">
                {questions.length === 0 ? 'Master Question Bank is Empty' : 'No Questions Match Current Filters'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                {questions.length === 0
                  ? 'Add questions with + Add Question, extract with AI, upload Excel, or click Sync Exams to pull questions from your existing exams.'
                  : 'Clear filters or select All Subjects on the left to view all questions.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {questions.length === 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncFromExams}
                      disabled={syncing}
                      className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                    >
                      {syncing ? 'Syncing...' : 'Sync from Existing Exams'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerState({ open: true, mode: 'ADD' })}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      + Add First Question
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedClass('ALL');
                      setSelectedSubject('ALL');
                      setSelectedChapter('ALL');
                      setSelectedType('ALL');
                      setDifficultyFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={compactView ? 'space-y-2' : 'space-y-3.5'}>
              {filteredQuestions.map((q: any, idx: number) => {
                const isSelected = selectedIds.includes(q.id);
                const opts = safeParseOptions(q.options);
                const qSub = normalizeSubjectLabel(q.subjectName || q.subject?.name || q.chapterName);
                const qCh = extractChapterLabel(q);
                const qType = (q.questionType || 'MCQ').toUpperCase();
                const diff = (q.difficulty || 'MEDIUM').toUpperCase();
                const diffStyle =
                  diff === 'EASY'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : diff === 'HARD'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';
                const diffDot =
                  diff === 'EASY' ? 'bg-emerald-500' : diff === 'HARD' ? 'bg-rose-500' : 'bg-amber-500';

                if (compactView) {
                  const ansIdx = opts.findIndex((o) => o.trim() === String(q.correctAnswer || '').trim());
                  const ansBadge = qType === 'INTEGER' ? q.correctAnswer : ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : q.correctAnswer;
                  return (
                    <div
                      key={q.id || idx}
                      className={`bg-white rounded-xl px-4 py-3 border border-l-4 transition-all flex items-center justify-between gap-3 shadow-2xs ${
                        isSelected
                          ? 'border-indigo-300 border-l-indigo-600 bg-indigo-50/20'
                          : 'border-slate-200/90 border-l-slate-200 hover:border-indigo-200 hover:border-l-indigo-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button type="button" onClick={() => toggleSelectId(q.id)} className="shrink-0 cursor-pointer">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-[11px] shrink-0">
                          Q{idx + 1}
                        </span>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          <LatexRenderer text={q.questionText} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {qSub}{qCh && qCh !== 'General' ? ` › ${qCh}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
                          Ans: {ansBadge}
                        </span>
                        <button type="button" onClick={() => setComposerState({ open: true, mode: 'EDIT', question: q })} className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id || idx}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border border-l-4 transition-all shadow-2xs ${
                      isSelected
                        ? 'border-indigo-300 border-l-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/15'
                        : 'border-slate-200/90 border-l-indigo-200 hover:border-indigo-200 hover:border-l-indigo-500'
                    }`}
                  >
                    {/* Clean Breadcrumb Card Header */}
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleSelectId(q.id)}
                          className="p-0.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                          title="Select question"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-[11px]">
                          Q{idx + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/80 text-[11px] font-bold">
                          {qSub}{qCh && qCh !== 'General' ? ` › ${qCh}` : ''}
                        </span>

                        {q.className && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold">
                            {q.className}
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${diffStyle}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${diffDot}`} />
                          {diff}
                        </span>

                        {qType !== 'MCQ' && (
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold">
                            {qType}
                          </span>
                        )}

                        {typeof q._count?.examQuestions === 'number' && q._count.examQuestions > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                            Used in {q._count.examQuestions} {q._count.examQuestions === 1 ? 'Exam' : 'Exams'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setComposerState({ open: true, mode: 'EDIT', question: q })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposerState({ open: true, mode: 'DUPLICATE', question: q })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="text-sm font-bold text-slate-900 mb-3.5 whitespace-pre-wrap leading-relaxed">
                      <LatexRenderer text={q.questionText} />
                    </div>

                    {q.imageUrl && (
                      <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                        <img
                          src={q.imageUrl.startsWith('data:') || q.imageUrl.startsWith('http') ? q.imageUrl : getPhotoUrl(q.imageUrl)}
                          alt="Question diagram"
                          className="max-h-44 object-contain rounded"
                        />
                      </div>
                    )}

                    {/* Options / Integer Answer */}
                    {qType === 'INTEGER' ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 inline-flex items-center gap-2">
                        <span>Answer:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-white border border-emerald-300 font-black">
                          {q.correctAnswer}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        {opts.map((opt: string, oIdx: number) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect =
                            opt.trim() === String(q.correctAnswer || '').trim() ||
                            letter === String(q.correctAnswer || '').trim().toUpperCase();

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                                  : 'bg-slate-50/60 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <div className="flex-1 leading-snug">
                                  <LatexRenderer text={opt} />
                                </div>
                              </div>
                              {isCorrect && <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Solution */}
                    {showSolutions && q.explanation && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-sky-50/90 to-indigo-50/40 border border-sky-200/80 text-xs text-slate-700 leading-relaxed">
                        <span className="font-black text-sky-800 mr-1.5">Solution:</span>
                        <LatexRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. STICKY LIGHT-THEME SELECTION ACTION BAR (Portal to document.body for true viewport pinning) */}
      {selectedIds.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-3 left-0 right-0 z-50 pointer-events-none flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto w-full max-w-3xl bg-white/95 backdrop-blur-md border-2 border-indigo-300 rounded-2xl shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs">
                {selectedIds.length} Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSendToExamModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus size={14} /> Add to Online Exam
              </button>
              <button
                type="button"
                onClick={() => handleSendToPaperGenerator(selectedIds)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              >
                <Printer size={14} /> Send to A4 Paper Generator
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODALS */}
      {composerState.open && (
        <QuestionStudioModal
          mode={composerState.mode}
          initialQuestion={composerState.question}
          defaultSubject={selectedSubject !== 'ALL' ? selectedSubject : 'Mathematics'}
          defaultCategory={selectedCategory !== 'ALL' ? selectedCategory : 'SCHOOL'}
          defaultClass={selectedClass !== 'ALL' ? selectedClass : '10th'}
          subjectList={subjectList.allNames}
          classList={classOptions.filter((c) => c !== 'ALL')}
          onClose={() => setComposerState({ open: false, mode: 'ADD' })}
          onSaved={() => {
            setComposerState({ open: false, mode: 'ADD' });
            fetchMasterQuestions();
            onExamsUpdated();
          }}
        />
      )}

      {showExcelModal && (
        <MasterExcelBulkModal
          onClose={() => setShowExcelModal(false)}
          onSaved={() => {
            setShowExcelModal(false);
            fetchMasterQuestions();
            onExamsUpdated();
          }}
        />
      )}

      {showAutoPickModal && (
        <AutoPickPaperModal
          questions={filteredQuestions}
          exams={exams}
          onClose={() => setShowAutoPickModal(false)}
          onSendToPaper={(ids) => {
            setShowAutoPickModal(false);
            handleSendToPaperGenerator(ids);
          }}
          onAddedToExam={() => {
            setShowAutoPickModal(false);
            fetchMasterQuestions();
            onExamsUpdated();
          }}
        />
      )}

      {showSendToExamModal && (
        <SendSelectedToExamModal
          selectedIds={selectedIds}
          exams={exams}
          onClose={() => setShowSendToExamModal(false)}
          onDone={() => {
            setShowSendToExamModal(false);
            setSelectedIds([]);
            fetchMasterQuestions();
            onExamsUpdated();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 1. ADD / EDIT / DUPLICATE QUESTION STUDIO (SPLIT VIEW + IMAGE PASTE)
// ═══════════════════════════════════════════════════════════════

const QuestionStudioModal: React.FC<{
  mode: 'ADD' | 'EDIT' | 'DUPLICATE';
  initialQuestion?: any;
  defaultSubject: string;
  defaultCategory: string;
  defaultClass: string;
  subjectList: string[];
  classList: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({
  mode,
  initialQuestion,
  defaultSubject,
  defaultCategory,
  defaultClass,
  subjectList,
  classList,
  onClose,
  onSaved,
}) => {
  const initOpts = initialQuestion ? safeParseOptions(initialQuestion.options) : ['', '', '', ''];
  const initAnsIndex = initialQuestion
    ? Math.max(
        0,
        initOpts.findIndex(
          (o) =>
            o.trim() === String(initialQuestion.correctAnswer || '').trim() ||
            String.fromCharCode(65 + initOpts.indexOf(o)) === String(initialQuestion.correctAnswer || '').trim().toUpperCase()
        )
      )
    : 0;

  const [category, setCategory] = useState(initialQuestion?.category || defaultCategory);
  const [className, setClassName] = useState(initialQuestion?.className || defaultClass);
  const [subjectName, setSubjectName] = useState(
    initialQuestion ? normalizeSubjectLabel(initialQuestion.subjectName || initialQuestion.chapterName) : defaultSubject
  );
  const [chapterName, setChapterName] = useState(
    initialQuestion ? extractChapterLabel(initialQuestion) : 'General'
  );
  const [difficulty, setDifficulty] = useState(initialQuestion?.difficulty || 'MEDIUM');
  const [questionType, setQuestionType] = useState((initialQuestion?.questionType || 'MCQ').toUpperCase());
  const [questionText, setQuestionText] = useState(initialQuestion?.questionText || '');
  const [options, setOptions] = useState<string[]>([
    initOpts[0] || '',
    initOpts[1] || '',
    initOpts[2] || '',
    initOpts[3] || '',
  ]);
  const [correctIndex, setCorrectIndex] = useState<number>(initAnsIndex);
  const [integerAnswer, setIntegerAnswer] = useState<string>(
    initialQuestion?.questionType === 'INTEGER' ? String(initialQuestion?.correctAnswer || '') : ''
  );
  const [imageUrl, setImageUrl] = useState<string>(initialQuestion?.imageUrl || '');
  const [explanation, setExplanation] = useState<string>(initialQuestion?.explanation || '');
  const [marks, setMarks] = useState<number>(Number(initialQuestion?.marks) || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(Number(initialQuestion?.negativeMarks) || 0);
  const [rawPaste, setRawPaste] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImg, setUploadingImg] = useState<boolean>(false);

  const handleQuickRawApply = (raw: string) => {
    setRawPaste(raw);
    const parsed = parseSingleRawQuestionAndOptions(raw);
    if (parsed.questionText) setQuestionText(parsed.questionText);
    if (parsed.options.some((o) => o)) {
      setOptions(parsed.options);
      setCorrectIndex(parsed.correctAnswerIndex);
    }
  };

  const uploadDiagramFile = async (file: File | Blob) => {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('image', file, 'question_diagram.png');
      const res = await api.post('/api/questions/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.imageUrl) {
        setImageUrl(res.data.imageUrl);
        toast.success('Diagram uploaded!');
      }
    } catch {
      // fallback base64 preview if upload route fails
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') setImageUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImg(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          uploadDiagramFile(blob);
          return;
        }
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    const finalOptions =
      questionType === 'TRUE_FALSE'
        ? ['True', 'False']
        : questionType === 'INTEGER'
        ? []
        : options.map((o, idx) => o.trim() || `Option ${String.fromCharCode(65 + idx)}`);

    const finalAnswer =
      questionType === 'INTEGER'
        ? integerAnswer.trim() || '0'
        : finalOptions[correctIndex] || finalOptions[0] || 'A';

    const payload = {
      category,
      className,
      subjectName,
      chapterName: `${subjectName}: ${chapterName.trim() || 'General'}`,
      topicName: chapterName.trim() || 'General',
      difficulty,
      questionType,
      questionText: questionText.trim(),
      imageUrl: imageUrl || null,
      options: finalOptions,
      correctAnswer: finalAnswer,
      marks: Number(marks) || 4,
      negativeMarks: Number(negativeMarks) || 0,
      explanation: explanation.trim() || null,
    };

    setSaving(true);
    try {
      if (mode === 'EDIT' && initialQuestion?.id) {
        await api.put(`/api/master-questions/${initialQuestion.id}`, payload);
        toast.success('Question updated!');
      } else {
        await api.post('/api/master-questions', payload);
        toast.success('Question added to Master Bank!');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Soft Light Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-white to-indigo-50/80 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Database className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {mode === 'EDIT' ? 'Edit Question' : mode === 'DUPLICATE' ? 'Duplicate & Save New Question' : 'Add Question to Master Bank'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Editor Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Stream</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  {CATEGORY_OPTIONS.filter((c) => c !== 'ALL').map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Class</label>
                <select value={className} onChange={(e) => setClassName(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  {Array.from(new Set([...classList, ...CLASS_PRESETS])).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
                <select value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  {subjectList.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Chapter / Topic</label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g., Quadratic Equations"
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  {QUESTION_TYPES.filter((t) => t.key !== 'ALL').map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Marks</label>
                  <input type="number" step={0.5} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Neg</label>
                  <input type="number" step={0.25} min={0} value={negativeMarks} onChange={(e) => setNegativeMarks(Number(e.target.value))} className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800" />
                </div>
              </div>
            </div>

            {mode === 'ADD' && (
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/80">
                <label className="block text-[11px] font-bold text-indigo-800 mb-1">
                  Quick Smart Paste (Paste full question + (A)-(D) + Ans to auto-fill below)
                </label>
                <textarea
                  rows={2}
                  value={rawPaste}
                  onChange={(e) => handleQuickRawApply(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-indigo-200 text-xs font-mono text-slate-800 outline-none"
                  placeholder={"1. Solve $x^2-4=0$\n(A) 2\n(B) -2\n(C) ±2\n(D) 4\nAns: C"}
                />
              </div>
            )}

            {/* Question Text + Image Paste */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600">Question Text * (LaTeX `$ ... $` & Ctrl+V Image supported)</label>
                <label className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                  <ImageIcon size={13} />
                  <span>{uploadingImg ? 'Uploading...' : 'Attach Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadDiagramFile(f);
                    }}
                  />
                </label>
              </div>
              <textarea
                rows={4}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onPaste={handlePaste}
                className="w-full p-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400"
                placeholder="Type or paste question here..."
              />
              {imageUrl && (
                <div className="mt-2 inline-flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={imageUrl.startsWith('data:') || imageUrl.startsWith('http') ? imageUrl : getPhotoUrl(imageUrl)}
                    alt="Diagram"
                    className="h-16 object-contain rounded"
                  />
                  <button type="button" onClick={() => setImageUrl('')} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Options / Integer */}
            {questionType === 'INTEGER' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Correct Numerical Answer *</label>
                <input
                  type="text"
                  value={integerAnswer}
                  onChange={(e) => setIntegerAnswer(e.target.value)}
                  placeholder="e.g., 42 or 3.14"
                  className="w-full p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-300 text-sm font-black text-emerald-900 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600">Options (Click circle to mark Correct Answer)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(questionType === 'TRUE_FALSE' ? ['True', 'False'] : options).map((optVal, i) => {
                    const isAns = correctIndex === i;
                    return (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${isAns ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setCorrectIndex(i)}
                          className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 cursor-pointer ${
                            isAns ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={questionType === 'TRUE_FALSE' ? (i === 0 ? 'True' : 'False') : optVal}
                          readOnly={questionType === 'TRUE_FALSE'}
                          onChange={(e) => {
                            const next = [...options];
                            next[i] = e.target.value;
                            setOptions(next);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="flex-1 bg-transparent text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Solution / Explanation (Optional)</label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                placeholder="Step-by-step explanation or formula..."
              />
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50/70 rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600">Live KaTeX Preview</div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{subjectName}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">{className}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{chapterName || 'General'}</span>
                </div>

                <div className="text-sm font-bold text-slate-900 whitespace-pre-wrap">
                  {questionText ? <LatexRenderer text={questionText} /> : <span className="text-slate-400 font-normal">Question preview appears here...</span>}
                </div>

                {imageUrl && (
                  <img
                    src={imageUrl.startsWith('data:') || imageUrl.startsWith('http') ? imageUrl : getPhotoUrl(imageUrl)}
                    alt="Diagram preview"
                    className="max-h-40 rounded-lg border border-slate-200 object-contain"
                  />
                )}

                {questionType === 'INTEGER' ? (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    Answer: {integerAnswer || '-'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    {(questionType === 'TRUE_FALSE' ? ['True', 'False'] : options).map((o, i) => (
                      <div key={i} className={`p-2 rounded-lg border ${i === correctIndex ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <strong>({String.fromCharCode(65 + i)})</strong> <LatexRenderer text={o || '-'} />
                      </div>
                    ))}
                  </div>
                )}

                {explanation && (
                  <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-slate-700">
                    <strong className="text-sky-800">Solution: </strong>
                    <LatexRenderer text={explanation} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
                {saving ? 'Saving...' : mode === 'EDIT' ? 'Update Question' : 'Save to Master Bank'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 2. EXCEL / CSV BULK IMPORT MODAL (INCLUDES CLASS & TYPE)
// ═══════════════════════════════════════════════════════════════

const MasterExcelBulkModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDownloadSample = () => {
    const sample = [
      {
        Category: 'SCHOOL',
        Class: '10th',
        Subject: 'Mathematics',
        Chapter: 'Quadratic Equations',
        Question: 'If $x^2 - 5x + 6 = 0$, what are the roots?',
        'Option A': '2, 3',
        'Option B': '1, 6',
        'Option C': '-2, -3',
        'Option D': '3, 4',
        'Correct Answer': 'A',
        Difficulty: 'EASY',
        Type: 'MCQ',
        Explanation: 'Factoring gives $(x-2)(x-3)=0$.',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'Master_Question_Bank_Template.xlsx');
    toast.success('Sample Excel template downloaded!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(ws);
        const mapped = jsonRows
          .map((r) => {
            const opts = [
              String(r['Option A'] ?? r.optionA ?? '').trim(),
              String(r['Option B'] ?? r.optionB ?? '').trim(),
              String(r['Option C'] ?? r.optionC ?? '').trim(),
              String(r['Option D'] ?? r.optionD ?? '').trim(),
            ];
            const rawAns = String(r['Correct Answer'] ?? r.correctAnswer ?? 'A').trim();
            let correctAnswer = rawAns;
            const idxMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
            if (idxMap[rawAns.toUpperCase()] !== undefined && opts[idxMap[rawAns.toUpperCase()]]) {
              correctAnswer = opts[idxMap[rawAns.toUpperCase()]];
            }
            const subName = String(r.Subject ?? r.subjectName ?? 'General').trim();
            const chName = String(r.Chapter ?? r.Topic ?? r.topicName ?? 'General').trim();
            return {
              category: String(r.Category ?? r.category ?? 'SCHOOL').toUpperCase(),
              className: String(r.Class ?? r.className ?? '').trim() || null,
              subjectName: subName,
              topicName: chName,
              chapterName: `${subName}: ${chName}`,
              questionText: String(r.Question ?? r.questionText ?? '').trim(),
              questionType: String(r.Type ?? r.questionType ?? 'MCQ').toUpperCase(),
              options: opts,
              correctAnswer,
              difficulty: String(r.Difficulty ?? r.difficulty ?? 'MEDIUM').toUpperCase(),
              marks: 4,
              negativeMarks: 0,
              explanation: String(r.Explanation ?? r.explanation ?? '').trim() || null,
            };
          })
          .filter((q) => q.questionText);
        setRows(mapped);
        if (mapped.length === 0) toast.error('No valid questions found');
        else toast.success(`Loaded ${mapped.length} questions from Excel!`);
      } catch {
        toast.error('Failed to read Excel/CSV file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveAll = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    try {
      await api.post('/api/master-questions/bulk', { questions: rows });
      toast.success(`Imported ${rows.length} questions to Master Bank!`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk import failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-5 py-4 bg-gradient-to-r from-white to-emerald-50/80 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk Import Questions (Excel / CSV)
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-emerald-900">Download Sample Excel Template</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Columns: Category, Class, Subject, Chapter, Question, Option A-D, Correct Answer, Difficulty, Type, Explanation</p>
            </div>
            <button type="button" onClick={handleDownloadSample} className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer">
              <Download size={14} /> Template (.xlsx)
            </button>
          </div>

          <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-white cursor-pointer transition">
            <Upload className="w-7 h-7 text-indigo-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-700 block">
              {fileName ? `Selected: ${fileName} (${rows.length} questions)` : 'Click to choose Excel (.xlsx / .csv) file'}
            </span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSaveAll} disabled={saving || rows.length === 0} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
            {saving ? 'Importing...' : `Import ${rows.length} Questions`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 4. AUTO-PICK SMART PAPER GENERATOR MODAL
// ═══════════════════════════════════════════════════════════════

const AutoPickPaperModal: React.FC<{
  questions: any[];
  exams: any[];
  onClose: () => void;
  onSendToPaper: (ids: string[]) => void;
  onAddedToExam: () => void;
}> = ({ questions, exams, onClose, onSendToPaper, onAddedToExam }) => {
  const easyPool = useMemo(() => questions.filter((q) => (q.difficulty || 'MEDIUM').toUpperCase() === 'EASY'), [questions]);
  const medPool = useMemo(() => questions.filter((q) => (q.difficulty || 'MEDIUM').toUpperCase() === 'MEDIUM'), [questions]);
  const hardPool = useMemo(() => questions.filter((q) => (q.difficulty || 'MEDIUM').toUpperCase() === 'HARD'), [questions]);

  const [easyCount, setEasyCount] = useState(Math.min(5, easyPool.length));
  const [medCount, setMedCount] = useState(Math.min(5, medPool.length));
  const [hardCount, setHardCount] = useState(Math.min(2, hardPool.length));
  const [targetExamId, setTargetExamId] = useState(exams[0]?.id || '');
  const [importing, setImporting] = useState(false);

  const shufflePick = (arr: any[], count: number) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.max(0, count)).map((q) => q.id);
  };

  const getPickedIds = () => [
    ...shufflePick(easyPool, easyCount),
    ...shufflePick(medPool, medCount),
    ...shufflePick(hardPool, hardCount),
  ];

  const handleAddToExam = async () => {
    const ids = getPickedIds();
    if (ids.length === 0) {
      toast.error('Select at least 1 question count');
      return;
    }
    if (!targetExamId) {
      toast.error('Please select an exam');
      return;
    }
    setImporting(true);
    try {
      await api.post(`/api/competitive-exams/${targetExamId}/import-from-bank`, { masterQuestionIds: ids });
      toast.success(`Added ${ids.length} randomly picked questions to exam!`);
      onAddedToExam();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add to exam');
    } finally {
      setImporting(false);
    }
  };

  const totalPicked = easyCount + medCount + hardCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-5 py-4 bg-gradient-to-r from-white to-purple-50/80 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" /> Auto-Pick Random Paper
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 font-semibold">
            Randomly selects questions from current filtered list ({questions.length} available).
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-700">Easy ({easyPool.length})</div>
              <input type="number" min={0} max={easyPool.length} value={easyCount} onChange={(e) => setEasyCount(Number(e.target.value))} className="mt-1.5 w-full p-2 rounded-lg bg-white border border-emerald-200 text-sm font-black text-center" />
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[11px] font-bold text-amber-700">Medium ({medPool.length})</div>
              <input type="number" min={0} max={medPool.length} value={medCount} onChange={(e) => setMedCount(Number(e.target.value))} className="mt-1.5 w-full p-2 rounded-lg bg-white border border-amber-200 text-sm font-black text-center" />
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-[11px] font-bold text-rose-700">Hard ({hardPool.length})</div>
              <input type="number" min={0} max={hardPool.length} value={hardCount} onChange={(e) => setHardCount(Number(e.target.value))} className="mt-1.5 w-full p-2 rounded-lg bg-white border border-rose-200 text-sm font-black text-center" />
            </div>
          </div>

          {exams.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Online Exam (optional)</label>
              <select value={targetExamId} onChange={(e) => setTargetExamId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                {exams.map((ex: any) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2">
          {exams.length > 0 && (
            <button type="button" onClick={handleAddToExam} disabled={importing || totalPicked === 0} className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black cursor-pointer disabled:opacity-50">
              {importing ? 'Adding...' : `Add ${totalPicked} to Exam`}
            </button>
          )}
          <button type="button" onClick={() => onSendToPaper(getPickedIds())} disabled={totalPicked === 0} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
            Send {totalPicked} to A4 Paper
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 5. SEND SELECTED QUESTIONS TO AN ONLINE EXAM MODAL
// ═══════════════════════════════════════════════════════════════

const SendSelectedToExamModal: React.FC<{
  selectedIds: string[];
  exams: any[];
  onClose: () => void;
  onDone: () => void;
}> = ({ selectedIds, exams, onClose, onDone }) => {
  const [targetExamId, setTargetExamId] = useState(exams[0]?.id || '');
  const [importing, setImporting] = useState(false);

  const handleConfirm = async () => {
    if (!targetExamId) {
      toast.error('Please select an exam');
      return;
    }
    setImporting(true);
    try {
      await api.post(`/api/competitive-exams/${targetExamId}/import-from-bank`, {
        masterQuestionIds: selectedIds,
      });
      toast.success(`Added ${selectedIds.length} questions to exam!`);
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add questions');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-5 py-4 bg-gradient-to-r from-white to-indigo-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-black text-slate-900">Add {selectedIds.length} Questions to Exam</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {exams.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">No Online Exams created yet. Create an exam first in Exam Management.</p>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Target Online Exam</label>
              <select value={targetExamId} onChange={(e) => setTargetExamId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                {exams.map((ex: any) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={importing || exams.length === 0} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50">
            {importing ? 'Importing...' : `Import (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
