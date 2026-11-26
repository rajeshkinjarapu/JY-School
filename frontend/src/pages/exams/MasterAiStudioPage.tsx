import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Upload, FileText, Image as ImageIcon, CheckSquare, Square,
  Trash2, CheckCircle2, AlertTriangle, RefreshCw, Printer, Key, Eye, EyeOff, Wand2
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { LatexRenderer } from './CompetitiveExamsPage';
import { formatMCQText } from '../question-bank/MCQPaperGeneratorPage';

const CATEGORY_LIST = ['SCHOOL', 'JEE', 'NEET', 'NAVODAYA', 'APPSC', 'SSC', 'GENERAL'];
const CLASS_PRESETS = ['10th', '9th', '8th', '7th', '6th', '5th', 'Foundation', 'Navodaya', 'IIT-JEE', 'NEET'];
const STANDARD_SUBJECTS = [
  'Telugu', 'Hindi', 'English', 'Mathematics', 'Science',
  'Physics', 'Chemistry', 'Biology', 'Social', 'Mental Ability', 'General',
];

interface ExtractedItem {
  id: string;
  selected: boolean;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'MCQ' | 'INTEGER' | 'ASSERTION_REASON' | 'TRUE_FALSE';
  subjectName: string;
  chapterName: string;
  explanation: string;
  marks: number;
  needsReview: boolean;
  isDuplicate: boolean;
}

const chunkTextIntoBatches = (rawText: string, batchSize = 12): string[] => {
  const lines = rawText.split('\n');
  const blocks: string[] = [];
  let current = '';

  for (const line of lines) {
    if (/^\s*(?:\d+[\.\:\)]|\bQ(?:uestion)?\s*\d+[\.\:\)])\s+/i.test(line) && current.trim()) {
      blocks.push(current.trim());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current.trim()) blocks.push(current.trim());

  if (blocks.length <= batchSize) return [rawText];

  const batches: string[] = [];
  for (let i = 0; i < blocks.length; i += batchSize) {
    batches.push(blocks.slice(i, i + batchSize).join('\n\n'));
  }
  return batches;
};

export const MasterAiStudioPage: React.FC = () => {
  const navigate = useNavigate();

  // Shared Gemini API Key (same key stored by MCQ Paper Generator)
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('jy_gemini_api_key') || '');
  const [showApiKeyBox, setShowApiKeyBox] = useState<boolean>(false);

  // Input Mode & Metadata
  const [inputMode, setInputMode] = useState<'TEXT' | 'FILE' | 'TOPIC'>('TEXT');
  const [category, setCategory] = useState<string>('SCHOOL');
  const [className, setClassName] = useState<string>('10th');
  const [subjectName, setSubjectName] = useState<string>('Mathematics');
  const [chapterName, setChapterName] = useState<string>('General');
  const [difficultyPref, setDifficultyPref] = useState<string>('MIXED');
  const [autoSolve, setAutoSolve] = useState<boolean>(true);
  const [topicCount, setTopicCount] = useState<number>(10);

  // Input Payloads
  const [rawText, setRawText] = useState<string>('');
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedImagePreview, setPastedImagePreview] = useState<string>('');

  // DB Catalog & Duplicate Lookup
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [dbClasses, setDbClasses] = useState<string[]>([]);
  const [existingQuestionsSet, setExistingQuestionsSet] = useState<Set<string>>(new Set());

  // Workbench Review State
  const [processing, setProcessing] = useState<boolean>(false);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [extractedList, setExtractedList] = useState<ExtractedItem[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'READY' | 'REVIEW' | 'DUPLICATE'>('ALL');
  const [previewCardIds, setPreviewCardIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      api.get('/api/subjects?limit=200').catch(() => null),
      api.get('/api/classes?limit=200').catch(() => null),
      api.get('/api/master-questions').catch(() => null),
    ]).then(([subRes, clsRes, mqRes]) => {
      const subs: string[] = (subRes?.data?.data || []).map((s: any) => (s.name || '').trim()).filter(Boolean);
      setDbSubjects(Array.from(new Set<string>([...STANDARD_SUBJECTS, ...subs])));

      const clss: string[] = (clsRes?.data?.data || []).map((c: any) => (c.name || '').trim()).filter(Boolean);
      setDbClasses(Array.from(new Set<string>([...clss, ...CLASS_PRESETS])));

      const mqList: any[] = mqRes?.data?.data || [];
      setExistingQuestionsSet(new Set<string>(mqList.map((q) => (q.questionText || '').trim().toLowerCase())));
    });
  }, []);

  const handleSaveApiKey = (val: string) => {
    setGeminiApiKey(val);
    localStorage.setItem('jy_gemini_api_key', val);
  };

  const handlePasteScreenshot = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setUploadedFile(file);
          setInputMode('FILE');
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') setPastedImagePreview(ev.target.result);
          };
          reader.readAsDataURL(file);
          toast.success('Screenshot attached! Click Analyze with AI.');
          return;
        }
      }
    }
  };

  const handleFilePick = (file: File | null) => {
    setUploadedFile(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') setPastedImagePreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPastedImagePreview('');
    }
  };

  const mapRawToExtractedItems = (rawItems: any[]): ExtractedItem[] => {
    return rawItems.map((q, idx) => {
      const opts = Array.isArray(q.options) && q.options.length > 0
        ? q.options.map((o: any) => String(o ?? '').trim())
        : ['Option A', 'Option B', 'Option C', 'Option D'];
      while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);

      let ans = String(q.correctAnswer || opts[0]).trim();
      const letterIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      if (letterIdx[ans.toUpperCase()] !== undefined) {
        ans = opts[letterIdx[ans.toUpperCase()]];
      }

      const qText = String(q.questionText || '').trim();
      const hasPlaceholderOpt = opts.some((o: string) => /^Option [A-D]$/i.test(o) || !o);
      const isDuplicate = existingQuestionsSet.has(qText.toLowerCase());

      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        selected: !isDuplicate,
        questionText: qText,
        options: opts.slice(0, 4),
        correctAnswer: opts.includes(ans) ? ans : opts[0],
        difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(String(q.difficulty || '').toUpperCase())
          ? String(q.difficulty).toUpperCase()
          : 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
        questionType: (q.questionType || 'MCQ').toUpperCase() as ExtractedItem['questionType'],
        subjectName: q.subjectName || subjectName,
        chapterName: q.topicName || (q.chapterName && q.chapterName.includes(':') ? q.chapterName.split(':').slice(1).join(':').trim() : q.chapterName) || chapterName || 'General',
        explanation: String(q.explanation || '').trim(),
        marks: Number(q.marks) || 4,
        needsReview: !qText || hasPlaceholderOpt,
        isDuplicate,
      };
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiKeyToSend = geminiApiKey.trim() || localStorage.getItem('jy_gemini_api_key') || undefined;

    setProcessing(true);
    setProgressLabel('Connecting to Gemini AI...');

    try {
      if (inputMode === 'TEXT') {
        if (!rawText.trim()) {
          toast.error('Please paste questions text first');
          setProcessing(false);
          return;
        }
        const batches = chunkTextIntoBatches(rawText, 12);
        const collected: any[] = [];

        for (let i = 0; i < batches.length; i++) {
          setProgressLabel(
            batches.length > 1
              ? `Extracting Batch ${i + 1} of ${batches.length}... (${collected.length} questions found)`
              : 'Analyzing & formatting questions with Gemini AI...'
          );
          const res = await api.post('/api/master-questions/ai-parse-text', {
            rawText: batches[i],
            defaultMarks: 4,
            chapterName: `${subjectName}: ${chapterName || 'General'}`,
            apiKey: apiKeyToSend,
            autoSolve,
          });
          if (Array.isArray(res.data?.questions)) {
            collected.push(...res.data.questions);
          }
        }

        if (collected.length === 0) {
          toast.error('No questions could be extracted. Please check your input.');
        } else {
          setExtractedList(mapRawToExtractedItems(collected));
          toast.success(`Extracted ${collected.length} questions for review!`);
        }
      } else if (inputMode === 'FILE') {
        if (!uploadedFile) {
          toast.error('Please upload a Photo or PDF file (or paste screenshot with Ctrl+V)');
          setProcessing(false);
          return;
        }
        setProgressLabel('Reading document / image with Gemini AI...');
        const fd = new FormData();
        fd.append('file', uploadedFile);
        fd.append('category', category);
        fd.append('className', className);
        fd.append('subjectName', subjectName);
        fd.append('chapterName', `${subjectName}: ${chapterName || 'General'}`);
        fd.append('count', String(topicCount));
        fd.append('difficulty', difficultyPref);
        fd.append('previewOnly', 'true');
        if (apiKeyToSend) fd.append('apiKey', apiKeyToSend);
        fd.append('prompt', rawText.trim() || 'Extract all questions accurately with 4 options, correct answer, and explanation.');

        const res = await api.post('/api/master-questions/generate-ai', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        const items = res.data?.questions || [];
        if (items.length === 0) {
          toast.error('Could not extract questions from file.');
        } else {
          setExtractedList(mapRawToExtractedItems(items));
          toast.success(`Extracted ${items.length} questions for review!`);
        }
      } else {
        if (!topicPrompt.trim()) {
          toast.error('Please describe the topic / syllabus');
          setProcessing(false);
          return;
        }
        setProgressLabel(`Generating ${topicCount} ${subjectName} questions with Gemini AI...`);
        const res = await api.post('/api/master-questions/generate-ai', {
          category,
          className,
          subjectName,
          chapterName: `${subjectName}: ${chapterName || 'General'}`,
          count: topicCount,
          difficulty: difficultyPref,
          prompt: topicPrompt.trim(),
          apiKey: apiKeyToSend,
          previewOnly: true,
        });
        const items = res.data?.questions || [];
        setExtractedList(mapRawToExtractedItems(items));
        toast.success(`Generated ${items.length} questions for review!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI request failed. Please check your Gemini API Key.');
    } finally {
      setProcessing(false);
      setProgressLabel('');
    }
  };

  const filteredReview = useMemo(() => {
    if (reviewFilter === 'READY') return extractedList.filter((q) => !q.needsReview && !q.isDuplicate);
    if (reviewFilter === 'REVIEW') return extractedList.filter((q) => q.needsReview);
    if (reviewFilter === 'DUPLICATE') return extractedList.filter((q) => q.isDuplicate);
    return extractedList;
  }, [extractedList, reviewFilter]);

  const selectedItems = useMemo(() => extractedList.filter((q) => q.selected), [extractedList]);
  const reviewCounts = useMemo(() => ({
    all: extractedList.length,
    ready: extractedList.filter((q) => !q.needsReview && !q.isDuplicate).length,
    review: extractedList.filter((q) => q.needsReview).length,
    duplicate: extractedList.filter((q) => q.isDuplicate).length,
  }), [extractedList]);

  const updateItem = (id: string, patch: Partial<ExtractedItem>) => {
    setExtractedList((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleSaveToMasterBank = async () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one question to save');
      return;
    }
    setSaving(true);
    try {
      const payload = selectedItems.map((q) => ({
        category,
        className,
        subjectName: q.subjectName || subjectName,
        topicName: q.chapterName || chapterName || 'General',
        chapterName: `${q.subjectName || subjectName}: ${q.chapterName || chapterName || 'General'}`,
        difficulty: q.difficulty,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks || 4,
        negativeMarks: 0,
        explanation: q.explanation || null,
      }));
      await api.post('/api/master-questions/bulk', {
        questions: payload,
        category,
        className,
        subjectName,
      });
      toast.success(`Saved ${payload.length} questions to Master Question Bank!`);
      navigate('/competitive-exams/question-bank');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToPaperGenerator = () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one question');
      return;
    }
    const bySubject: Record<string, string[]> = {};
    const keysBySubject: Record<string, Record<string, string>> = {};
    const qCounts: Record<string, number> = {};

    selectedItems.forEach((q) => {
      const sub = q.subjectName || subjectName || 'General';
      if (!bySubject[sub]) {
        bySubject[sub] = [];
        keysBySubject[sub] = {};
        qCounts[sub] = 0;
      }
      qCounts[sub] += 1;
      const num = qCounts[sub];
      let block = `${num}. ${q.questionText}\n`;
      q.options.forEach((opt, idx) => {
        block += `(${String.fromCharCode(65 + idx)}) ${opt}\n`;
      });
      const ansIdx = q.options.findIndex((o) => o.trim() === q.correctAnswer.trim());
      keysBySubject[sub][String(num)] = ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : 'A';
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
    navigate('/question-bank/mcq-generator?fromBank=true');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50" onPaste={handlePasteScreenshot}>
      <PageHeader
        title="AI Question Studio"
        icon={<Sparkles className="w-5 h-5 text-white" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowApiKeyBox((s) => !s)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{geminiApiKey.trim() ? 'Gemini Key Ready ✓' : 'Gemini Key (Server Default)'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/competitive-exams/question-bank')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-900 font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Question Bank</span>
            </button>
          </div>
        }
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-5 flex-1">
        {/* Optional Gemini Key Drawer (Synced directly with MCQ Paper Generator's jy_gemini_api_key) */}
        {showApiKeyBox && (
          <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-800">Shared Gemini API Key (Synced with MCQ Paper Generator)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Using key stored in Paper Settings (`jy_gemini_api_key`).</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-96">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (optional)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyBox(false);
                  toast.success('Gemini API Key updated!');
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: FULL-WIDTH INPUT WORKSPACE (Shown when no extracted questions yet) */}
        {extractedList.length === 0 ? (
          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Mode Tabs + Metadata Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
                  {[
                    { key: 'TEXT', label: 'Paste Exam Text', icon: FileText },
                    { key: 'FILE', label: 'Photo / PDF Scan', icon: ImageIcon },
                    { key: 'TOPIC', label: 'Generate by Topic', icon: Wand2 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setInputMode(tab.key as any)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                          inputMode === tab.key
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Smart Auto-Solve Toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={autoSolve}
                    onChange={(e) => setAutoSolve(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-emerald-900">Auto-Solve Missing Answers & Solutions</span>
                </label>
              </div>

              {/* Simple Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Stream</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                    {CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Class</label>
                  <select value={className} onChange={(e) => setClassName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                    {(dbClasses.length > 0 ? dbClasses : CLASS_PRESETS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
                  <select value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                    {(dbSubjects.length > 0 ? dbSubjects : STANDARD_SUBJECTS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Chapter / Topic</label>
                  <input
                    type="text"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g., Quadratic Equations"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Difficulty</label>
                  <select value={difficultyPref} onChange={(e) => setDifficultyPref(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                    <option value="MIXED">Mixed (Auto)</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mode Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              {inputMode === 'TEXT' && (
                <>
                  <label className="block text-xs font-bold text-slate-700">
                    Paste Questions (Supports Telugu, Hindi, English, LaTeX, 10–100+ questions & bottom Answer Key tables)
                  </label>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 focus:bg-white border border-slate-200 text-sm font-mono text-slate-800 outline-none focus:border-indigo-400"
                    placeholder={"1. What is the SI unit of Force?\n(A) Joule\n(B) Newton\n(C) Watt\n(D) Pascal\n\n2. Solve $2x + 5 = 15$...\n..."}
                  />
                </>
              )}

              {inputMode === 'FILE' && (
                <div className="space-y-4">
                  <label className="block border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center bg-indigo-50/30 hover:bg-indigo-50/60 cursor-pointer transition">
                    <Upload className="w-9 h-9 text-indigo-500 mx-auto mb-2.5" />
                    <span className="text-sm font-black text-slate-800 block">
                      {uploadedFile ? `Attached: ${uploadedFile.name}` : 'Click to Upload Exam Photo / PDF — or Press Ctrl+V to Paste Screenshot'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">Supports JPG, PNG, WebP, PDF (Max 20MB)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
                    />
                  </label>

                  {pastedImagePreview && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-flex items-center gap-3">
                      <img src={pastedImagePreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                      <button type="button" onClick={() => handleFilePick(null)} className="text-xs font-bold text-rose-600 cursor-pointer">
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Max Questions to Extract</label>
                      <input type="number" min={1} max={50} value={topicCount} onChange={(e) => setTopicCount(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Extra Instructions (Optional)</label>
                      <input type="text" value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="e.g., Only extract questions 1 to 15 in Telugu" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold" />
                    </div>
                  </div>
                </div>
              )}

              {inputMode === 'TOPIC' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Topic / Syllabus Prompt *</label>
                      <input
                        type="text"
                        value={topicPrompt}
                        onChange={(e) => setTopicPrompt(e.target.value)}
                        placeholder="e.g., Generate Class 10 Trigonometry identities MCQs with step-by-step solutions"
                        className="w-full p-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Question Count</label>
                      <select value={topicCount} onChange={(e) => setTopicCount(Number(e.target.value))} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800">
                        {[5, 10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} Questions</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  {processing ? progressLabel : 'AI output opens in a full-width Review & Edit Workbench before saving.'}
                </span>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-black shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{processing ? 'Processing...' : inputMode === 'TOPIC' ? 'Generate with Gemini AI' : 'Analyze & Extract with AI'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* STEP 2: FULL-WIDTH REVIEW & INLINE EDIT WORKBENCH */
          <div className="space-y-4">
            {/* Review Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: `All (${reviewCounts.all})`, cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                  { key: 'READY', label: `Ready (${reviewCounts.ready})`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { key: 'REVIEW', label: `Needs Attention (${reviewCounts.review})`, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
                  { key: 'DUPLICATE', label: `Duplicates (${reviewCounts.duplicate})`, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setReviewFilter(chip.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      reviewFilter === chip.key ? 'ring-2 ring-indigo-400 ' + chip.cls : chip.cls + ' opacity-75 hover:opacity-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExtractedList([])}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Start Over / New Input
                </button>
              </div>
            </div>

            {/* Editable Extracted Question Cards */}
            <div className="space-y-4">
              {filteredReview.map((item, idx) => {
                const isKaTeXPreview = previewCardIds[item.id] ?? true;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3 ${
                      item.needsReview ? 'border-amber-300' : item.selected ? 'border-indigo-300' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { selected: !item.selected })}
                          className="cursor-pointer"
                        >
                          {item.selected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs">Q{idx + 1}</span>
                        {item.needsReview && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black flex items-center gap-1">
                            <AlertTriangle size={11} /> Needs Attention
                          </span>
                        )}
                        {item.isDuplicate && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                            Duplicate in Bank
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.chapterName}
                          onChange={(e) => updateItem(item.id, { chapterName: e.target.value })}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 w-36"
                          placeholder="Chapter"
                        />
                        <select
                          value={item.difficulty}
                          onChange={(e) => updateItem(item.id, { difficulty: e.target.value as any })}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setPreviewCardIds((p) => ({ ...p, [item.id]: !isKaTeXPreview }))}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isKaTeXPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                          <span>{isKaTeXPreview ? 'Edit Text' : 'KaTeX Preview'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExtractedList((prev) => prev.filter((x) => x.id !== item.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isKaTeXPreview ? (
                      <div className="text-sm font-bold text-slate-900 whitespace-pre-wrap">
                        <LatexRenderer text={item.questionText} />
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        value={item.questionText}
                        onChange={(e) => updateItem(item.id, { questionText: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                      />
                    )}

                    {/* Options 2x2 Inline Editor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.options.map((opt, oIdx) => {
                        const isAns = opt.trim() === item.correctAnswer.trim();
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isAns ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, { correctAnswer: opt })}
                              className={`w-6 h-6 rounded-full text-xs font-black shrink-0 cursor-pointer ${
                                isAns ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                              }`}
                              title="Click to mark as Correct Answer"
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </button>
                            {isKaTeXPreview ? (
                              <div className="flex-1 text-xs font-semibold text-slate-800">
                                <LatexRenderer text={opt} />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...item.options];
                                  nextOpts[oIdx] = e.target.value;
                                  updateItem(item.id, {
                                    options: nextOpts,
                                    correctAnswer: isAns ? e.target.value : item.correctAnswer,
                                  });
                                }}
                                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Editable Solution */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-sky-700 shrink-0">Solution:</span>
                      <input
                        type="text"
                        value={item.explanation}
                        onChange={(e) => updateItem(item.id, { explanation: e.target.value })}
                        placeholder="Optional explanation..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-sky-50/50 border border-sky-200/80 text-xs text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Light Save Bar (when extracted items exist) */}
      {extractedList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-white border-2 border-indigo-300 rounded-2xl shadow-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-black text-indigo-700">
            {selectedItems.length} of {extractedList.length} Ready to Save
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendToPaperGenerator}
              disabled={selectedItems.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer size={14} /> Open in A4 Paper
            </button>
            <button
              type="button"
              onClick={handleSaveToMasterBank}
              disabled={saving || selectedItems.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>{saving ? 'Saving...' : `Save ${selectedItems.length} to Master Bank`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAiStudioPage;
