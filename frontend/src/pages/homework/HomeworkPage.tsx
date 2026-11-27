import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  AlertCircle,
  BookMarked,
  Eye,
  Search,
  RefreshCw,
  Users,
  Paperclip,
  ExternalLink,
  Copy,
  LayoutGrid,
  ListChecks,
  Check,
  Send,
  Lock,
  Unlock,
} from 'lucide-react';

interface AttachmentItem {
  title: string;
  url: string;
}

interface SubmissionStats {
  totalStudents: number;
  completedCount: number;
  submittedCount: number;
  reworkCount: number;
  doneCount: number;
  pendingCount: number;
  completionPct: number;
}

interface Homework {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  attachments?: string | null;
  attachmentList?: AttachmentItem[];
  submissionStats?: SubmissionStats;
  mySubmission?: {
    status: string;
    studentNote?: string | null;
    attachmentUrl?: string | null;
    teacherRemark?: string | null;
  } | null;
  class: { id: string; name: string; section: string };
  subject: { id: string; name: string; code: string };
  teacher: { user: { name: string; photoUrl?: string } };
  createdAt: string;
}

interface RosterStudent {
  studentId: string;
  rollNo: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'REWORK';
  studentNote?: string;
  attachmentUrl?: string;
  teacherRemark?: string;
}

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const HomeworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'diary'>('grid');

  const [previewHw, setPreviewHw] = useState<Homework | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null);

  // Teacher/Admin Submission Drawer Modal
  const [subHw, setSubHw] = useState<Homework | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);

  // Student Submission Modal
  const [studentSubmitHw, setStudentSubmitHw] = useState<Homework | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [studentLink, setStudentLink] = useState('');
  const [submittingStudent, setSubmittingStudent] = useState(false);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const canEdit = isTeacher || isAdmin;

  const unwrap = (res: any) => (res?.data?.data !== undefined ? res.data.data : res?.data);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterClass) params.classId = filterClass;
      if (filterSubject) params.subjectId = filterSubject;
      const res: any = await api.get('/api/homework', { params });
      const list = unwrap(res);
      setHomeworks(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load homework assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      const list = unwrap(res);
      setClasses(Array.isArray(list) ? list : []);
    } catch {}
  };

  const fetchSubjects = async (classId?: string) => {
    if (!classId) {
      setSubjects([]);
      return;
    }
    try {
      const res: any = await api.get('/api/subjects', { params: { classId } });
      const list = unwrap(res);
      setSubjects(Array.isArray(list) ? list : []);
    } catch {}
  };

  useEffect(() => {
    fetchAll();
  }, [filterClass, filterSubject]);

  useEffect(() => {
    if (canEdit) fetchClasses();
  }, [canEdit]);

  const getDueDays = (dueDate: string) =>
    Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);

  const getStatusInfo = (due: string, status: string) => {
    if (status === 'CLOSED') return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', label: 'Closed' };
    const days = getDueDays(due);
    if (days < 0) return { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', label: 'Overdue' };
    if (days === 0) return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'Due Today' };
    if (days === 1) return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', label: 'Due Tomorrow' };
    return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: `${days} Days Left` };
  };

  // KPI Metrics
  const kpis = useMemo(() => {
    const total = homeworks.length;
    const active = homeworks.filter(h => h.status === 'ACTIVE').length;
    const dueSoon = homeworks.filter(h => {
      const d = getDueDays(h.dueDate);
      return h.status === 'ACTIVE' && d >= 0 && d <= 2;
    }).length;
    const overdue = homeworks.filter(h => {
      const d = getDueDays(h.dueDate);
      return h.status === 'ACTIVE' && d < 0;
    }).length;
    const withStudents = homeworks.filter(h => (h.submissionStats?.totalStudents || 0) > 0);
    const avgCompletion =
      withStudents.length > 0
        ? Math.round(
            withStudents.reduce((sum, h) => sum + (h.submissionStats?.completionPct || 0), 0) /
              withStudents.length
          )
        : 0;
    return { total, active, dueSoon, overdue, avgCompletion };
  }, [homeworks]);

  // Filtered Homeworks
  const filteredHomeworks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return homeworks.filter(hw => {
      const days = getDueDays(hw.dueDate);
      if (statusFilter === 'ACTIVE' && hw.status !== 'ACTIVE') return false;
      if (statusFilter === 'CLOSED' && hw.status !== 'CLOSED') return false;
      if (statusFilter === 'DUE_SOON' && !(hw.status === 'ACTIVE' && days >= 0 && days <= 2)) return false;
      if (statusFilter === 'OVERDUE' && !(hw.status === 'ACTIVE' && days < 0)) return false;

      if (!q) return true;
      return (
        (hw.title || '').toLowerCase().includes(q) ||
        (hw.description || '').toLowerCase().includes(q) ||
        (hw.subject?.name || '').toLowerCase().includes(q) ||
        (hw.teacher?.user?.name || '').toLowerCase().includes(q) ||
        `${hw.class?.name}-${hw.class?.section}`.toLowerCase().includes(q)
      );
    });
  }, [homeworks, statusFilter, searchQuery]);

  // Grouped by Class for Daily Diary View
  const diaryGroups = useMemo(() => {
    const groups: Record<string, { className: string; items: Homework[] }> = {};
    for (const hw of filteredHomeworks) {
      const clsKey = hw.class?.id || 'unknown';
      const label = hw.class ? `${hw.class.name} - ${hw.class.section}` : 'Class';
      if (!groups[clsKey]) groups[clsKey] = { className: label, items: [] };
      groups[clsKey].items.push(hw);
    }
    return Object.values(groups);
  }, [filteredHomeworks]);

  const handleToggleHomeworkStatus = async (hw: Homework) => {
    const nextStatus = hw.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED';
    try {
      await api.put(`/api/homework/${hw.id}`, { status: nextStatus });
      setHomeworks(prev => prev.map(x => (x.id === hw.id ? { ...x, status: nextStatus } : x)));
      toast.success(nextStatus === 'CLOSED' ? 'Homework marked Closed' : 'Homework reopened');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/homework/${deleteTarget.id}`);
      setHomeworks(prev => prev.filter(x => x.id !== deleteTarget.id));
      toast.success('Homework deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete homework');
    }
  };

  // Teacher Submissions Drawer Handlers
  const openSubmissionsModal = async (hw: Homework) => {
    setSubHw(hw);
    setRosterSearch('');
    setRosterLoading(true);
    try {
      const res: any = await api.get(`/api/homework/${hw.id}/submissions`);
      const data = unwrap(res);
      setRoster(Array.isArray(data?.students) ? data.students : []);
    } catch {
      toast.error('Failed to load student submissions');
    } finally {
      setRosterLoading(false);
    }
  };

  const updateStudentSubmissionStatus = async (
    studentId: string,
    status: RosterStudent['status'],
    teacherRemark?: string
  ) => {
    if (!subHw) return;
    setSavingSubmissionId(studentId);
    try {
      await api.post(`/api/homework/${subHw.id}/submissions`, {
        studentId,
        status,
        teacherRemark,
      });
      setRoster(prev =>
        prev.map(r => (r.studentId === studentId ? { ...r, status, teacherRemark: teacherRemark ?? r.teacherRemark } : r))
      );
      toast.success(`Marked ${status}`);
      fetchAll();
    } catch {
      toast.error('Failed to save submission status');
    } finally {
      setSavingSubmissionId(null);
    }
  };

  const markAllRosterCompleted = async () => {
    if (!subHw || roster.length === 0) return;
    const ids = roster.map(r => r.studentId);
    setSavingSubmissionId('ALL');
    try {
      await api.post(`/api/homework/${subHw.id}/submissions`, {
        studentIds: ids,
        status: 'COMPLETED',
      });
      setRoster(prev => prev.map(r => ({ ...r, status: 'COMPLETED' })));
      toast.success(`All ${ids.length} students marked Completed!`);
      fetchAll();
    } catch {
      toast.error('Failed bulk update');
    } finally {
      setSavingSubmissionId(null);
    }
  };

  // Student Own Submission Handler
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSubmitHw) return;
    setSubmittingStudent(true);
    try {
      await api.post(`/api/homework/${studentSubmitHw.id}/submissions`, {
        status: 'SUBMITTED',
        studentNote: studentNote.trim(),
        attachmentUrl: studentLink.trim(),
      });
      toast.success('Homework marked as submitted!');
      setStudentSubmitHw(null);
      setStudentNote('');
      setStudentLink('');
      fetchAll();
    } catch {
      toast.error('Failed to submit homework');
    } finally {
      setSubmittingStudent(false);
    }
  };

  const copyClassDiary = (className: string, items: Homework[]) => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const lines = [
      `📚 *HOMEWORK DIARY — ${className}* (${today})`,
      '',
      ...items.map((hw, i) => {
        const due = new Date(hw.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        return `${i + 1}. *${hw.subject?.name}*: ${hw.title}${hw.description ? `\n   _${hw.description.slice(0, 120)}_` : ''}\n   📅 Due: ${due}`;
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success(`Copied ${className} diary to clipboard!`);
  };

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      r => r.name.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q)
    );
  }, [roster, rosterSearch]);

  if (loading && homeworks.length === 0) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title="Homework & Assignment Center"
        icon={<BookMarked className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchAll}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate('/homework/create')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Homework</span>
              </button>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 5 LIGHT PASTEL KPI CARDS                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700/80">Total Tasks</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.total}</h3>
              <p className="text-[11px] font-bold text-indigo-700 mt-1">Assigned work</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700/80">Active Open</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.active}</h3>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">Currently live</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-800/80">Due Soon</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.dueSoon}</h3>
              <p className="text-[11px] font-bold text-amber-800 mt-1">Due in ≤ 2 days</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] border border-rose-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-700/80">Overdue</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.overdue}</h3>
              <p className="text-[11px] font-bold text-rose-800 mt-1">Past deadline</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-violet-700/80">Completion</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.avgCompletion}%</h3>
              <p className="text-[11px] font-bold text-violet-800 mt-1">Avg class progress</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SMART SEARCH, FILTERS & VIEW SWITCHER BAR                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-[22px] border border-indigo-100/80 p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search topic, subject, or teacher..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {canEdit && (
                <>
                  <select
                    value={filterClass}
                    onChange={e => {
                      const val = e.target.value;
                      setFilterClass(val);
                      setFilterSubject('');
                      fetchSubjects(val);
                    }}
                    className="px-3 py-2 rounded-xl border border-indigo-100 bg-[#F8FAFF] text-xs font-extrabold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- ${c.section}` : ''}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    disabled={!filterClass}
                    className="px-3 py-2 rounded-xl border border-indigo-100 bg-[#F8FAFF] text-xs font-extrabold text-slate-700 outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{filterClass ? 'All Subjects' : 'Select Class for Subject'}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Grid vs Class Diary View Toggle */}
            <div className="flex items-center gap-1.5 bg-[#F4F7FC] p-1 rounded-xl border border-slate-200/80 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('diary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'diary' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Class Diary</span>
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            {(
              [
                ['ALL', 'All Assignments'],
                ['ACTIVE', 'Active'],
                ['DUE_SOON', 'Due Soon'],
                ['OVERDUE', 'Overdue'],
                ['CLOSED', 'Closed'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HOMEWORK LIST / DIARY VIEW                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {filteredHomeworks.length === 0 ? (
          <div className="bg-white rounded-[28px] p-14 flex flex-col items-center justify-center text-center shadow-xs border border-indigo-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No homework found</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1.5 max-w-md">
              {canEdit
                ? 'Click "Assign Homework" to publish assignments with due dates, worksheets & parent notifications.'
                : 'Your teachers have not assigned any matching homework yet.'}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate('/homework/create')}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign First Homework</span>
              </button>
            )}
          </div>
        ) : viewMode === 'diary' ? (
          /* CLASS DAILY DIARY VIEW */
          <div className="space-y-5">
            {diaryGroups.map(group => (
              <div key={group.className} className="bg-white rounded-[24px] border border-indigo-100 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black">
                      Class {group.className}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{group.items.length} Subject Tasks</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyClassDiary(group.className, group.items)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy WhatsApp Diary</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map(hw => {
                    const stInfo = getStatusInfo(hw.dueDate, hw.status);
                    const dueDate = new Date(hw.dueDate);
                    return (
                      <div key={hw.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFBFD]">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-black">
                              {hw.subject?.name}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-black border"
                              style={{ background: stInfo.bg, color: stInfo.text, borderColor: stInfo.border }}
                            >
                              {stInfo.label}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              Due: {MONTHS[dueDate.getMonth()]} {dueDate.getDate()}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">{hw.title}</h4>
                          {hw.description && <p className="text-xs text-slate-600 line-clamp-2">{hw.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openSubmissionsModal(hw)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {hw.submissionStats?.doneCount || 0}/{hw.submissionStats?.totalStudents || 0} Done
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPreviewHw(hw)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CARDS GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredHomeworks.map(hw => {
              const statusInfo = getStatusInfo(hw.dueDate, hw.status);
              const dueDate = new Date(hw.dueDate);
              const teacherPhoto = getPhotoUrl(hw.teacher?.user?.photoUrl);
              const stats = hw.submissionStats;
              const attachments = hw.attachmentList || [];

              return (
                <div
                  key={hw.id}
                  className="bg-white p-5 rounded-[24px] border border-indigo-100/90 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

                  <div className="flex items-center justify-between gap-2 mt-1 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: statusInfo.bg,
                          color: statusInfo.text,
                          borderColor: statusInfo.border,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {hw.class?.name}-{hw.class?.section}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {hw.subject?.name}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2 mb-2">
                    {hw.title}
                  </h3>

                  {hw.description && (
                    <p className="text-xs text-slate-600 font-medium line-clamp-3 mb-3 leading-relaxed bg-[#F8FAFF] p-3 rounded-2xl border border-indigo-100/70">
                      {hw.description}
                    </p>
                  )}

                  {/* Reference Attachments */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{att.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Student Submission Progress Bar (for Teacher/Admin) or Student Status */}
                  {canEdit && stats && stats.totalStudents > 0 && (
                    <div className="mb-3 bg-[#FAFBFD] border border-slate-200/80 rounded-2xl p-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-600">Class Completion</span>
                        <span className="text-indigo-700 font-black">
                          {stats.doneCount} / {stats.totalStudents} ({stats.completionPct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                          style={{ width: `${stats.completionPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isStudent && (
                    <div className="mb-3">
                      {hw.mySubmission && hw.mySubmission.status !== 'PENDING' ? (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Status: {hw.mySubmission.status}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSubmitHw(hw);
                              setStudentNote(hw.mySubmission?.studentNote || '');
                              setStudentLink(hw.mySubmission?.attachmentUrl || '');
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setStudentSubmitHw(hw);
                            setStudentNote('');
                            setStudentLink('');
                          }}
                          className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed / Add Note</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Due: {MONTHS[dueDate.getMonth()]} {dueDate.getDate()}, {dueDate.getFullYear()}
                        </span>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openSubmissionsModal(hw)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Check Roster</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {teacherPhoto ? (
                          <img
                            src={teacherPhoto}
                            alt={hw.teacher?.user?.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {hw.teacher?.user?.name?.charAt(0) || 'T'}
                          </div>
                        )}
                        <span className="font-bold text-xs text-slate-700 truncate">
                          {hw.teacher?.user?.name || 'Teacher'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewHw(hw)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleHomeworkStatus(hw)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer"
                              title={hw.status === 'CLOSED' ? 'Reopen Homework' : 'Close Homework'}
                            >
                              {hw.status === 'CLOSED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/homework/edit/${hw.id}`)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(hw)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PREVIEW DETAILS MODAL */}
      {previewHw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
          onClick={() => setPreviewHw(null)}
        >
          <div
            className="bg-white rounded-[28px] p-6 max-w-lg w-full shadow-2xl border border-indigo-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Class {previewHw.class?.name}-{previewHw.class?.section}
                  </span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {previewHw.subject?.name}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">{previewHw.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHw(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewHw.description && (
              <div className="text-slate-700 text-sm leading-relaxed mb-4 p-4 bg-[#F8FAFF] rounded-2xl border border-indigo-100 whitespace-pre-line">
                {previewHw.description}
              </div>
            )}

            {(previewHw.attachmentList?.length || 0) > 0 && (
              <div className="mb-4 space-y-1.5">
                <p className="text-[11px] font-black uppercase text-slate-500">Attachments &amp; Resources</p>
                <div className="flex flex-wrap gap-2">
                  {previewHw.attachmentList!.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{att.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-black uppercase">Due Date</p>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {new Date(previewHw.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-black uppercase">Assigned By</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{previewHw.teacher?.user?.name || 'Teacher'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER SUBMISSIONS & CHECKOFF MODAL */}
      {subHw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
          onClick={() => setSubHw(null)}
        >
          <div
            className="bg-white rounded-[28px] max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-indigo-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] border-b border-indigo-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Student Homework Evaluation</h2>
                <p className="text-xs font-semibold text-slate-600">
                  {subHw.class?.name}-{subHw.class?.section} &bull; {subHw.subject?.name} &bull; {subHw.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubHw(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-[#FAFBFD]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Search student or roll no..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <button
                type="button"
                onClick={markAllRosterCompleted}
                disabled={savingSubmissionId === 'ALL' || roster.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Completed</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {rosterLoading ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">Loading class roster...</div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">No students found in this class.</div>
              ) : (
                filteredRoster.map(st => {
                  const stPhoto = getPhotoUrl(st.photoUrl);
                  return (
                    <div
                      key={st.studentId}
                      className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-[#FAFBFD] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center shrink-0">
                          {stPhoto ? (
                            <img src={stPhoto} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-indigo-600">{st.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{st.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500">Roll: {st.rollNo}</p>
                          {st.studentNote && (
                            <p className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                              Note: {st.studentNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['COMPLETED', 'REWORK', 'PENDING'] as const).map(state => {
                          const active = st.status === state;
                          const styleMap = {
                            COMPLETED: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            REWORK: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-200',
                            PENDING: active ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-200',
                          };
                          return (
                            <button
                              key={state}
                              type="button"
                              disabled={savingSubmissionId === st.studentId}
                              onClick={() => updateStudentSubmissionStatus(st.studentId, state)}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase cursor-pointer transition-all ${styleMap[state]}`}
                            >
                              {state === 'COMPLETED' ? 'Done' : state === 'REWORK' ? 'Rework' : 'Pending'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SUBMIT HOMEWORK MODAL */}
      {studentSubmitHw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
          onClick={() => setStudentSubmitHw(null)}
        >
          <form
            onSubmit={handleStudentSubmit}
            className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-indigo-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Submit Homework</h3>
              <button
                type="button"
                onClick={() => setStudentSubmitHw(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold text-indigo-700">{studentSubmitHw.title}</p>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Completion Note</label>
              <textarea
                rows={3}
                value={studentNote}
                onChange={e => setStudentNote(e.target.value)}
                placeholder="e.g. Completed all questions in homework notebook..."
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl p-3 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Attachment / Drive Link (Optional)</label>
              <input
                type="url"
                value={studentLink}
                onChange={e => setStudentLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingStudent}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingStudent ? 'Submitting...' : 'Confirm & Mark Completed'}</span>
            </button>
          </form>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-slate-900">Delete Homework?</h3>
            <p className="text-xs font-semibold text-slate-600">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? Student submission records for this task will also be removed.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
