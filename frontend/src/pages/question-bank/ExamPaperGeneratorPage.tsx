import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Sparkles, Upload, Save, Printer, FileText, Settings, Maximize, X, Wand2, BookOpen, ImagePlus, LayoutTemplate, Key } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import type { FloatingImage } from '../../components/QuestionBank/LiveLatexPreview';
import { api } from '../../api/axios';

import { PageHeader } from '../../components/UI/PageHeader';

import SavedPapersPage from './SavedPapersPage';
import { AnswerKeyManager } from '../../components/QuestionBank/AnswerKeyManager';

export const ExamPaperGeneratorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paperId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<'landing' | 'generator' | 'saved' | 'answer-key'>(paperId ? 'generator' : 'landing');

  const [isSaving, setIsSaving] = useState(false);
  
  // Paper Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [examName, setExamName] = useState<string>(() => localStorage.getItem('exam_gen_name') || 'GRAND TEST');
  const [examDate, setExamDate] = useState<string>(() => localStorage.getItem('exam_gen_date') || '');
  const [maxMarks, setMaxMarks] = useState('100');
  const [time, setTime] = useState<string>(() => localStorage.getItem('exam_gen_marks') || '75');
  const [instructions, setInstructions] = useState<string>(() => 
    localStorage.getItem('exam_gen_instructions') || 'Answer all questions.\nEach question carries equal marks.\nRead questions carefully before answering.'
  );
  const [examClass, setExamClass] = useState<string>(() => localStorage.getItem('exam_gen_class') || '10th Class');
  
  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSourceType, setAiSourceType] = useState('text');
  const [aiInput, setAiInput] = useState('');
  const [aiInstructions, setAiInstructions] = useState('Generate multiple choice questions');
  const [aiImageBase64, setAiImageBase64] = useState<string>('');
  const [aiImageMimeType, setAiImageMimeType] = useState<string>('');
  
  // AI Settings State
  const [activeAiModel, setActiveAiModel] = useState<string>(() => {
    return localStorage.getItem('jy_active_ai_model') || 'gemini';
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_gemini_api_key') || '';
  });
  const [claudeApiKey, setClaudeApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_claude_api_key') || '';
  });
  const [chatgptApiKey, setChatgptApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_chatgpt_api_key') || '';
  });
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_deepseek_api_key') || '';
  });
  

  
  // Editor State
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline Images State: { id: FloatingImage }
  const [inlineImages, setInlineImages] = useState<Record<string, FloatingImage>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  const generateImageId = () => Math.random().toString(36).substring(2, 8);

  const insertImageAtCursor = (dataUrl: string) => {
    const id = generateImageId();
    setInlineImages(prev => ({
      ...prev,
      [id]: { dataUrl, x: 50, y: 50, width: 200, height: 200 }
    }));
    toast.success('Image added! You can drag and resize it in the preview.');
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            insertImageAtCursor(dataUrl);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const handleImageUploadForEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG/PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large! Max 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      insertImageAtCursor(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const serializeContent = (): string => {
    if (Object.keys(inlineImages).length === 0) return content;
    const cleanContent = content.replace(/\[IMG:([a-z0-9]+)\]/g, '');
    return cleanContent + '\n<!--INLINE_IMAGES:' + JSON.stringify(inlineImages) + '-->';
  };

  const deserializeContent = (raw: string): { text: string; images: Record<string, FloatingImage> } => {
    const imgMatch = raw.match(/\n<!--INLINE_IMAGES:(.*?)-->$/);
    if (imgMatch) {
      try {
        const parsed = JSON.parse(imgMatch[1]);
        const migrated: Record<string, FloatingImage> = {};
        for (const [id, val] of Object.entries(parsed)) {
          if (typeof val === 'string') {
            migrated[id] = { dataUrl: val, x: 50, y: 50, width: 200, height: 200 };
          } else {
            migrated[id] = val as FloatingImage;
          }
        }
        const text = raw.substring(0, raw.indexOf('\n<!--INLINE_IMAGES:'));
        return { text: text.replace(/\[IMG:([a-z0-9]+)\]/g, ''), images: migrated };
      } catch { return { text: raw, images: {} }; }
    }
    return { text: raw.replace(/\[IMG:([a-z0-9]+)\]/g, ''), images: {} };
  };

  const handlePrint = () => {
    const paperEl = document.getElementById('a4-preview-paper');
    if (!paperEl) { window.print(); return; }
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) { window.print(); return; }
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.outerHTML).join('');
    const styleTags = Array.from(document.querySelectorAll('style')).map((s) => `<style>${s.innerHTML}</style>`).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Print</title>${styleLinks}${styleTags}<style>@page{margin:12.7mm;size:A4;}html,body{margin:0;padding:0;background-color:#ffffff !important;background:#ffffff !important;color:#000000 !important;}@media print{html,body{background-color:#ffffff !important;background:#ffffff !important;}}#print-root{width:210mm;margin:0 auto;background-color:#ffffff !important;}</style></head><body><div id="print-root">${paperEl.outerHTML}</div></body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500); };
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => {
          toast.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleAiPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
             const result = event.target?.result as string;
             const [prefix, base64] = result.split(',');
             const mime = prefix.split(':')[1].split(';')[0];
             setAiImageBase64(base64);
             setAiImageMimeType(mime);
             toast.success("Image pasted successfully! You can now generate.");
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleAiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large! Maximum size is 10MB.');
      return;
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExt === '.doc') {
      toast.error('Old Word documents (.doc) are not supported. Please save as .docx and try again.');
      return;
    }

    if (fileExt === '.docx') {
      const toastId = toast.loading('Uploading Word document to AI... Please wait.');
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (activeAiModel === 'gemini' && geminiApiKey) {
          formData.append('apiKey', geminiApiKey);
        }

        const response = await api.post('/api/questions/import-docx', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000, 
        });

        const questions = response.data.questions;
        if (!questions || questions.length === 0) {
          toast.error('No questions found in document.', { id: toastId });
          return;
        }

        let generatedText = '\n\n';
        const lines = content.split('\n');
        let maxQ = 0;
        for (const line of lines) {
          const match = line.match(/^(\d+)\.\s/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxQ) maxQ = num;
          }
        }

        questions.forEach((q: any, i: number) => {
          generatedText += `${maxQ + i + 1}. ${q.questionText}\n`;
          if (q.optionA) generatedText += `(A) ${q.optionA}\n`;
          if (q.optionB) generatedText += `(B) ${q.optionB}\n`;
          if (q.optionC) generatedText += `(C) ${q.optionC}\n`;
          if (q.optionD) generatedText += `(D) ${q.optionD}\n`;
          generatedText += '\n';
        });

        setContent(prev => prev.trim() + generatedText);
        toast.success(`✅ ${questions.length} questions extracted from Word document!`, { id: toastId });
        setIsAiModalOpen(false);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to process Word document: ' + (err.response?.data?.message || err.message), { id: toastId });
      }
      return;
    }
    const textTypes = ['.tex', '.txt', '.csv', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (textTypes.includes(ext) || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAiInput(text);
        setAiSourceType('text');
        toast.success(`${file.name} loaded as text! You can now add instructions and generate.`);
      };
      reader.readAsText(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const [prefix, base64] = result.split(',');
      const mime = prefix.split(':')[1].split(';')[0];
      setAiImageBase64(base64);
      setAiImageMimeType(mime);
      setAiSourceType('text');
      toast.success(`${file.name} uploaded! You can now add text instructions and generate.`);
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (aiSourceType === 'file') {
      toast.error("Please select an image file first.");
      return;
    }

    if (!aiInput.trim() && !aiImageBase64) {
      toast.error("Please enter some text, paste an image, or provide a URL.");
      return;
    }

    setIsGenerating(true);
    toast.loading("AI is analyzing and generating...", { id: 'ai-gen' });
    
    try {
      const finalPrompt = aiInstructions 
        ? `Instructions: ${aiInstructions}\n\nContent:\n${aiInput}` 
        : aiInput;

      let selectedKey = undefined;
      if (activeAiModel === 'gemini') selectedKey = geminiApiKey;
      else if (activeAiModel === 'claude') selectedKey = claudeApiKey;
      else if (activeAiModel === 'chatgpt') selectedKey = chatgptApiKey;
      else if (activeAiModel === 'deepseek') selectedKey = deepseekApiKey;

      const payload: any = {
        text: finalPrompt,
        apiKey: selectedKey || undefined,
        aiModel: activeAiModel
      };
      
      if (aiImageBase64) {
        payload.imageBase64 = aiImageBase64;
        payload.imageMimeType = aiImageMimeType;
      }

      const response = await api.post('/api/questions/import-ai', payload, { timeout: 120000 });

      const questions = response.data.questions || [];
      
      if (questions.length === 0) {
        toast.error("No questions could be generated. Try different text.", { id: 'ai-gen' });
        setIsGenerating(false);
        return;
      }

      let generatedText = '\n\n';
      const lines = content.split('\n');
      let maxQ = 0;
      for (const line of lines) {
        const match = line.match(/^(\d+)\.\s/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxQ) maxQ = num;
        }
      }

      questions.forEach((q: any, i: number) => {
        generatedText += `${maxQ + i + 1}. ${q.questionText}\n`;
        if (q.optionA) generatedText += `(A) ${q.optionA}\n`;
        if (q.optionB) generatedText += `(B) ${q.optionB}\n`;
        if (q.optionC) generatedText += `(C) ${q.optionC}\n`;
        if (q.optionD) generatedText += `(D) ${q.optionD}\n`;
        generatedText += '\n';
      });

      setContent(content.trim() + generatedText);
      setIsGenerating(false);
      setAiImageBase64('');
      setAiImageMimeType('');
      toast.success(`${questions.length} questions generated successfully!`, { id: 'ai-gen' });
    } catch (error: any) {
      console.error(error);
      setIsGenerating(false);
      toast.error("AI Generation failed: " + (error.response?.data?.message || error.message), { id: 'ai-gen' });
    }
  };

  const autoFormatText = () => {
    const lines = content.split('\n');
    let formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        formatted.push('');
        continue;
      }
      
      const optionRegex = /\b([a-dA-D])[\)\.]\s+/g;
      if (line.match(optionRegex) && (line.match(optionRegex)?.length ?? 0) > 1) {
         line = line.replace(/\b([a-dA-D])[\)\.]\s+/g, (match, letter) => `\n(${letter.toUpperCase()}) `);
         line = line.trim();
      }
      
      line = line.replace(/^\b([a-dA-D])[\)\.]\s+/i, (match, letter) => `(${letter.toUpperCase()}) `);
      
      if (!line.includes('$')) {
          line = line.replace(/\b(sin|cos|tan|sec|csc|cot)\s+([0-9]+[\^\_\\][a-zA-Z0-9{}]+)/gi, '$$$1 $2$$');
          line = line.replace(/^(\([A-D]\))\s+([\d\.\-\+\*\/]+)$/g, '$1 $$$2$$');
      }

      if (/^\d+[\.\)]\s/.test(line)) {
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        line = line.replace(/^(\d+)[\.\)]\s/, '$1. ');
      }
      
      formatted.push(line);
    }
    
    setContent(formatted.join('\n'));
    toast.success("Auto-formatted text!");
  };

  useEffect(() => {
    if (!paperId) return;
    setActiveTab('generator');
    const loadPaper = async () => {
      try {
        toast.loading('Loading paper...', { id: 'load' });
        const res = await api.get(`/api/generated-papers/${paperId}`);
        const p = res.data;
        setExamName(p.examName || '');
        setExamDate(p.examDate || '');
        setTime(p.time || '');
        setInstructions(p.instructions || '');
        const { text, images } = deserializeContent(p.content || '');
        setContent(text);
        setInlineImages(images);
        toast.success('Paper loaded!', { id: 'load' });
      } catch {
        toast.error('Failed to load paper.', { id: 'load' });
      }
    };
    loadPaper();
  }, [paperId]);

  const autoGenerateAnswerKey = async (id: string, paperContent: string) => {
    if (!geminiApiKey) return;
    
    try {
      const prompt = `Extract the correct answers for the following multiple choice questions if possible. 
Return ONLY a valid JSON array of objects, where each object has "qNo" (number) and "answer" (string, e.g. "A", "B", "C", "D" or the exact text). 
If a question doesn't have a clear answer marked, leave "answer" as "".
Example: [{"qNo": 1, "answer": "A"}, {"qNo": 2, "answer": "B"}]

Questions:
${paperContent}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
         let text = data.candidates[0].content.parts[0].text;
         let answers = JSON.parse(text);
         
         await api.post('/api/answer-keys', {
            paperId: id,
            answers: answers
         });
         toast.success('Answer Key auto-generated successfully!', { icon: '🤖' });
      }
    } catch(err) {
      console.error("Auto generate answer key failed:", err);
    }
  };

  const handleSave = async () => {
    let finalExamName = examName || 'Untitled Exam';

    setIsSaving(true);
    toast.loading(paperId ? 'Updating paper...' : 'Saving paper...', { id: 'save' });
    try {
      const serializedContent = serializeContent();
      const payload = { examName: finalExamName, examClass, examSubject: finalExamName, examDate, time, instructions, content: serializedContent };
      if (paperId) {
        await api.put(`/api/generated-papers/${paperId}`, payload);
        toast.success('Paper updated successfully!', { id: 'save' });
        autoGenerateAnswerKey(paperId, content);
      } else {
        const res = await api.post('/api/generated-papers', payload);
        toast.success('Paper saved! You can now find it in Saved Papers.', { id: 'save' });
        autoGenerateAnswerKey(res.data.id, content);
        navigate(`/question-bank/exam-generator?id=${res.data.id}`, { replace: true });
      }
    } catch (err) {
      toast.error('Failed to save paper.', { id: 'save' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#f8fafc] print:block relative" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none print:hidden z-0" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="print:hidden">
          <PageHeader 
            title={
              activeTab === 'landing' ? "Exam Paper Hub" :
              activeTab === 'generator' ? "Exam Paper Generator" :
              activeTab === 'saved' ? "Saved Papers" :
              "Answer Key Manager"
            } 
            icon={<LayoutTemplate className="w-5 h-5 text-indigo-600" />} 
          />
        </div>
        
        {/* Navigation Tabs Removed */}

        {activeTab === 'landing' && (
          <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Exam Paper Hub</h1>
              <p className="text-slate-500 mt-3 text-lg font-medium">What would you like to do today?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Box 1 */}
              <button onClick={() => setActiveTab('generator')} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-center hover:-translate-y-1">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <LayoutTemplate className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Paper Generator</h3>
                <p className="text-sm text-slate-500 font-medium">Create a new exam paper from scratch or using AI.</p>
              </button>

              {/* Box 2 */}
              <button onClick={() => setActiveTab('saved')} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-center hover:-translate-y-1">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Saved Papers</h3>
                <p className="text-sm text-slate-500 font-medium">View, edit, or print your previously generated papers.</p>
              </button>

              {/* Box 3 */}
              <button onClick={() => setActiveTab('answer-key')} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-center hover:-translate-y-1">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                  <Key className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Answer Keys</h3>
                <p className="text-sm text-slate-500 font-medium">Manage and auto-generate answer keys for your papers.</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="flex-1 p-4 max-w-[1920px] mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full overflow-hidden">
              {/* @ts-ignore */}
              <SavedPapersPage isEmbedded={true} />
            </div>
          </div>
        )}

        {activeTab === 'answer-key' && (
          <div className="flex-1 p-4 max-w-[1920px] mx-auto w-full">
            <AnswerKeyManager prefilledPaperId={paperId} />
          </div>
        )}

        {activeTab === 'generator' && (
          <>
        {/* Modern Actions Toolbar */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/question-bank')}
              className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center justify-center hover:-translate-x-0.5"
              title="Go Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 pl-2">
              <span className="text-sm font-bold text-slate-800">{examName || 'Untitled Exam'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('saved')}
              className="px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 text-sm font-bold"
              title="Saved Papers"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Saved Papers</span>
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
              title="Full Screen"
            >
              <Maximize className="w-4 h-4 text-slate-500" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 font-bold transition-all flex items-center gap-2 text-sm hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-bold transition-all flex items-center gap-2 disabled:opacity-60 text-sm hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 font-bold transition-all flex items-center gap-2 text-sm hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Main Dual Layout Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden h-[calc(100vh-140px)] print:h-auto max-w-[1920px] mx-auto w-full px-4 py-4 gap-4 print:p-0 print:gap-0 custom-scrollbar print:block print:overflow-visible">
          
          {/* Left Side: Editor (Hidden on Print) */}
          <div className="w-full lg:w-5/12 min-h-[50vh] lg:min-h-0 flex-shrink-0 lg:flex-shrink bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/20 flex flex-col print:hidden overflow-hidden transition-all z-10">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Question Content
              </h3>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*" 
                  onChange={handleImageUploadForEditor} 
                  className="hidden" 
                />
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 bg-white text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-1 border border-slate-200 shadow-sm"
                  title="Insert Image"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button 
                  onClick={autoFormatText}
                  className="p-1.5 bg-white text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-1 border border-slate-200 shadow-sm"
                  title="Auto-Align Format"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 9v2m0 4v.01M5.05 19h13.9c1.66 0 3-1.34 3-3V8c0-1.66-1.34-3-3-3H5.05c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3z"/></svg>
              Tip: Use "## Heading" to add a subject header. Paste images (Ctrl+V) directly.
            </div>

            <div className="flex-1 overflow-hidden relative group">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handleEditorPaste}
                className="w-full h-full p-6 font-mono text-[14px] leading-relaxed text-slate-700 bg-white focus:outline-none resize-none custom-scrollbar absolute inset-0"
                placeholder="## SECTION A - MATHEMATICS&#10;&#10;1. Question text&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;&#10;Tip: You can paste images directly (Ctrl+V) or click 'Insert Image'!"
              />
            </div>
          </div>

          {/* Right Side: Live Preview */}
          <div className="w-full lg:w-7/12 min-h-[60vh] lg:min-h-0 flex-shrink-0 lg:flex-shrink bg-slate-200/50 rounded-3xl border border-slate-200/80 shadow-inner flex flex-col overflow-hidden print:w-full print:bg-white print:border-none print:shadow-none print:rounded-none transition-all z-10 print:block print:overflow-visible">
            <div className="px-5 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex justify-between items-center print:hidden z-20 flex-shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Live Preview
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center p-8 print:p-0 relative print:block print:overflow-visible">
              <div className="paper-zoom origin-top transition-transform h-max w-full flex justify-center print:block print:overflow-visible print:!transform-none">
                <LiveLatexPreview 
                  content={content}
                  examName={examName}
                  examDate={examDate}
                  examClass={examClass}
                  logoBase64="/logo.png?v=1"
                  maxMarks={maxMarks}
                  time={time}
                  instructions={instructions.split('\n').filter(i => i.trim() !== '')}
                  isDoubleColumn={false}
                  inlineImages={inlineImages}
                  onImageUpdate={(id, updates) => setInlineImages(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))}
                  onImageDelete={(id) => {
                    setInlineImages(prev => {
                      const newImgs = { ...prev };
                      delete newImgs[id];
                      return newImgs;
                    });
                  }}
                />
              </div>
            </div>
          </div>

        </div>
        </>
        )}
      </div>

      {/* Settings Modal (Redesigned) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-black text-xl text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Settings className="w-5 h-5" />
                </div>
                Paper Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3"><BookOpen className="w-4 h-4 text-indigo-500" /> Basic Information</h3>
                
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-1.5 uppercase tracking-wide">Exam Name</label>
                    <input
                      type="text"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      placeholder="e.g. UNIT TEST - 1"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-1.5 uppercase tracking-wide">Class</label>
                    <input
                      type="text"
                      value={examClass}
                      onChange={(e) => {
                        setExamClass(e.target.value);
                        localStorage.setItem('exam_gen_class', e.target.value);
                      }}
                      placeholder="e.g. 10th Class"
                      className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-1.5 uppercase tracking-wide">Date</label>
                    <input
                      type="text"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-1.5 uppercase tracking-wide">Marks</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <label className="block text-[13px] font-black text-slate-700 mb-2 uppercase tracking-wide">General Instructions (One per line)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white border p-4 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none h-32 transition-all shadow-sm leading-relaxed"
                  placeholder="Enter each instruction on a new line..."
                />
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Model Configuration
                </h4>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border-2 transition-all ${activeAiModel === 'gemini' ? 'border-purple-500 bg-purple-50/50 shadow-md shadow-purple-500/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'gemini'}
                        onChange={() => {
                          setActiveAiModel('gemini');
                          localStorage.setItem('jy_active_ai_model', 'gemini');
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-bold text-slate-700 text-sm">Google Gemini</span>
                    </label>
                    {activeAiModel === 'gemini' && (
                      <div className="mt-4 pl-7">
                        <input
                          type="password"
                          value={geminiApiKey}
                          onChange={(e) => {
                            setGeminiApiKey(e.target.value);
                            localStorage.setItem('jy_gemini_api_key', e.target.value);
                          }}
                          className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none shadow-sm"
                          placeholder="Enter Gemini API Key"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-2xl border-2 transition-all ${activeAiModel === 'claude' ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'claude'}
                        onChange={() => {
                          setActiveAiModel('claude');
                          localStorage.setItem('jy_active_ai_model', 'claude');
                        }}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="font-bold text-slate-700 text-sm">Anthropic Claude</span>
                    </label>
                    {activeAiModel === 'claude' && (
                      <div className="mt-4 pl-7">
                        <input
                          type="password"
                          value={claudeApiKey}
                          onChange={(e) => {
                            setClaudeApiKey(e.target.value);
                            localStorage.setItem('jy_claude_api_key', e.target.value);
                          }}
                          className="w-full rounded-xl border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm"
                          placeholder="Enter Claude API Key"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('exam_gen_name', examName);
                  localStorage.setItem('exam_gen_date', examDate);
                  localStorage.setItem('exam_gen_marks', time);
                  localStorage.setItem('exam_gen_instructions', instructions);
                  setIsSettingsOpen(false);
                  toast.success('Settings saved!');
                }}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal omitted for brevity, but let's include it nicely */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-black text-xl text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                Generate via AI
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 bg-slate-50/30">
              {/* Source Tabs */}
              <div className="flex p-1.5 bg-slate-200/50 rounded-2xl">
                <button 
                  onClick={() => setAiSourceType('text')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${aiSourceType === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  📝 Prompt
                </button>
                <button 
                  onClick={() => setAiSourceType('file')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${aiSourceType === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  📄 File
                </button>
                <button 
                  onClick={() => setAiSourceType('url')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${aiSourceType === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🔗 URL
                </button>
              </div>

              {/* Dynamic Input Area */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                {aiSourceType === 'text' && (
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-2 uppercase tracking-wide">Enter text or Paste Image (Ctrl+V)</label>
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onPaste={handleAiPaste}
                      className="w-full rounded-xl border-slate-200 bg-white border p-4 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none h-36 transition-all custom-scrollbar shadow-sm"
                      placeholder={`E.g., Generate 10 multiple choice questions for Mathematics...`}
                    />
                    {aiImageBase64 && (
                      <div className="mt-4 relative inline-block p-2 bg-slate-50 rounded-xl border border-slate-100">
                         <img src={`data:${aiImageMimeType};base64,${aiImageBase64}`} alt="Pasted" className="h-32 rounded-lg object-contain" />
                         <button onClick={() => { setAiImageBase64(''); setAiImageMimeType(''); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600 shadow-md transition-colors">
                            <X className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    )}
                  </div>
                )}
                {aiSourceType === 'file' && (
                  <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/30 transition-colors relative cursor-pointer group">
                    <input type="file" accept="image/*,application/pdf,.tex,.txt,.csv,.md,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleAiFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      <Upload className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-[15px] font-black text-slate-700">Drop file here or click to browse</p>
                    <p className="text-sm font-medium text-slate-500 mt-2 text-center">Supports PDF, Images, <strong className="text-indigo-600">DOCX</strong>, TEX (Max 20MB)</p>
                  </div>
                )}
                {aiSourceType === 'url' && (
                  <div>
                    <label className="block text-[13px] font-black text-slate-700 mb-2 uppercase tracking-wide">Website URL</label>
                    <input
                      type="url"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-white border p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      placeholder="https://example.com/topic"
                    />
                  </div>
                )}
              </div>

              {/* Specific Instructions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <label className="block text-[13px] font-black text-slate-700 mb-2 uppercase tracking-wide">Custom AI Instructions</label>
                <input
                  type="text"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white border p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  placeholder="E.g., Generate 5 multiple choice questions..."
                />
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  handleAiGenerate();
                }}
                disabled={isGenerating}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all shadow-sm flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5" />
                Generate Magic
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .paper-zoom { zoom: 0.85; }
        /* Firefox fallback */
        @-moz-document url-prefix() {
          .paper-zoom { transform: scale(0.85); transform-origin: top center; margin-bottom: -15%; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @media print {
          .paper-zoom { zoom: 1 !important; transform: none !important; margin: 0 !important; }
          @page { margin: 10mm; size: A4; }
          html, body { 
            -webkit-print-color-adjust: exact; 
            background: white !important; 
            min-height: 100% !important; 
            height: auto !important; 
          }
          #root { display: block !important; background: white !important; height: auto !important; min-height: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default ExamPaperGeneratorPage;
