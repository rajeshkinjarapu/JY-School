import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Key, Printer, Save, FileText, ChevronDown, Check, X, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const AnswerKeyPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Dropdown options
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selection states
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Active question papers filtered by selection
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Key editing states (indexed by paper ID)
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editAnswerKeyText, setEditAnswerKeyText] = useState('');
  const [editAnswerKeyUrl, setEditAnswerKeyUrl] = useState('');

  useEffect(() => {
    // Initial fetch of exams
    api.get('/api/exams?limit=500')
      .then((res: any) => {
        setExams(res.data || []);
      })
      .catch(() => {
        toast.error('Failed to load examinations');
      });
  }, []);

  // Filter classes dynamically based on selected exam
  useEffect(() => {
    if (selectedExamId) {
      const activeExam = exams.find(e => e.id === selectedExamId);
      const examClasses = activeExam?.classes || [];
      setClasses(examClasses);
      setSelectedClassId('');
      setPapers([]);
    } else {
      setClasses([]);
      setSelectedClassId('');
      setPapers([]);
    }
  }, [selectedExamId, exams]);

  // Load question papers when exam + class selected
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchPapersForSelection();
    } else {
      setPapers([]);
    }
  }, [selectedExamId, selectedClassId]);

  const fetchPapersForSelection = async () => {
    setLoading(true);
    try {
      // Fetch all question papers, then filter locally
      const res: any = await api.get('/api/question-papers');
      const allPapers = Array.isArray(res) ? res : (res?.data || []);
      
      const filtered = allPapers.filter((p: any) => 
        p.examId === selectedExamId && p.classId === selectedClassId
      );
      setPapers(filtered);
    } catch {
      toast.error('Failed to load question papers');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (paper: any) => {
    setEditingKeyId(paper.id);
    setEditAnswerKeyText(paper.answerKey || '');
    setEditAnswerKeyUrl(paper.answerKeyUrl || '');
  };

  const handleSaveKey = async (paperId: string) => {
    const loadingToast = toast.loading('Saving answer key...');
    try {
      await api.put(`/api/question-papers/${paperId}/answer-key`, {
        answerKey: editAnswerKeyText,
        answerKeyUrl: editAnswerKeyUrl
      });
      toast.dismiss(loadingToast);
      toast.success('Answer key updated successfully');
      setEditingKeyId(null);
      fetchPapersForSelection();
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to save answer key');
    }
  };

  // Upload Answer Key PDF
  const handleUploadKeyFile = async (e: React.ChangeEvent<HTMLInputElement>, paperId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const loadingToast = toast.loading('Uploading answer key file...');

    try {
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss(loadingToast);
      const urlVal = res.data?.url || res.url || res.data?.data?.url;
      if (urlVal) {
        setEditAnswerKeyUrl(urlVal);
        toast.success('File uploaded successfully');
      } else {
        toast.error('Upload failed: Invalid response');
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Error uploading file');
    }
  };

  // Print all answer keys of this exam + class
  const handlePrintKeys = () => {
    if (papers.length === 0) {
      toast.error('No answer keys to print');
      return;
    }
    const examName = exams.find(e => e.id === selectedExamId)?.name || 'Exam';
    const className = classes.find(c => c.id === selectedClassId);
    const classNameStr = className ? `${className.name}-${className.section}` : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const paperRows = papers.map(p => `
      <div class="paper-block">
        <div class="paper-header">
          <span>SUBJECT: ${p.subject?.name || 'All Subjects'}</span>
          <span>${p.title}</span>
        </div>
        <div class="paper-content">
          ${p.answerKey ? `<pre>${p.answerKey}</pre>` : '<p class="no-key">No typed answer key entries.</p>'}
          ${p.answerKeyUrl ? `<p class="key-link"><b>PDF Attachment Link:</b> ${p.answerKeyUrl}</p>` : ''}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Answer Keys - ${examName} - ${classNameStr}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
            .school-logo { font-size: 24px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 1px; }
            .doc-title { font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; }
            .meta-info { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 15px; background: #f8fafc; padding: 10px 15px; border-radius: 12px; }
            .paper-block { margin-top: 30px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
            .paper-header { background: #f1f5f9; padding: 12px 20px; font-size: 13px; font-weight: 800; color: #1e293b; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
            .paper-content { padding: 20px; }
            pre { background: #fafafa; padding: 15px; border-radius: 12px; font-size: 13px; font-family: monospace; white-space: pre-wrap; margin: 0; line-height: 1.6; }
            .key-link { font-size: 11px; color: #4f46e5; word-break: break-all; margin-top: 10px; font-weight: bold; }
            .no-key { color: #94a3b8; font-style: italic; }
            @media print {
              body { padding: 0; }
              .paper-block { border-color: #cbd5e1; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-logo">JY Global School</div>
            <div class="doc-title">Official Answer Key Booklet</div>
            <div class="meta-info">
              <span><b>EXAMINATION:</b> ${examName}</span>
              <span><b>CLASS & SECTION:</b> ${classNameStr}</span>
              <span><b>DATE:</b> ${new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
          ${paperRows}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Answer Keys Master Entry" icon={<Key className="w-5 h-5 text-indigo-600" />} />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Step 1: Selection Dropdowns */}
        <div className="bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
          <div>
            <label className="text-xs font-black uppercase text-indigo-600 tracking-wider mb-2 block">Select Exam Batch</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="">-- Select Examination --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-indigo-600 tracking-wider mb-2 block">Select Class & Section</label>
            <select
              value={selectedClassId}
              disabled={!selectedExamId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Print & Actions Bar */}
        {selectedExamId && selectedClassId && papers.length > 0 && (
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-5 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm animate-fade-in">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Subject-wise Answer Keys</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage keys for {papers.length} subject papers</p>
            </div>
            {isSuperAdmin && (
              <button 
                onClick={handlePrintKeys}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Key Booklet
              </button>
            )}
          </div>
        )}

        {/* Step 3: Papers & Answer Key Entry */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedExamId && selectedClassId ? (
          <div className="space-y-6">
            {papers.map(p => {
              const isEditing = editingKeyId === p.id;
              return (
                <div key={p.id} className="relative overflow-hidden bg-white dark:bg-gray-900 p-6 rounded-3xl border border-slate-150 dark:border-gray-800 shadow-sm space-y-5 transition-all duration-300">
                  {/* Left Accent Bar */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                        {p.subject?.name || 'All Subjects'}
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-3 leading-snug">{p.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Uploaded by: <strong className="text-slate-600 dark:text-slate-300">{p.uploadedBy}</strong></p>
                    </div>

                    {!isEditing && (
                      <button 
                        onClick={() => handleStartEdit(p)}
                        className="bg-slate-50 hover:bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-500/10 dark:text-indigo-400 border border-slate-200 dark:border-gray-700 font-extrabold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Answer Key
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 border-t border-slate-50 dark:border-gray-800/80 pt-5 pl-2 animate-fade-in">
                      {/* PDF Upload inside Key Edit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Typed Key Entries</label>
                          <textarea
                            rows={6}
                            placeholder="1. A&#10;2. B&#10;3. C&#10;..."
                            value={editAnswerKeyText}
                            onChange={e => setEditAnswerKeyText(e.target.value)}
                            className="w-full bg-slate-50/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-2xl p-3.5 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Answer Key PDF URL (Optional)</label>
                            <input 
                              type="text"
                              placeholder="https://link-to-key.pdf"
                              value={editAnswerKeyUrl}
                              onChange={e => setEditAnswerKeyUrl(e.target.value)}
                              className="w-full bg-slate-50/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200"
                            />
                          </div>

                          <div className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-gray-800/20">
                            <FileText className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-2">Upload Answer Key File</span>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleUploadKeyFile(e, p.id)} 
                              className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-slate-50 dark:border-gray-800/80 pt-4">
                        <button 
                          onClick={() => setEditingKeyId(null)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveKey(p.id)}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-gray-800/20 p-5 rounded-2xl border border-slate-100 dark:border-gray-800/40 text-xs pl-8 relative">
                      <div>
                        <span className="font-black text-slate-400 uppercase tracking-wider block mb-2">Typed Answers</span>
                        {p.answerKey ? (
                          <pre className="whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-850 p-3 rounded-xl">{p.answerKey}</pre>
                        ) : (
                          <span className="text-slate-400 italic font-semibold">No answers entered yet.</span>
                        )}
                      </div>
                      <div>
                        <span className="font-black text-slate-400 uppercase tracking-wider block mb-2">PDF File Link</span>
                        {p.answerKeyUrl ? (
                          <a 
                            href={p.answerKeyUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-extrabold text-indigo-600 hover:underline mt-1 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-850 px-3 py-2 rounded-xl"
                          >
                            <FileText className="w-4 h-4 text-emerald-500" /> View PDF Answer Key
                          </a>
                        ) : (
                          <span className="text-slate-400 italic font-semibold">No PDF key uploaded yet.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {papers.length === 0 && (
              <div className="bg-white/50 border-2 border-dashed border-slate-200 p-12 text-center rounded-3xl">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-extrabold text-slate-700">No Question Papers Found</h4>
                <p className="text-xs text-slate-400 mt-1">Please upload question papers for this exam & class first.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/40 border border-slate-200 p-12 text-center rounded-3xl">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-700">Select Exam and Class</h4>
            <p className="text-xs text-slate-400 mt-1">Please choose options above to load and enter answer keys.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerKeyPage;
