import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  Users,
  Send,
  BookMarked,
  Layers,
  Paperclip,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface AttachmentRow {
  title: string;
  url: string;
}

export const AssignHomeworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('REGULAR');
  const [status, setStatus] = useState('ACTIVE');
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [notifyParents, setNotifyParents] = useState(true);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedClassStudentsCount, setSelectedClassStudentsCount] = useState<number>(0);

  const TITLE_TEMPLATES = [
    'Chapter Exercise & Word Problems',
    'Practice Worksheet - Part 1',
    'Science Activity / Lab Record',
    'Math Problem Set (Questions 1 to 10)',
    'Reading Comprehension & Question Answers',
    'Project & Group Presentation Prep',
  ];

  const setQuickDueDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const setNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const unwrap = (res: any) => (res?.data?.data !== undefined ? res.data.data : res?.data);

  const fetchSubjects = async (cId: string) => {
    if (!cId) {
      setSubjects([]);
      setSubjectId('');
      setSelectedClassStudentsCount(0);
      return;
    }
    try {
      const [subRes, stRes]: any = await Promise.all([
        api.get('/api/subjects', { params: { classId: cId } }),
        api.get(`/api/classes/${cId}/students`).catch(() => ({ data: [] })),
      ]);
      const subList = unwrap(subRes) || [];
      setSubjects(Array.isArray(subList) ? subList : []);
      if (Array.isArray(subList) && subList.length > 0 && !editId) {
        setSubjectId(subList[0].id);
      }
      const stList = unwrap(stRes) || [];
      setSelectedClassStudentsCount(Array.isArray(stList) ? stList.length : 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/api/classes');
        const list = unwrap(res) || [];
        setClasses(Array.isArray(list) ? list : []);

        if (editId) {
          const hwRes: any = await api.get(`/api/homework/${editId}`);
          const hw = unwrap(hwRes);
          if (hw) {
            setTitle(hw.title || '');
            setDescription(hw.description || '');
            setDueDate(hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '');
            setClassId(hw.class?.id || hw.classId || '');
            setStatus(hw.status || 'ACTIVE');

            if (Array.isArray(hw.attachmentList)) {
              setAttachments(hw.attachmentList);
            } else if (typeof hw.attachments === 'string') {
              try {
                const parsed = JSON.parse(hw.attachments);
                if (Array.isArray(parsed)) setAttachments(parsed);
              } catch {}
            }

            if (hw.class?.id || hw.classId) {
              const cId = hw.class?.id || hw.classId;
              const subRes: any = await api.get('/api/subjects', { params: { classId: cId } });
              setSubjects(unwrap(subRes) || []);
              setSubjectId(hw.subject?.id || hw.subjectId || '');
              const stRes: any = await api.get(`/api/classes/${cId}/students`).catch(() => ({ data: [] }));
              const stList = unwrap(stRes) || [];
              setSelectedClassStudentsCount(Array.isArray(stList) ? stList.length : 0);
            }
          }
        } else {
          setQuickDueDate(1);
          if (Array.isArray(list) && list.length > 0) {
            const firstClass = list[0];
            setClassId(firstClass.id);
            fetchSubjects(firstClass.id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
        setError('Failed to load form options');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [editId]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value;
    setClassId(newClassId);
    fetchSubjects(newClassId);
  };

  const addAttachmentRow = () => {
    setAttachments(prev => [...prev, { title: '', url: '' }]);
  };

  const updateAttachmentRow = (idx: number, field: keyof AttachmentRow, value: string) => {
    setAttachments(prev => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const removeAttachmentRow = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an assignment title');
      toast.error('Assignment title is required');
      return;
    }
    if (!classId || !subjectId || !dueDate) {
      setError('Class, Subject and Due Date are required');
      toast.error('Please select Class, Subject, and Due Date');
      return;
    }

    setSubmitting(true);
    setError('');

    const cleanAttachments = attachments
      .filter(a => a.url.trim().length > 0)
      .map(a => ({ title: a.title.trim() || 'Worksheet / Video Link', url: a.url.trim() }));

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        classId,
        subjectId,
        status,
        priority,
        notifyStudents,
        notifyParents,
        attachments: cleanAttachments,
      };

      if (editId) {
        await api.put(`/api/homework/${editId}`, payload);
        toast.success('Homework updated successfully!');
      } else {
        await api.post('/api/homework', payload);
        toast.success('Homework assigned and published to students!');
      }
      navigate('/homework');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save homework';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#F4F7FC] min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold text-slate-500 mt-4">Loading homework form...</p>
      </div>
    );
  }

  const selectedClass = classes.find(c => c.id === classId);
  const selectedSubject = subjects.find(s => s.id === subjectId);

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-16">
      <PageHeader
        title={editId ? 'Edit Homework Assignment' : 'Assign New Homework'}
        icon={<BookMarked className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Homework</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : editId ? 'Update Assignment' : 'Publish Homework'}</span>
            </button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Class & Subject */}
            <div className="bg-white border border-indigo-100 rounded-[24px] p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Target Class &amp; Subject
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Class &amp; Section *
                  </label>
                  <select
                    value={classId}
                    onChange={handleClassChange}
                    className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="">Select Target Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- Section ${c.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Curricular Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    disabled={!classId || subjects.length === 0}
                    className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-40"
                  >
                    <option value="">{classId ? 'Select Subject' : 'Select Class First'}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Title, Instructions & Attachments */}
            <div className="bg-white border border-indigo-100 rounded-[24px] p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Assignment Content &amp; Attachments
                </h2>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Homework Title / Topic *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Fractions and Decimals - Exercise 4.2"
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Title Templates:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {TITLE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(tmpl)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-bold text-slate-600 hover:text-indigo-700 transition-all cursor-pointer"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Instructions &amp; Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide step-by-step instructions, textbook page numbers, and submission guidelines..."
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl p-4 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
                />
              </div>

              {/* Resource / Worksheet / Video Attachments */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                    <span>Reference Links, PDFs &amp; YouTube Videos</span>
                  </label>
                  <button
                    type="button"
                    onClick={addAttachmentRow}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link / Worksheet</span>
                  </button>
                </div>

                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">
                    No resource links added yet (optional — add Google Drive PDFs, YouTube explanation videos, or practice links).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((row, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-[#F8FAFF] p-2.5 rounded-xl border border-indigo-100">
                        <input
                          type="text"
                          value={row.title}
                          onChange={e => updateAttachmentRow(idx, 'title', e.target.value)}
                          placeholder="Label (e.g. Chapter 4 Worksheet)"
                          className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                        />
                        <input
                          type="url"
                          value={row.url}
                          onChange={e => updateAttachmentRow(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachmentRow(idx)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="bg-white border border-indigo-100 rounded-[24px] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Submission Deadline
                </h2>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickDueDate(1)}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(2)}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold cursor-pointer"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(3)}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold cursor-pointer"
                >
                  This Weekend
                </button>
                <button
                  type="button"
                  onClick={setNextMonday}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold cursor-pointer"
                >
                  Next Monday
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Assignment Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="REGULAR">Normal Daily Practice</option>
                  <option value="IMPORTANT">High Priority (Scored Task)</option>
                  <option value="PROJECT">Project / Practical Assignment</option>
                  <option value="REVISION">Exam Preparation / Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Publishing Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="ACTIVE">Active (Live to Students)</option>
                  <option value="CLOSED">Closed / Completed</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-indigo-100 rounded-[24px] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Users className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Target Audience
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100 flex justify-between">
                  <span className="text-slate-500 font-bold">Class:</span>
                  <strong className="text-slate-900 font-black">
                    {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'None'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100 flex justify-between">
                  <span className="text-slate-500 font-bold">Subject:</span>
                  <strong className="text-emerald-700 font-black">
                    {selectedSubject ? selectedSubject.name : 'None'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex justify-between">
                  <span className="text-indigo-700 font-bold">Enrolled Students:</span>
                  <strong className="text-indigo-900 font-black">{selectedClassStudentsCount} Students</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={e => setNotifyStudents(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Send push notification to students</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={notifyParents}
                    onChange={e => setNotifyParents(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Notify Parent Portal</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white font-black uppercase text-xs tracking-wider shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editId ? 'Update Assignment' : 'Publish & Assign'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignHomeworkPage;
