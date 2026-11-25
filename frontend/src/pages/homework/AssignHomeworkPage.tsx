import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, 
  Sparkles, AlertCircle, FileText, Users, Send, 
  HelpCircle, BookMarked, Layers, Tag, Bookmark
} from 'lucide-react';
import { api } from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface ClassOption {
  id: string;
  name: string;
  section: string;
  _count?: { students?: number };
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export const AssignHomeworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('REGULAR');
  const [status, setStatus] = useState('ACTIVE');
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [notifyParents, setNotifyParents] = useState(true);

  // Dropdown Lists
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedClassStudentsCount, setSelectedClassStudentsCount] = useState<number>(0);

  // Quick Title Suggestions
  const TITLE_TEMPLATES = [
    '📖 Chapter Exercise & Word Problems',
    '📝 Practice Worksheet - Part 1',
    '🔬 Science Activity / Lab Record',
    '📐 Math Problem Set (Questions 1 to 10)',
    '✍️ Reading Comprehension & Question Answers',
    '🧠 Project & Group Presentation Prep',
  ];

  // Quick Due Date Helpers
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

  // 1. Load Classes & Initial Defaults
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/api/classes');
        const list = res.data?.data || res.data || [];
        setClasses(list);

        // If editing existing homework, fetch details
        if (editId) {
          const hwRes: any = await api.get(`/api/homework/${editId}`);
          const hw = hwRes.data?.data || hwRes.data;
          if (hw) {
            setTitle(hw.title || '');
            setDescription(hw.description || '');
            setDueDate(hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '');
            setClassId(hw.class?.id || hw.classId || '');
            setStatus(hw.status || 'ACTIVE');

            // Load subjects for this class
            if (hw.class?.id || hw.classId) {
              const subRes: any = await api.get('/api/subjects', { params: { classId: hw.class?.id || hw.classId } });
              setSubjects(subRes.data?.data || subRes.data || []);
              setSubjectId(hw.subject?.id || hw.subjectId || '');
            }
          }
        } else {
          // Default due date: Tomorrow
          setQuickDueDate(1);
          if (list.length > 0) {
            const firstClass = list[0];
            setClassId(firstClass.id);
            fetchSubjects(firstClass.id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial data', err);
        setError('Failed to load form options');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [editId]);

  // 2. Fetch subjects and student count when classId changes
  const fetchSubjects = async (cId: string) => {
    if (!cId) {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    try {
      const [subRes, stRes]: any = await Promise.all([
        api.get('/api/subjects', { params: { classId: cId } }),
        api.get(`/api/classes/${cId}/students`).catch(() => ({ data: [] }))
      ]);
      const subList = subRes.data?.data || subRes.data || [];
      setSubjects(subList);
      if (subList.length > 0 && !editId) {
        setSubjectId(subList[0].id);
      }

      const stList = stRes.data?.data || stRes.data || [];
      setSelectedClassStudentsCount(Array.isArray(stList) ? stList.length : 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value;
    setClassId(newClassId);
    fetchSubjects(newClassId);
  };

  // 3. Save / Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an assignment title');
      toast.error('Assignment title is required');
      return;
    }
    if (!classId) {
      setError('Please select a target class');
      toast.error('Class selection is required');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject');
      toast.error('Subject selection is required');
      return;
    }
    if (!dueDate) {
      setError('Please choose a due date');
      toast.error('Due date is required');
      return;
    }

    setSubmitting(true);
    setError('');

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
        notifyParents
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
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to save homework';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold text-slate-500 mt-4">Loading homework form...</p>
      </div>
    );
  }

  const selectedClass = classes.find(c => c.id === classId);
  const selectedSubject = subjects.find(s => s.id === subjectId);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 text-slate-800 min-h-screen pb-16">
      
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Return to Homework List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-black text-slate-900 tracking-wide">
                  {editId ? 'Edit Homework Assignment' : 'Assign New Homework'}
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {editId ? 'UPDATE MODE' : 'CREATE MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Publish school assignments, home tasks, and project work directly to student portals &amp; parent app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{editId ? 'Update Assignment' : 'Publish Homework'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── LEFT 2 COLUMNS: Assignment Details ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Target Class & Subject */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Target Class &amp; Subject
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Class &amp; Section *
                  </label>
                  <select
                    value={classId}
                    onChange={handleClassChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors cursor-pointer"
                  >
                    <option value="">Select Target Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- Section ${c.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Curricular Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    disabled={!classId || subjects.length === 0}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <option value="">{classId ? 'Select Subject' : 'Select Class First'}</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Assignment Content & Quick Templates */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Assignment Title &amp; Details
                </h2>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Homework Title / Topic *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Fractions and Decimals - Exercise 4.2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Title Suggestions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {TITLE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(tmpl)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-medium text-slate-600 hover:text-indigo-700 transition-all text-left"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Instructions &amp; Description
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={"Provide clear instructions for students:\n1. Complete questions 1 to 8 on page 45.\n2. Show step-by-step working in homework notebook.\n3. Bring completed work tomorrow for teacher review."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

          </div>

          {/* ── RIGHT 1 COLUMN: Schedule, Due Date & Audience ───────────────── */}
          <div className="space-y-6">
            
            {/* Card 3: Due Date & Schedule */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Submission Deadline
                </h2>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-colors cursor-pointer"
                />
              </div>

              {/* Quick Due Date Presets */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-2">Quick Date Presets:</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(1)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-700 font-bold transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(2)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-700 font-bold transition-colors"
                  >
                    In 2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(3)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-700 font-bold transition-colors"
                  >
                    This Weekend
                  </button>
                  <button
                    type="button"
                    onClick={setNextMonday}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-700 font-bold transition-colors"
                  >
                    Next Monday
                  </button>
                </div>
              </div>

              {/* Priority Tag */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Assignment Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="REGULAR">Normal Daily Practice</option>
                  <option value="IMPORTANT">High Priority (Scored Task)</option>
                  <option value="PROJECT">Project / Practical Assignment</option>
                  <option value="REVISION">Exam Preparation / Revision</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Publishing Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="ACTIVE">Active (Live to Students)</option>
                  <option value="CLOSED">Closed / Completed</option>
                </select>
              </div>
            </div>

            {/* Card 4: Target Audience & Live Preview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Users className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Target Audience
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Selected Class:</span>
                  <strong className="text-slate-800 font-bold">{selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'None'}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <strong className="text-emerald-600 font-bold">{selectedSubject ? selectedSubject.name : 'None'}</strong>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex justify-between items-center">
                  <span className="text-indigo-600 font-medium">Enrolled Students:</span>
                  <strong className="text-indigo-700 font-black text-sm">{selectedClassStudentsCount} Students</strong>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={(e) => setNotifyStudents(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-50 border-slate-300"
                  />
                  <span>Send instant app push notification to students</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={notifyParents}
                    onChange={(e) => setNotifyParents(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-50 border-slate-300"
                  />
                  <span>Send notification to Parent Portal</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editId ? 'Update Assignment' : 'Publish & Assign'}
                </button>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AssignHomeworkPage;
