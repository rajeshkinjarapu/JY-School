import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Sparkles, Upload, Save, Printer, FileText, Settings, Maximize, X, Wand2, BookOpen, ImagePlus, Key } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import type { FloatingImage } from '../../components/QuestionBank/LiveLatexPreview';
import { api } from '../../api/axios';

import { PageHeader } from '../../components/UI/PageHeader';
import { SavedPapersPage } from './SavedPapersPage';
import { AnswerKeyManager } from '../../components/QuestionBank/AnswerKeyManager';

export const NavodayaPaperGeneratorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paperId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<'landing' | 'generator' | 'saved' | 'answer-key'>(paperId ? 'generator' : 'landing');
  const [isSaving, setIsSaving] = useState(false);
  
  // Paper Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [examName, setExamName] = useState<string>(() => localStorage.getItem('navodaya_exam_name') || 'NAVODAYA GRAND TEST');
  const [examSubject] = useState<string>('Mathematics'); // Hardcoded to Mathematics
  const [examDate, setExamDate] = useState<string>(() => localStorage.getItem('navodaya_exam_date') || '');
  const [maxMarks, setMaxMarks] = useState('100');
  const [time, setTime] = useState<string>(() => localStorage.getItem('navodaya_exam_marks') || '75');
  const [instructions, setInstructions] = useState<string>(() => 
    localStorage.getItem('navodaya_exam_instructions') || 'Answer all questions.\nEach question carries equal marks.\nRead questions carefully before answering.'
  );
  const [examClass, setExamClass] = useState<string>(() => localStorage.getItem('navodaya_exam_class') || '6th Class');
  
  // Settings State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSourceType, setAiSourceType] = useState('text');
  const [aiInput, setAiInput] = useState('');
  const [aiInstructions, setAiInstructions] = useState('Generate Navodaya Entrance Exam style questions for Mathematics');
  const [aiImageBase64, setAiImageBase64] = useState<string>('');
  const [aiImageMimeType, setAiImageMimeType] = useState<string>('');
  
  // Settings State
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
    window.print();
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
        formData.append('subject', examSubject);
        if (activeAiModel === 'gemini' && geminiApiKey) {
          formData.append('apiKey', geminiApiKey);
        }

        const response = await api.post('/api/question-bank/questions/import-docx', formData, {
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
        subject: examSubject,
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

  const handleSave = async () => {
    let finalExamName = examName;
    if (!paperId) {
      const userTitle = window.prompt("Enter a Title/Name for this Navodaya Paper to save:", examName);
      if (userTitle === null) return; 
      if (userTitle.trim()) {
        finalExamName = userTitle.trim();
        setExamName(finalExamName);
      }
    }

    setIsSaving(true);
    toast.loading(paperId ? 'Updating paper...' : 'Saving paper...', { id: 'save' });
    try {
      const serializedContent = serializeContent();
      const payload = { examName: finalExamName, examSubject: finalExamName, examDate, time, instructions, content: serializedContent };
      if (paperId) {
        await api.put(`/api/generated-papers/${paperId}`, payload);
        toast.success('Paper updated successfully!', { id: 'save' });
      } else {
        const res = await api.post('/api/generated-papers', payload);
        toast.success('Paper saved! You can now find it in Saved Papers.', { id: 'save' });
        navigate(`/question-bank/navodaya-generator?id=${res.data.id}`, { replace: true });
      }
    } catch (err) {
      toast.error('Failed to save paper.', { id: 'save' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-50/50 print:block" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={
          activeTab === 'landing' ? "Navodaya Paper Hub" :
          activeTab === 'generator' ? "Navodaya Paper Generator" :
          activeTab === 'saved' ? "Saved Navodaya Papers" :
          "Answer Key Manager"
        } 
        icon={<FileText className="w-5 h-5 text-white" />} 
      />
      
      {/* Navigation Tabs Removed */}

      {activeTab === 'landing' && (
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center animate-fade-in">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Navodaya Paper Hub</h1>
            <p className="text-slate-500 mt-3 text-lg font-medium">What would you like to do today?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Box 1 */}
            <button onClick={() => setActiveTab('generator')} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-center hover:-translate-y-1">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Paper Generator</h3>
              <p className="text-sm text-slate-500 font-medium">Create a new Navodaya exam paper from scratch or using AI.</p>
            </button>

            {/* Box 2 */}
            <button onClick={() => setActiveTab('saved')} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-center hover:-translate-y-1">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Saved Papers</h3>
              <p className="text-sm text-slate-500 font-medium">View, edit, or print your previously generated Navodaya papers.</p>
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
      {/* Actions Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/question-bank')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('saved')}
            className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-sm font-medium"
            title="Saved Papers"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Papers</span>
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
            title="Full Screen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paper Settings
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 font-medium transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            ✨ AI Generate
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : paperId ? 'Update Paper' : 'Save Paper'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-medium transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print A4
          </button>
        </div>
      </div>

      {/* Main Dual Layout Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden print:overflow-visible h-[calc(100vh-80px)] print:h-auto custom-scrollbar">
        
        {/* Left Side: Editor (Hidden on Print) */}
        <div className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-0 flex-shrink-0 lg:flex-shrink p-6 overflow-y-auto border-r border-slate-200 bg-white print:hidden custom-scrollbar">
          <div className="h-full flex flex-col pb-20">
            <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4 flex justify-between items-center">
              <span>Question Content (LaTeX Support)</span>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*" 
                  onChange={handleImageUploadForEditor} 
                  className="hidden" 
                />
                <span className="text-xs text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 9v2m0 4v.01M5.05 19h13.9c1.66 0 3-1.34 3-3V8c0-1.66-1.34-3-3-3H5.05c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3z"/></svg>
                  Tip: Press Enter 3-4 times to leave empty space for answers
                </span>
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5 border border-purple-200 shadow-sm"
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Insert Image
                </button>
                <button 
                  onClick={autoFormatText}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Auto-Align Format
                </button>
              </div>
            </h3>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handleEditorPaste}
              className="flex-1 w-full rounded-xl border-slate-200 bg-slate-50 border p-5 font-mono text-base leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none min-h-[400px]"
              placeholder="1. Question text&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;&#10;Tip: You can paste images directly (Ctrl+V) or click 'Insert Image'!"
            />
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-full lg:w-1/2 min-h-[60vh] lg:min-h-0 flex-shrink-0 lg:flex-shrink overflow-y-auto bg-slate-100 print:w-full print:bg-white custom-scrollbar flex flex-col relative">
          <div className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center print:hidden">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              Live Preview
            </h3>
          </div>
          <div className="flex justify-center p-8 print:p-0">
            <div className="paper-zoom origin-top transition-transform">
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

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" /> AI Generate (Navodaya Math)
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Source Tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button 
                  onClick={() => setAiSourceType('text')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  📝 Text Prompt
                </button>
                <button 
                  onClick={() => setAiSourceType('file')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  📄 Upload File
                </button>
                <button 
                  onClick={() => setAiSourceType('url')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'url' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  🔗 Website Link
                </button>
              </div>

              {/* Dynamic Input Area */}
              {aiSourceType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paste text, or <span className="text-blue-600 font-bold">Paste an Image (Ctrl+V)</span></label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onPaste={handleAiPaste}
                    className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none resize-none h-32 transition-all custom-scrollbar"
                    placeholder="E.g., Generate 10 Navodaya Model questions for Mathematics..."
                  />
                  {aiImageBase64 && (
                    <div className="mt-3 relative inline-block">
                       <img src={`data:${aiImageMimeType};base64,${aiImageBase64}`} alt="Pasted" className="h-24 rounded-lg shadow-sm border border-slate-200 object-contain" />
                       <button onClick={() => { setAiImageBase64(''); setAiImageMimeType(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md">
                          <X className="w-3 h-3" />
                       </button>
                    </div>
                  )}
                </div>
              )}
              {aiSourceType === 'file' && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                  <input type="file" accept="image/*,application/pdf,.tex,.txt,.csv,.md,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleAiFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload a file</p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, PDF, <strong className="text-purple-600">DOCX (Word with Equations)</strong>, TEX and more (Max 20MB)</p>
                </div>
              )}
              {aiSourceType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="https://example.com/article"
                  />
                </div>
              )}

              {/* Specific Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom AI Instructions (Optional)</label>
                <input
                  type="text"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  placeholder="E.g., Only extract multiple choice questions, ignore theory..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  handleAiGenerate();
                }}
                disabled={isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-colors shadow-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Paper Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={examSubject}
                    disabled
                    className="w-full rounded-lg border-slate-200 bg-slate-100 border p-2.5 text-sm outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <input
                  type="text"
                  value={examClass}
                  onChange={(e) => {
                    setExamClass(e.target.value);
                    localStorage.setItem('navodaya_exam_class', e.target.value);
                  }}
                  placeholder="e.g. 6th Class"
                  className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marks</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">General Instructions (One per line)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-24 transition-all"
                  placeholder="Enter each instruction on a new line..."
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Model Configuration
                </h4>
                
                <div className="space-y-4">
                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'gemini' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}>
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
                      <span className="font-medium text-slate-700">Google Gemini</span>
                    </label>
                    {activeAiModel === 'gemini' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={geminiApiKey}
                          onChange={(e) => {
                            setGeminiApiKey(e.target.value);
                            localStorage.setItem('jy_gemini_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                          placeholder="Gemini API Key"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'claude' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}>
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
                      <span className="font-medium text-slate-700">Anthropic Claude</span>
                    </label>
                    {activeAiModel === 'claude' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={claudeApiKey}
                          onChange={(e) => {
                            setClaudeApiKey(e.target.value);
                            localStorage.setItem('jy_claude_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                          placeholder="Claude API Key"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'chatgpt' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'chatgpt'}
                        onChange={() => {
                          setActiveAiModel('chatgpt');
                          localStorage.setItem('jy_active_ai_model', 'chatgpt');
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-700">OpenAI ChatGPT</span>
                    </label>
                    {activeAiModel === 'chatgpt' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={chatgptApiKey}
                          onChange={(e) => {
                            setChatgptApiKey(e.target.value);
                            localStorage.setItem('jy_chatgpt_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          placeholder="OpenAI API Key"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'deepseek' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'deepseek'}
                        onChange={() => {
                          setActiveAiModel('deepseek');
                          localStorage.setItem('jy_active_ai_model', 'deepseek');
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-700">DeepSeek API</span>
                    </label>
                    {activeAiModel === 'deepseek' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={deepseekApiKey}
                          onChange={(e) => {
                            setDeepseekApiKey(e.target.value);
                            localStorage.setItem('jy_deepseek_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="DeepSeek API Key"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => {
                  localStorage.setItem('navodaya_exam_name', examName);
                  localStorage.setItem('navodaya_exam_date', examDate);
                  localStorage.setItem('navodaya_exam_marks', time);
                  localStorage.setItem('navodaya_exam_instructions', instructions);
                  setIsSettingsOpen(false);
                  toast.success('Settings saved!');
                }}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .paper-zoom { zoom: 0.8; }
        /* Firefox fallback */
        @-moz-document url-prefix() {
          .paper-zoom { transform: scale(0.8); transform-origin: top center; margin-bottom: -20%; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @media print {
          .paper-zoom { zoom: 1 !important; transform: none !important; margin: 0 !important; }
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact; background: white; }
          #root { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default NavodayaPaperGeneratorPage;
