import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Edit2, Trash2, Plus, Search, Calendar, 
  BookOpen, Clock, ChevronLeft, AlertTriangle, 
  Eye, Printer, Download, Copy, Grid, List, X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/axios';
import { jsPDF } from 'jspdf';

interface GeneratedPaper {
  id: string;
  examName: string;
  examClass?: string;
  examSubject: string;
  examDate: string;
  time: string;
  instructions: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Fallback for stripHtml if not available
const removeHtmlTags = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  'Math': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-cyan-500' },
  'Science': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' },
  'Physics': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
  'Chemistry': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', gradient: 'from-rose-500 to-pink-500' },
  'Biology': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', gradient: 'from-green-500 to-emerald-500' },
  'English': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' },
  'History': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', gradient: 'from-orange-500 to-red-500' },
  'Social': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', gradient: 'from-fuchsia-500 to-pink-500' },
  'Telugu': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', gradient: 'from-teal-500 to-emerald-500' },
  'Hindi': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', gradient: 'from-yellow-400 to-orange-400' },
  'Default': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', gradient: 'from-slate-600 to-slate-500' }
};

const getSubjectColor = (subject: string) => {
  const keys = Object.keys(SUBJECT_COLORS).filter(k => k !== 'Default');
  const matchedKey = keys.find(k => subject.toLowerCase().includes(k.toLowerCase()));
  if (matchedKey) return SUBJECT_COLORS[matchedKey];
  
  // Pick a consistent colorful gradient based on the subject string
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return SUBJECT_COLORS[keys[index]];
};

import { PageHeader } from '../../components/UI/PageHeader';

export const SavedPapersPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New States for Redesign
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');
  
  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<GeneratedPaper | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const classes = useMemo(() => {
    const classSet = new Set<string>();
    papers.forEach(p => {
      if (p.examClass) {
        classSet.add(p.examClass);
      } else {
        const match = p.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
        if (match) classSet.add(match[1]);
      }
    });
    return Array.from(classSet).sort();
  }, [papers]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/generated-papers');
      setPapers(response.data || []);
    } catch (err) {
      toast.error('Failed to load saved papers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/generated-papers/${deleteId}`);
      toast.success('Paper deleted successfully!');
      setPapers(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Failed to delete paper');
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    const paper = papers.find(p => p.id === id);
    if (!paper) return;
    
    if (paper.examName === editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const payload = { 
        examName: editingName.trim(), 
        examSubject: paper.examSubject || '', 
        examDate: paper.examDate || '', 
        time: paper.time || '', 
        instructions: paper.instructions || '', 
        content: paper.content || '' 
      };
      await api.put(`/api/generated-papers/${id}`, payload);
      toast.success('Paper renamed successfully!');
      setPapers(prev => prev.map(p => p.id === id ? { ...p, examName: editingName.trim() } : p));
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to rename paper');
      setEditingId(null);
    }
  };

  const handleDuplicate = async (paper: GeneratedPaper) => {
    const loadingToast = toast.loading('Duplicating paper...');
    try {
      const duplicatedData = {
        examName: `${paper.examName} (Copy)`,
        examSubject: paper.examSubject,
        examDate: paper.examDate,
        time: paper.time,
        instructions: paper.instructions,
        content: paper.content,
      };
      const response = await api.post('/api/generated-papers', duplicatedData);
      setPapers(prev => [response.data, ...prev]);
      toast.success('Paper duplicated successfully!', { id: loadingToast });
    } catch {
      toast.error('Failed to duplicate paper.', { id: loadingToast });
    }
  };

  const handleDownloadPDF = (paper: GeneratedPaper) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(paper.examName, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Subject: ${paper.examSubject}  |  Duration: ${paper.time} mins`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(removeHtmlTags(paper.content), 180);
    doc.text(splitText, 15, 45);
    
    doc.save(`${paper.examName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF downloaded!');
  };

  const handlePrint = (paper: GeneratedPaper) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up blocked');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${paper.examName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { text-align: center; }
            .meta { text-align: center; font-style: italic; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .content { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <h1>${paper.examName}</h1>
          <div class="meta">Subject: ${paper.examSubject} | Duration: ${paper.time} mins</div>
          <div class="content">${paper.content}</div>
          <script>
            window.onload = () => { window.print(); window.setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter & Sort Logic
  const uniqueSubjects = ['All', ...Array.from(new Set(papers.map(p => p.examSubject).filter(Boolean)))].sort();

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      let cMatchStr = '';
      if (p.examClass) {
        cMatchStr = p.examClass;
      } else {
        const cMatch = p.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
        cMatchStr = cMatch ? cMatch[1] : '';
      }
      
      const classMatch = selectedClass === 'All' ? true : cMatchStr === selectedClass;
      const subjMatch = selectedSubject === 'All' || p.examSubject === selectedSubject;
      const searchMatch = p.examName.toLowerCase().includes(search.toLowerCase()) || p.examSubject.toLowerCase().includes(search.toLowerCase());
      
      return classMatch && subjMatch && searchMatch;
    });
  }, [papers, search, selectedSubject, selectedClass]);

  const filtered = filteredPapers.sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortOrder === 'az') return a.examName.localeCompare(b.examName);
    return 0;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  return (
    <div className={isEmbedded ? "w-full h-full flex flex-col" : "flex flex-col h-full bg-slate-100"} style={isEmbedded ? {} : { minHeight: 'calc(100vh - 64px)' }}>
      {!isEmbedded && (
        <PageHeader 
          title="Saved AI Papers" 
          icon={<BookOpen className="w-5 h-5" />} 
          action={
            <button
              onClick={() => navigate('/question-bank/generator')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg text-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Paper
            </button>
          }
        />
      )}
      <div className={`flex-1 overflow-auto ${isEmbedded ? 'p-0' : 'p-3 sm:p-4'} animate-fade-in pb-16`}>
        {/* Controls Bar */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 p-4 rounded-3xl mb-6 shadow-sm flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search papers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            {/* Subject Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
              {uniqueSubjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
                    selectedSubject === sub 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-white text-slate-500 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer min-w-[140px]"
            >
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A-Z Name</option>
            </select>
            
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl shadow-inner border border-slate-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-400">Loading papers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 border border-slate-200 border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-700">No papers found</p>
            <p className="text-sm text-slate-400 mt-1 mb-6 font-medium">Try adjusting your search or filters.</p>
            <button
              onClick={() => navigate('/question-bank/generator')}
              className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              Create New Paper
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Professional Sleek Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(paper => {
                  const colors = getSubjectColor(paper.examSubject || 'Default');
                  return (
                    <div
                      key={paper.id}
                      className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative"
                    >
                      {/* Top colored line indicator */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${colors.gradient}`}></div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {paper.examSubject || 'General'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {formatDate(paper.createdAt)}
                          </span>
                        </div>
                        
                        <div className="group/name relative">
                          {editingId === paper.id ? (
                            <input 
                              value={editingName} 
                              onChange={e => setEditingName(e.target.value)} 
                              onKeyDown={e => { if (e.key === 'Enter') handleRename(paper.id); else if (e.key === 'Escape') setEditingId(null); }}
                              onBlur={() => handleRename(paper.id)}
                              autoFocus
                              className="w-full px-2 py-1 border border-indigo-500 rounded text-[15px] font-bold text-slate-800 leading-tight mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          ) : (
                            <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-2 pr-6" title={paper.examName}>
                              {paper.examName}
                              <button onClick={(e) => { e.stopPropagation(); setEditingId(paper.id); setEditingName(paper.examName); }} className="absolute right-0 top-0 opacity-0 group-hover/name:opacity-100 text-indigo-500 hover:text-indigo-700 transition-opacity p-1 bg-white rounded-md shadow-sm border border-slate-200">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </h3>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-auto pt-4 text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {paper.examDate || '—'}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons (Hover Reveal on Desktop, visible on mobile) */}
                      <div className="bg-slate-50/80 backdrop-blur-md px-3 py-3 grid grid-cols-5 gap-1.5 border-t border-slate-100 opacity-100 lg:opacity-0 lg:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <button onClick={() => setPreviewPaper(paper)} className="col-span-1 flex items-center justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all duration-200 shadow-sm" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrint(paper)} className="col-span-1 flex items-center justify-center p-2.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-200 shadow-sm" title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownloadPDF(paper)} className="col-span-1 flex items-center justify-center p-2.5 bg-violet-50 border border-violet-100 text-violet-600 rounded-xl hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-200 shadow-sm" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/question-bank/generator?id=${paper.id}`)} className="col-span-1 flex items-center justify-center p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 shadow-sm" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(paper.id)} className="col-span-1 flex items-center justify-center p-2.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 shadow-sm" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Sleek List View - Full Table Format */
              <div className="bg-white rounded-[1rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-[12px] font-black uppercase tracking-wider text-slate-600">
                        <th className="px-5 py-3 border border-slate-300">Paper Name</th>
                        <th className="px-5 py-3 border border-slate-300">Subject</th>
                        <th className="px-5 py-3 border border-slate-300">Date</th>
                        <th className="px-5 py-3 border border-slate-300 text-center">Marks</th>
                        <th className="px-5 py-3 border border-slate-300 text-center">Created On</th>
                        <th className="px-5 py-3 border border-slate-300 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filtered.map(paper => {
                        const colors = getSubjectColor(paper.examSubject || 'Default');
                        return (
                          <tr key={paper.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-5 py-3 border border-slate-300">
                              {editingId === paper.id ? (
                                <input 
                                  value={editingName} 
                                  onChange={e => setEditingName(e.target.value)} 
                                  onKeyDown={e => { if (e.key === 'Enter') handleRename(paper.id); else if (e.key === 'Escape') setEditingId(null); }}
                                  onBlur={() => handleRename(paper.id)}
                                  autoFocus
                                  className="w-full px-2 py-1.5 border border-indigo-500 rounded text-[13px] font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              ) : (
                                <div className="font-extrabold text-[13px] text-slate-800 flex items-center justify-between group/name">
                                  <span>{paper.examName}</span>
                                  <button onClick={() => { setEditingId(paper.id); setEditingName(paper.examName); }} className="opacity-0 group-hover/name:opacity-100 text-indigo-500 hover:bg-indigo-100 p-1.5 rounded-lg transition-all" title="Rename Paper">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3 border border-slate-300">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border shadow-sm`}>
                                {paper.examSubject || 'General'}
                              </span>
                            </td>
                            <td className="px-5 py-3 border border-slate-300 text-[13px] font-bold text-slate-600">
                              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {paper.examDate || '—'}</div>
                            </td>
                            <td className="px-5 py-3 border border-slate-300 text-center font-black text-slate-700 text-[13px]">
                              {paper.time || '100'}
                            </td>
                            <td className="px-5 py-3 border border-slate-300 text-[12px] font-bold text-slate-500 text-center">
                              {formatDate(paper.createdAt)}
                            </td>
                            <td className="px-5 py-3 border border-slate-300">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setPreviewPaper(paper)} className="p-2 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg shadow-sm border border-slate-200 transition-all bg-white flex items-center gap-1 text-[11px] font-bold" title="Preview"><Eye className="w-3.5 h-3.5" /> <span className="hidden xl:inline">View</span></button>
                                <button onClick={() => handlePrint(paper)} className="p-2 text-sky-600 hover:text-white hover:bg-sky-500 rounded-lg shadow-sm border border-sky-100 transition-all bg-sky-50 flex items-center gap-1 text-[11px] font-bold" title="Print"><Printer className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Print</span></button>
                                <button onClick={() => handleDownloadPDF(paper)} className="p-2 text-violet-600 hover:text-white hover:bg-violet-500 rounded-lg shadow-sm border border-violet-100 transition-all bg-violet-50 flex items-center gap-1 text-[11px] font-bold" title="Download"><Download className="w-3.5 h-3.5" /> <span className="hidden xl:inline">PDF</span></button>
                                <button onClick={() => navigate(`/question-bank/generator?id=${paper.id}`)} className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg shadow-sm border border-indigo-100 transition-all bg-indigo-50 flex items-center gap-1 text-[11px] font-bold" title="Edit Content"><Edit2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Edit</span></button>
                                <button onClick={() => setDeleteId(paper.id)} className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg shadow-sm border border-rose-100 transition-all bg-rose-50 flex items-center gap-1 text-[11px] font-bold" title="Delete"><Trash2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Delete</span></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Preview Modal */}
      {previewPaper && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${getSubjectColor(previewPaper.examSubject || 'Default').bg} ${getSubjectColor(previewPaper.examSubject || 'Default').text} ${getSubjectColor(previewPaper.examSubject || 'Default').border}`}>
                    {previewPaper.examSubject || 'General'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm"><Clock className="w-3.5 h-3.5 text-slate-400" /> {previewPaper.time} mins</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{previewPaper.examName}</h2>
              </div>
              <button onClick={() => setPreviewPaper(null)} className="p-2.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-2xl transition-colors border border-slate-200 shadow-sm group">
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <div 
                className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:font-medium prose-p:text-sm prose-a:text-indigo-600"
                dangerouslySetInnerHTML={{ __html: previewPaper.content }}
              />
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 backdrop-blur-md">
              <button onClick={() => handlePrint(previewPaper)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-transform">
                <Printer className="w-4 h-4" /> Print Paper
              </button>
              <button onClick={() => { setPreviewPaper(null); navigate(`/question-bank/generator?id=${previewPaper.id}`); }} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center gap-2 hover:-translate-y-0.5 transition-transform">
                <Edit2 className="w-4 h-4" /> Open in Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full animate-scale-in text-center border border-slate-100">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-8 border-white shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Paper?</h3>
            <p className="text-sm text-slate-500 font-medium px-4 mb-8">This action cannot be undone. Are you sure you want to permanently delete this AI generated paper?</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPapersPage;
