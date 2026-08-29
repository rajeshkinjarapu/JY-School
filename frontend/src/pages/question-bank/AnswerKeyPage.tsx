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
        <h3>Subject: ${p.subject?.name || 'All Subjects'} - ${p.title}</h3>
        ${p.answerKey ? `<pre>${p.answerKey}</pre>` : '<p class="no-key">No typed answer key entries.</p>'}
        ${p.answerKeyUrl ? `<p class="key-link"><b>PDF Link:</b> ${p.answerKeyUrl}</p>` : ''}
      </div>
      <hr />
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Answer Keys - ${examName} - ${classNameStr}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #1e293b; }
            h1 { text-align: center; margin-bottom: 5px; font-family: sans-serif; font-size: 24px; text-transform: uppercase; }
            h2 { text-align: center; font-family: sans-serif; font-size: 16px; color: #64748b; margin-top: 0; margin-bottom: 30px; }
            .paper-block { margin-bottom: 20px; page-break-inside: avoid; }
            h3 { font-family: sans-serif; color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; font-size: 16px; }
            pre { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; white-space: pre-wrap; font-family: monospace; }
            .key-link { font-size: 11px; color: #64748b; word-break: break-all; }
            .no-key { color: #94a3b8; font-style: italic; }
            hr { border: 0; border-top: 1px dashed #cbd5e1; margin: 30px 0; }
            @media print {
              body { padding: 0; }
              hr { margin: 20px 0; }
            }
          </style>
        </head>
        <body>
          <h1>Answer Key Booklet</h1>
          <h2>Exam: ${examName} | Class: ${classNameStr}</h2>
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
      <PageHeader title="Answer Keys Entry" icon={<Key className="w-5 h-5" />} />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Step 1: Selection Dropdowns */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-150 shadow-[0_8px_30px_rgb(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase text-indigo-500 tracking-wider mb-2 block">Select Exam Batch</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Select Examination --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-indigo-500 tracking-wider mb-2 block">Select Class & Section</label>
            <select
              value={selectedClassId}
              disabled={!selectedExamId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
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
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-150 shadow-sm animate-fade-in">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Subject-wise Papers</h3>
              <p className="text-xs text-gray-400">Total uploaded papers: {papers.length}</p>
            </div>
            {isSuperAdmin && (
              <button 
                onClick={handlePrintKeys}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-xs shadow-md transition-all"
              >
                <Printer className="w-4 h-4" /> Print All Keys
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
          <div className="space-y-4">
            {papers.map(p => {
              const isEditing = editingKeyId === p.id;
              return (
                <div key={p.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-indigo-100">
                        {p.subject?.name || 'All Subjects'}
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-2">{p.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">Uploaded by: {p.uploadedBy}</p>
                    </div>

                    {!isEditing && (
                      <button 
                        onClick={() => handleStartEdit(p)}
                        className="bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-100 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Edit Answer Key
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 border-t pt-4">
                      {/* PDF Upload inside Key Edit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1.5 block">Typed Key Entries</label>
                          <textarea
                            rows={6}
                            placeholder="1. A&#10;2. B&#10;3. C&#10;..."
                            value={editAnswerKeyText}
                            onChange={e => setEditAnswerKeyText(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Answer Key PDF URL (Optional)</label>
                            <input 
                              type="text"
                              placeholder="https://link-to-key.pdf"
                              value={editAnswerKeyUrl}
                              onChange={e => setEditAnswerKeyUrl(e.target.value)}
                              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50">
                            <FileText className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-bold mb-2">Upload PDF File instead</span>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleUploadKeyFile(e, p.id)} 
                              className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t pt-4">
                        <button 
                          onClick={() => setEditingKeyId(null)}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveKey(p.id)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-100 text-xs">
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Typed Answers</span>
                        {p.answerKey ? (
                          <pre className="whitespace-pre-wrap font-mono text-gray-700 leading-relaxed max-h-36 overflow-y-auto">{p.answerKey}</pre>
                        ) : (
                          <span className="text-gray-400 italic">No answers entered yet.</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">PDF File Link</span>
                        {p.answerKeyUrl ? (
                          <a 
                            href={p.answerKeyUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:underline mt-1"
                          >
                            <FileText className="w-4 h-4" /> View PDF Answer Key
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">No PDF key uploaded yet.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {papers.length === 0 && (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 p-12 text-center rounded-3xl">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No Question Papers Found</h4>
                <p className="text-xs text-gray-400 mt-1">Please upload question papers for this exam & class first.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/40 border border-gray-200 p-12 text-center rounded-3xl">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Select Exam and Class</h4>
            <p className="text-xs text-gray-400 mt-1">Please choose options above to load and enter answer keys.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerKeyPage;
