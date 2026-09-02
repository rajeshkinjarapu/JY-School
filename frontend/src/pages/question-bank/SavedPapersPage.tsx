import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Edit2, Trash2, Plus, Search, Calendar, 
  BookOpen, Clock, ChevronLeft, AlertTriangle, 
  Eye, Printer, Download, Copy, Grid, List, X, MoreVertical 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/axios';
import { jsPDF } from 'jspdf';

interface GeneratedPaper {
  id: string;
  examName: string;
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

const SavedPapersPage = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New States for Redesign
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');
  
  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<GeneratedPaper | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

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

  const getGeneratorPath = (paper: any) => {
    if (paper?.content?.startsWith('<!--MCQ_DATA_V2-->')) {
      return `/question-bank/mcq-generator?id=${paper.id}`;
    }
    return `/question-bank/generator?id=${paper.id}`;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/generated-papers/${deleteId}`);
      toast.success('Paper deleted successfully!');
      setPapers(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete paper.');
    } finally {
      setDeleting(false);
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
            @page { margin: 12.7mm; size: A4; }
            html, body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; margin: 0; background-color: #ffffff !important; background: #ffffff !important; color: #000000 !important; }
            @media print {
              html, body { background-color: #ffffff !important; background: #ffffff !important; }
            }
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
  const uniqueClasses = ['All', ...Array.from(new Set(papers.map(p => p.examClass).filter(Boolean)))].sort();

  let filtered = papers.filter(p => {
    const matchesSearch = p.examName.toLowerCase().includes(search.toLowerCase()) || p.examSubject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || p.examSubject === selectedSubject;
    const matchesClass = selectedClass === 'All' || p.examClass === selectedClass;
    return matchesSearch && matchesSubject && matchesClass;
  });

  filtered = filtered.sort((a, b) => {
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
    <div className="flex flex-col h-full bg-slate-100" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Saved AI Papers" 
        icon={<BookOpen className="w-5 h-5" />} 
        action={
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg text-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Paper
            </button>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate('/question-bank/generator'); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col transition-all"
                  >
                    <span className="font-black text-sm text-slate-800">AI Paper Generator</span>
                    <span className="text-[11px] text-slate-400 font-bold mt-0.5">Dual-layout paper creator</span>
                  </button>
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate('/question-bank/mcq-generator'); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-t border-slate-100 transition-all"
                  >
                    <span className="font-black text-sm text-slate-800">MCQ Paper Generator</span>
                    <span className="text-[11px] text-slate-400 font-bold mt-0.5">Custom MCQ papers creator</span>
                  </button>
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate('/question-bank/navodaya-generator'); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-t border-slate-100 transition-all"
                  >
                    <span className="font-black text-sm text-slate-800">Navodaya Paper Generator</span>
                    <span className="text-[11px] text-slate-400 font-bold mt-0.5">Navodaya Mathematics creator</span>
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 animate-fade-in pb-24 lg:pb-6">

      <div className="max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved papers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[120px] truncate"
              >
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option>
                ))}
              </select>

              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[120px] truncate"
              >
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
                ))}
              </select>

              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A-Z Name</option>
              </select>
              
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-sm font-black text-slate-500">
              Saved Papers · {papers.length}
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
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl text-center px-4">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-lg font-black text-slate-800 mb-2">No Saved Papers</p>
            <p className="text-sm text-slate-500 font-medium mb-6 max-w-[250px]">Create your first question paper using AI or the paper generator.</p>
            <button
              onClick={() => setIsDropdownOpen(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              + Create New Paper
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Sleek White Card Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(paper => {
                  const colors = getSubjectColor(paper.examSubject || 'Default');
                  return (
                    <div
                      key={paper.id}
                      className="group bg-white rounded-2xl shadow-sm overflow-visible flex flex-col border border-slate-200 relative"
                    >
                      {/* Color Strip (Left Border) */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b ${colors.gradient}`}></div>
                      
                      <div className="p-4 pl-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2 relative">
                          <div className="flex gap-1.5 items-center">
                            {paper.examClass && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                {paper.examClass}
                              </span>
                            )}
                            {paper.examClass && <span className="text-slate-300 text-[10px] hidden md:inline">•</span>}
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 hidden md:inline truncate max-w-[150px]">
                               {paper.examSubject || 'General'}
                            </span>
                          </div>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setActiveDropdown(activeDropdown === paper.id ? null : paper.id)}
                              className="p-1 -mr-2 -mt-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {activeDropdown === paper.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 animate-in fade-in zoom-in-95">
                                  <button onClick={() => { setActiveDropdown(null); navigate(getGeneratorPath(paper)); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Edit2 className="w-4 h-4 text-slate-400" /> Edit
                                  </button>
                                  <button onClick={() => { setActiveDropdown(null); handleDuplicate(paper); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Copy className="w-4 h-4 text-slate-400" /> Duplicate
                                  </button>
                                  <button onClick={() => { setActiveDropdown(null); handleDownloadPDF(paper); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Download className="w-4 h-4 text-slate-400" /> Download PDF
                                  </button>
                                  <button onClick={() => { setActiveDropdown(null); handlePrint(paper); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Printer className="w-4 h-4 text-slate-400" /> Print
                                  </button>
                                  <div className="h-px w-full bg-slate-100 my-1"></div>
                                  <button onClick={() => { setActiveDropdown(null); setDeleteId(paper.id); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <h3 className="text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 mb-3">
                          {paper.examName}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] font-semibold text-slate-500 mt-auto pt-2">
                          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {paper.examDate || '—'}</div>
                          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {paper.time || '—'} mins</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto border-t border-slate-100 p-3 pl-4 bg-slate-50/30 rounded-b-2xl">
                        <button 
                          onClick={() => setPreviewPaper(paper)} 
                          className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all flex justify-center items-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> View Paper
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Sleek List View */
              <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4 rounded-tl-[2rem]">Paper Name</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Created On</th>
                        <th className="px-6 py-4 text-right rounded-tr-[2rem]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(paper => {
                        const colors = getSubjectColor(paper.examSubject || 'Default');
                        return (
                          <tr key={paper.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-[14px] text-slate-800 capitalize lowercase">{paper.examName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {paper.examClass && (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200 border shadow-sm">
                                    {paper.examClass}
                                  </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border shadow-sm`}>
                                  {paper.examSubject || 'General'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[13px] font-bold text-slate-600">
                              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {paper.examDate || '—'}</div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1"><Clock className="w-3 h-3 text-slate-400" /> {paper.time || '—'}</div>
                            </td>
                            <td className="px-6 py-4 text-[12px] font-bold text-slate-400">
                              {formatDate(paper.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                <button onClick={() => setPreviewPaper(paper)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" title="Preview"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => handlePrint(paper)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" title="Print"><Printer className="w-4 h-4" /></button>
                                <button onClick={() => handleDownloadPDF(paper)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" title="Download"><Download className="w-4 h-4" /></button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => navigate(getGeneratorPath(paper))} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDuplicate(paper)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteId(paper.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
              <button onClick={() => { setPreviewPaper(null); navigate(getGeneratorPath(previewPaper)); }} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center gap-2 hover:-translate-y-0.5 transition-transform">
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
    </div>
  );
};

export default SavedPapersPage;
