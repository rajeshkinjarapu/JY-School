import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  BookOpen, Plus, Trash2, Edit3, Clock, CheckCircle2,
  Calendar, ChevronDown, X, Upload, AlertCircle, BookMarked,
  Eye
} from 'lucide-react';

interface Homework {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  class: { id: string; name: string; section: string };
  subject: { id: string; name: string; code: string };
  teacher: { user: { name: string; photoUrl?: string } };
  createdAt: string;
}

interface ClassOption { id: string; name: string; section: string }
interface SubjectOption { id: string; name: string; code: string }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', classId: '', subjectId: '', status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewHw, setPreviewHw] = useState<Homework | null>(null);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const canEdit = isTeacher || isAdmin;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterClass) params.classId = filterClass;
      if (filterSubject) params.subjectId = filterSubject;
      const res: any = await api.get('/api/homework', { params });
      setHomeworks(res.data?.data || res.data || []);
    } catch (e) {
      setError('Failed to load homework');
    } finally { setLoading(false); }
  };

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data?.data || res.data || []);
    } catch {}
  };

  const fetchSubjects = async (classId?: string) => {
    if (!classId) return;
    try {
      const res: any = await api.get('/api/subjects', { params: { classId } });
      setSubjects(res.data?.data || res.data || []);
    } catch {}
  };

  useEffect(() => { fetchAll(); }, [filterClass, filterSubject]);
  useEffect(() => { if (canEdit) fetchClasses(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', description: '', dueDate: '', classId: '', subjectId: '', status: 'ACTIVE' });
    setSubjects([]);
    setShowForm(true);
    setError('');
  };

  const openEdit = (hw: Homework) => {
    setEditId(hw.id);
    setForm({
      title: hw.title,
      description: hw.description || '',
      dueDate: new Date(hw.dueDate).toISOString().split('T')[0],
      classId: hw.class.id,
      subjectId: hw.subject.id,
      status: hw.status,
    });
    fetchSubjects(hw.class.id);
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title || !form.dueDate || !form.classId || !form.subjectId) {
      setError('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/homework/${editId}`, form);
      } else {
        await api.post('/api/homework', form);
      }
      setShowForm(false);
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this homework?')) return;
    try {
      await api.delete(`/api/homework/${id}`);
      setHomeworks(h => h.filter(x => x.id !== id));
    } catch {}
  };

  const getDueDays = (dueDate: string) => {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const getStatusColor = (due: string, status: string) => {
    if (status === 'CLOSED') return { bg: '#f1f5f9', text: '#64748b', label: 'Closed' };
    const days = getDueDays(due);
    if (days < 0) return { bg: '#fef2f2', text: '#ef4444', label: 'Overdue' };
    if (days === 0) return { bg: '#fff7ed', text: '#f97316', label: 'Due Today' };
    if (days <= 2) return { bg: '#fefce8', text: '#eab308', label: `${days}d left` };
    return { bg: '#f0fdf4', text: '#22c55e', label: `${days}d left` };
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 gap-6 relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-500/30 text-white shrink-0">
            <BookMarked className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Homework Manager</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage and track student assignments</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-10">
          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-white/40 dark:border-slate-700 shadow-inner">
              <select 
                value={filterClass} 
                onChange={e => { setFilterClass(e.target.value); setFilterSubject(''); fetchSubjects(e.target.value); }}
                className="appearance-none px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-sm cursor-pointer min-w-[150px]"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
              </select>
              <select 
                value={filterSubject} 
                onChange={e => setFilterSubject(e.target.value)}
                className="appearance-none px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-sm cursor-pointer min-w-[150px]"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          
          {canEdit && (
            <button 
              onClick={openCreate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 border-none"
            >
              <Plus className="w-4 h-4" /> Assign New
            </button>
          )}
        </div>
      </div>

      {/* Homework Grid */}
      {/* Homework Grid */}
      {homeworks.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200/60 dark:border-slate-800">
          <BookMarked className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">No homework found</h3>
          <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md">
            {canEdit ? 'Click "Assign New" to add the first assignment.' : 'Your teacher has not assigned any homework yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {homeworks.map((hw, idx) => {
            const statusInfo = getStatusColor(hw.dueDate, hw.status);
            const dueDate = new Date(hw.dueDate);
            return (
              <div 
                key={hw.id} 
                className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-lg relative group transition-all duration-300 hover:shadow-xl hover:bg-white/80 dark:hover:bg-slate-900/60 flex flex-col h-full animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-3xl opacity-80" />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4 mt-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-white/40 shadow-sm"
                          style={{ background: statusInfo.bg, color: statusInfo.text }}>
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          {hw.class.name}-{hw.class.section}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight line-clamp-2">{hw.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-xs font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                      {hw.subject.name}
                    </div>
                  </div>

                  {hw.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-2 mb-4 leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {hw.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold mb-4 bg-slate-50 dark:bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    Due: {MONTHS[dueDate.getMonth()]} {dueDate.getDate()}, {dueDate.getFullYear()}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hw.teacher?.user?.photoUrl ? (
                        <img src={hw.teacher.user.photoUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                          {hw.teacher?.user?.name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{hw.teacher?.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => setPreviewHw(hw)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm transition-all cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEdit(hw)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shadow-sm transition-all cursor-pointer">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(hw.id)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-all cursor-pointer">
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

      {/* Preview Modal */}
      {previewHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPreviewHw(null)}>
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                    {previewHw.class.name}-{previewHw.class.section}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {previewHw.subject.name}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800">{previewHw.title}</h2>
              </div>
              <button onClick={() => setPreviewHw(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewHw.description && (
              <p className="text-slate-600 text-sm leading-relaxed mb-5 p-4 bg-slate-50 rounded-xl">{previewHw.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-semibold mb-0.5">Due Date</p>
                <p className="font-bold text-slate-800">{new Date(previewHw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-semibold mb-0.5">Assigned By</p>
                <p className="font-bold text-slate-800">{previewHw.teacher?.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">{editId ? 'Edit Homework' : 'Assign Homework'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Homework title..." />
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Describe the homework assignment..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Class *</label>
                  <select value={form.classId} onChange={e => { setForm(f => ({ ...f, classId: e.target.value, subjectId: '' })); fetchSubjects(e.target.value); }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Subject *</label>
                  <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer" />
                </div>
                {editId && (
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                {saving ? 'Saving...' : editId ? 'Update' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;

