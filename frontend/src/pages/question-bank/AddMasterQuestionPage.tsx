import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import {
  ArrowLeft, Sparkles, Save, Layout, FileText, CheckCircle,
  Database, ImagePlus, Image as ImageIcon, Type, PenLine, Wand2,
  RefreshCw, ChevronRight, UploadCloud, FileUp, X, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Subject { id: string; name: string; }
interface ClassObj { id: string; name: string; section: string; }
type OptionMode = 'text' | 'image';
type EntryMode = 'manual' | 'ai';
type AiSourceMode = 'prompt' | 'document';
interface OptionData { text: string; imageBase64: string; mode: OptionMode; }

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', ring: 'focus:ring-blue-400/30', active: 'bg-blue-500 text-white border-blue-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-500', ring: 'focus:ring-violet-400/30', active: 'bg-violet-500 text-white border-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', ring: 'focus:ring-amber-400/30', active: 'bg-amber-500 text-white border-amber-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', ring: 'focus:ring-emerald-400/30', active: 'bg-emerald-500 text-white border-emerald-500' },
];

// ── Compact Diagram Upload Button ──────────────────────────────────────────
const CompactImageUpload = ({ imageBase64, onUpload, onRemove }: { imageBase64: string; onUpload: (b: string) => void; onRemove: () => void; }) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onUpload(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
      {imageBase64 ? (
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-16 rounded-xl overflow-hidden border-2 border-indigo-200 group cursor-pointer" onClick={() => ref.current?.click()}>
            <img src={imageBase64} alt="diagram" className="w-full h-full object-contain bg-gray-50" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">Change</span>
            </div>
          </div>
          <button type="button" onClick={onRemove} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-sm text-gray-500 hover:text-indigo-600 font-medium transition-all">
          <ImagePlus className="w-4 h-4" /> Upload Diagram
        </button>
      )}
    </div>
  );
};

// ── Option image upload (compact) ──────────────────────────────────────────
const OptionImageUpload = ({ imageBase64, onUpload, onRemove }: { imageBase64: string; onUpload: (b: string) => void; onRemove: () => void; }) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onUpload(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="w-full">
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      {imageBase64 ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-indigo-200 group">
          <img src={imageBase64} alt="option" className="w-full max-h-40 object-contain bg-gray-50" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => ref.current?.click()} className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold">Change</button>
            <button type="button" onClick={onRemove} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold">Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-white/60 hover:bg-indigo-50/50 rounded-xl text-sm text-gray-400 hover:text-indigo-500 font-medium transition-all">
          <ImagePlus className="w-4 h-4" /> Click to upload diagram image
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
export const AddMasterQuestionPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [questionImageBase64, setQuestionImageBase64] = useState('');
  const [formData, setFormData] = useState({
    subjectId: '', classId: '', chapterName: '', topicName: '',
    difficulty: 'MEDIUM', questionText: '', correctAnswer: '', marks: 4, explanation: ''
  });
  const [options, setOptions] = useState<OptionData[]>([
    { text: '', imageBase64: '', mode: 'text' },
    { text: '', imageBase64: '', mode: 'text' },
    { text: '', imageBase64: '', mode: 'text' },
    { text: '', imageBase64: '', mode: 'text' },
  ]);

  // AI state
  const [aiSourceMode, setAiSourceMode] = useState<AiSourceMode>('prompt');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<any[]>([]);
  const [selectedAiIdx, setSelectedAiIdx] = useState<number | null>(null);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiFileName, setAiFileName] = useState('');
  const aiFileRef = useRef<HTMLInputElement>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  useEffect(() => { fetchFilters(); }, []);

  const fetchFilters = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        api.get('/api/classes?limit=5000'),
        api.get('/api/subjects?limit=5000')
      ]);
      const allC = clsRes.data?.data || [];
      const uniqueClasses: ClassObj[] = [];
      const seen = new Set();
      for(const c of allC) {
        if(!seen.has(c.name)) {
          seen.add(c.name);
          uniqueClasses.push(c);
        }
      }
      // Sort numerically by parsing the first number if possible, or alphabetically
      uniqueClasses.sort((a, b) => {
        const numA = parseInt(a.name) || 0;
        const numB = parseInt(b.name) || 0;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
      setClasses(uniqueClasses);
      setSubjects(subRes.data?.data || []);
    } catch (e) { console.error(e); }
  };



  const updateOption = (i: number, updates: Partial<OptionData>) =>
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, ...updates } : o));

  const handleSave = async () => {
    if (!formData.subjectId || !formData.classId || !formData.chapterName || !formData.questionText || !formData.correctAnswer) {
      alert('Please fill all required fields.'); return;
    }
    setLoading(true);
    try {
      const optionsForSave = options.map(o =>
        o.mode === 'image' && o.imageBase64 ? `[IMAGE:${o.imageBase64}]` : o.text
      );
      await api.post('/api/master-questions', {
        ...formData,
        imageUrl: questionImageBase64 || undefined,
        options: JSON.stringify(optionsForSave)
      });
      navigate('/question-bank/master-bank');
    } catch { alert('Failed to save question.'); }
    finally { setLoading(false); }
  };

  const handleAIGenerate = async () => {
    if (!formData.subjectId || !formData.classId || !formData.chapterName) {
      alert('Please select Class, Subject and enter Chapter Name first.'); return;
    }
    setIsGenerating(true);
    setAiGeneratedList([]);
    setSelectedAiIdx(null);
    setGenerationSuccess(false);
    try {
      let res: any;
      if (aiSourceMode === 'document' && aiFile) {
        // Multipart upload
        const fd = new FormData();
        fd.append('file', aiFile);
        fd.append('subjectId', formData.subjectId);
        fd.append('classId', formData.classId);
        fd.append('chapterName', formData.chapterName);
        fd.append('difficulty', formData.difficulty);
        fd.append('count', String(aiCount));
        fd.append('prompt', aiPrompt || 'Generate standard MCQ questions from this document');
        res = await api.post('/api/master-questions/generate-ai', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/api/master-questions/generate-ai', {
          subjectId: formData.subjectId, classId: formData.classId,
          chapterName: formData.chapterName, difficulty: formData.difficulty,
          prompt: aiPrompt || 'Generate standard MCQ questions', count: aiCount
        });
      }
      const generated = res.data?.data || [];
      setAiGeneratedList(generated);
      setGenerationSuccess(true);
      if (generated.length > 0) setSelectedAiIdx(0);
    } catch { alert('AI Generation failed. Please try again.'); }
    finally { setIsGenerating(false); }
  };

  const applyAiQuestion = (q: any) => {
    let opts: string[] = [];
    try { opts = JSON.parse(q.options); } catch {}
    setFormData(prev => ({ ...prev, questionText: q.questionText, correctAnswer: q.correctAnswer, explanation: q.explanation || '' }));
    setOptions(opts.slice(0, 4).map(t => ({ text: t, imageBase64: '', mode: 'text' as OptionMode })));
    setEntryMode('manual');
  };

  const handleAiFileSelect = (file: File) => {
    setAiFile(file);
    setAiFileName(file.name);
  };

  return (
    <div className="flex flex-col bg-[#f4f6fb]" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader
        title="Add Master Question"
        icon={<Database className="w-5 h-5" />}
        action={
          <div className="flex gap-3">
            <button onClick={() => navigate('/question-bank/master-bank')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-semibold shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-indigo-300/40 transition-all hover:scale-[1.02] disabled:opacity-50">
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-6">

          {/* LEFT SIDEBAR — Config */}
          <div className="w-full xl:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-400" /> Configuration
              </h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Class <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Chapter <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" placeholder="e.g. Kinematics" value={formData.chapterName} onChange={e => setFormData({ ...formData, chapterName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Topic (Optional)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" placeholder="e.g. Projectile Motion" value={formData.topicName} onChange={e => setFormData({ ...formData, topicName: e.target.value })} />
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Difficulty</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Marks</label>
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-xl px-2 py-2.5 bg-gray-50 text-sm font-bold text-center focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/30" value={formData.marks} onChange={e => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* TAB SWITCHER */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2">
              <button onClick={() => setEntryMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all ${entryMode === 'manual' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/40' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>
                <PenLine className="w-4 h-4" /> Manual Entry
              </button>
              <button onClick={() => setEntryMode('ai')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all ${entryMode === 'ai' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Wand2 className="w-4 h-4" /> AI Generate
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${entryMode === 'ai' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>SMART</span>
              </button>
            </div>

            {/* ═══════════ AI GENERATE MODE ═══════════ */}
            {entryMode === 'ai' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">AI Question Generator</h2>
                      <p className="text-gray-400 text-xs">Powered by Gemini AI — questions are automatically saved to the bank</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">✨ SMART</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Source Toggle */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Generate From</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setAiSourceMode('prompt')}
                          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${aiSourceMode === 'prompt' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${aiSourceMode === 'prompt' ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                            <BookOpen className={`w-4 h-4 ${aiSourceMode === 'prompt' ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`font-bold text-sm ${aiSourceMode === 'prompt' ? 'text-indigo-700' : 'text-gray-600'}`}>Text Prompt</p>
                            <p className="text-xs text-gray-400">Describe what to generate</p>
                          </div>
                        </button>
                        <button type="button" onClick={() => setAiSourceMode('document')}
                          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${aiSourceMode === 'document' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${aiSourceMode === 'document' ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                            <FileUp className={`w-4 h-4 ${aiSourceMode === 'document' ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`font-bold text-sm ${aiSourceMode === 'document' ? 'text-indigo-700' : 'text-gray-600'}`}>Upload Document</p>
                            <p className="text-xs text-gray-400">PDF, Image, Word file</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Document Upload */}
                    {aiSourceMode === 'document' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload File (PDF / Image / Document)</label>
                        <input ref={aiFileRef} type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt"
                          className="hidden"
                          onChange={e => { if (e.target.files?.[0]) handleAiFileSelect(e.target.files[0]); }} />
                        {aiFile ? (
                          <div className="flex items-center gap-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <FileUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{aiFileName}</p>
                              <p className="text-xs text-gray-400">{(aiFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button type="button" onClick={() => { setAiFile(null); setAiFileName(''); }}
                              className="p-2 hover:bg-indigo-100 rounded-xl transition-colors">
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => aiFileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleAiFileSelect(f); }}
                            className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group">
                            <UploadCloud className="w-8 h-8 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-sm text-gray-400 group-hover:text-indigo-500 font-medium">Click or drag file here</span>
                            <span className="text-xs text-gray-300">PDF, PNG, JPG, DOC, TXT — Max 20MB</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Prompt / Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {aiSourceMode === 'document' ? 'Instructions (Optional)' : 'Focus Prompt (Optional)'}
                        </label>
                        <textarea
                          className="w-full h-36 border-2 border-gray-100 rounded-2xl px-5 py-4 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-300 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                          placeholder={aiSourceMode === 'document'
                            ? "Optional instructions for the AI...\n\nExamples:\n• Generate 5 questions from each topic\n• Focus on numerical problems\n• NEET difficulty level"
                            : "Describe what kind of questions to generate...\n\nExamples:\n• Focus on real-world applications\n• Include diagram-based questions\n• NEET/JEE difficulty level"}
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Questions</label>
                          <div className="flex items-center bg-gray-50 rounded-xl border-2 border-gray-100 overflow-hidden">
                            <button type="button" onClick={() => setAiCount(Math.max(1, aiCount - 1))} className="px-4 py-3 text-gray-600 font-bold text-lg hover:bg-gray-100 transition-colors">−</button>
                            <span className="flex-1 text-center text-gray-800 font-bold text-xl">{aiCount}</span>
                            <button type="button" onClick={() => setAiCount(Math.min(20, aiCount + 1))} className="px-4 py-3 text-gray-600 font-bold text-lg hover:bg-gray-100 transition-colors">+</button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 text-center">Max 20 questions</p>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <button onClick={handleAIGenerate} disabled={isGenerating || (aiSourceMode === 'document' && !aiFile)}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md disabled:opacity-50 text-base">
                            {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Now</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Success + Results */}
                {generationSuccess && aiGeneratedList.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">✅ {aiGeneratedList.length} Questions Generated & Saved to Bank!</h3>
                          <p className="text-xs text-gray-400">All questions are already saved in the database. Click "Edit" to modify any question before using.</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/question-bank/master-bank')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                        View in Bank <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-5 space-y-3">
                      {aiGeneratedList.map((q, idx) => {
                        let opts: string[] = [];
                        try { opts = JSON.parse(q.options); } catch {}
                        const isSelected = selectedAiIdx === idx;
                        return (
                          <div key={idx} onClick={() => setSelectedAiIdx(isSelected ? null : idx)}
                            className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                  <p className="text-sm font-semibold text-gray-800 leading-snug">{q.questionText}</p>
                                </div>
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-2 gap-1.5 ml-8">
                                    {opts.map((opt, oi) => (
                                      <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 ${opt === q.correctAnswer ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                                        <span className="font-bold">{OPTION_LABELS[oi]}.</span> {opt}
                                        {opt === q.correctAnswer && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0 text-emerald-600" />}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={e => { e.stopPropagation(); applyAiQuestion(q); }}
                                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                                Edit & Use <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════ MANUAL ENTRY MODE ═══════════ */}
            {entryMode === 'manual' && (
              <div className="space-y-5">
                {/* QUESTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Question</h3>
                      <p className="text-xs text-gray-400">Write the question. Optionally attach a figure/diagram.</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Question Text <span className="text-red-500">*</span></label>
                      <textarea
                        className="w-full min-h-[200px] border-2 border-gray-100 rounded-2xl p-5 bg-gray-50/50 focus:bg-white outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 text-base leading-relaxed text-gray-800 resize-y font-medium transition-all placeholder-gray-300"
                        placeholder={"Type your question here...\n\nTip: You can write multi-line questions, include formulas (LaTeX), and attach a diagram below."}
                        value={formData.questionText}
                        onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                      />
                    </div>
                    {/* COMPACT DIAGRAM UPLOAD */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Question Diagram:
                      </label>
                      <CompactImageUpload imageBase64={questionImageBase64} onUpload={setQuestionImageBase64} onRemove={() => setQuestionImageBase64('')} />
                    </div>
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Options</h3>
                      <p className="text-xs text-gray-400">Each option can be text or a diagram image — toggle per option</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {options.map((opt, i) => {
                      const color = OPTION_COLORS[i];
                      const lbl = OPTION_LABELS[i];
                      return (
                        <div key={i} className={`rounded-2xl border-2 ${color.border} ${color.bg} p-4 flex flex-col gap-3 transition-shadow hover:shadow-md`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-lg ${color.badge} text-white text-sm font-bold flex items-center justify-center shadow-sm`}>{lbl}</span>
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Option {lbl}</span>
                            </div>
                            <div className="flex items-center bg-white rounded-xl p-0.5 shadow-sm border border-gray-100">
                              <button type="button" onClick={() => updateOption(i, { mode: 'text' })}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${opt.mode === 'text' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                                <Type className="w-3 h-3" /> Text
                              </button>
                              <button type="button" onClick={() => updateOption(i, { mode: 'image' })}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${opt.mode === 'image' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                                <ImageIcon className="w-3 h-3" /> Image
                              </button>
                            </div>
                          </div>
                          {opt.mode === 'text' && (
                            <textarea
                              className={`w-full min-h-[110px] bg-white/70 border border-white rounded-xl p-3.5 outline-none focus:ring-2 ${color.ring} text-sm font-medium text-gray-800 resize-y placeholder-gray-300 transition-all leading-relaxed`}
                              placeholder={`Enter option ${lbl} content...`}
                              value={opt.text}
                              onChange={e => updateOption(i, { text: e.target.value })}
                            />
                          )}
                          {opt.mode === 'image' && (
                            <div className="space-y-2">
                              <OptionImageUpload imageBase64={opt.imageBase64} onUpload={b => updateOption(i, { imageBase64: b })} onRemove={() => updateOption(i, { imageBase64: '' })} />
                              <input type="text" className="w-full bg-white/70 border border-white rounded-xl px-3.5 py-2 text-xs text-gray-500 outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-300" placeholder="Optional caption..." value={opt.text} onChange={e => updateOption(i, { text: e.target.value })} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ANSWER & EXPLANATION */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Answer & Explanation</h3>
                      <p className="text-xs text-gray-400">Click A / B / C / D to quickly mark the correct answer</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Correct Answer <span className="text-red-500">*</span></label>
                      <div className="flex gap-2 mb-3">
                        {OPTION_LABELS.map((lbl, i) => {
                          const optText = options[i].mode === 'text' ? options[i].text : `[Option ${lbl}]`;
                          const isSelected = formData.correctAnswer === optText;
                          return (
                            <button key={lbl} type="button"
                              onClick={() => setFormData({ ...formData, correctAnswer: optText })}
                              className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${isSelected ? OPTION_COLORS[i].active : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'}`}>
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                      <input type="text"
                        className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 bg-emerald-50 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-300/20 placeholder-emerald-300 transition-all"
                        placeholder="Or type the correct answer manually..."
                        value={formData.correctAnswer}
                        onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Explanation (Optional)</label>
                      <textarea
                        className="w-full min-h-[140px] border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-700 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-200/50 resize-y placeholder-gray-300 transition-all leading-relaxed"
                        placeholder="Explain why this is the correct answer..."
                        value={formData.explanation}
                        onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="flex justify-end pb-6">
                  <button onClick={handleSave} disabled={loading}
                    className="px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-base flex items-center gap-3 shadow-xl shadow-indigo-300/40 hover:from-indigo-700 hover:to-violet-700 hover:scale-[1.02] transition-all disabled:opacity-50">
                    <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Question to Bank'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMasterQuestionPage;
