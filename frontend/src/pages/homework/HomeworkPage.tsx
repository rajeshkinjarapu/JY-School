import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  BookOpen, Plus, Trash2, Edit3, Clock, CheckCircle2,
  Calendar, ChevronDown, X, Upload, AlertCircle, BookMarked,
  Eye, Sparkles, Filter, CheckCircle, FileText
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

import { PageHeader } from '../../components/UI/PageHeader';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const HomeworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
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
    navigate('/homework/create');
  };

  const openEdit = (hw: Homework) => {
    navigate(`/homework/edit/${hw.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this homework assignment?')) return;
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
    if (days === 1) return { bg: '#fefce8', text: '#eab308', label: 'Due Tomorrow' };
    if (days <= 3) return { bg: '#ecfdf5', text: '#059669', label: `${days} Days Left` };
    return { bg: '#f0fdf4', text: '#16a34a', label: `${days} Days Left` };
  };

  // Metric counts
  const totalCount = homeworks.length;
  const activeCount = homeworks.filter(h => h.status === 'ACTIVE').length;
  const dueSoonCount = homeworks.filter(h => {
    const d = getDueDays(h.dueDate);
    return h.status === 'ACTIVE' && d >= 0 && d <= 2;
  }).length;
  const overdueCount = homeworks.filter(h => {
    const d = getDueDays(h.dueDate);
    return h.status === 'ACTIVE' && d < 0;
  }).length;

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Homework Manager" 
        icon={<BookMarked className="w-5 h-5" />} 
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in-up pb-10">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Assigned assignments</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Currently open</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Soon</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{dueSoonCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Due in &le; 2 days</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Past deadline</div>
          </div>
        </div>

        {/* Actions & Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <select 
                  value={filterClass} 
                  onChange={e => { setFilterClass(e.target.value); setFilterSubject(''); fetchSubjects(e.target.value); }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer min-w-[140px]"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
                <select 
                  value={filterSubject} 
                  onChange={e => setFilterSubject(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer min-w-[140px]"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {canEdit && (
            <button 
              onClick={openCreate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Assign Homework
            </button>
          )}
        </div>

        {/* Homework Grid */}
        {homeworks.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200">
            <BookMarked className="w-16 h-16 text-slate-300 mb-4 stroke-1" />
            <h3 className="text-xl font-black text-slate-700">No homework found</h3>
            <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md">
              {canEdit ? 'Click "Assign Homework" to publish a new assignment for students.' : 'Your teacher has not assigned any homework yet.'}
            </p>
            {canEdit && (
              <button
                onClick={openCreate}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Assign First Homework
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {homeworks.map((hw, idx) => {
              const statusInfo = getStatusColor(hw.dueDate, hw.status);
              const dueDate = new Date(hw.dueDate);
              return (
                <div 
                  key={hw.id} 
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group transition-all duration-300 hover:shadow-lg hover:border-emerald-200 flex flex-col h-full animate-fade-in-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-3xl opacity-90" />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3 mt-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span 
                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border shadow-xs"
                            style={{ background: statusInfo.bg, color: statusInfo.text, borderColor: statusInfo.text + '33' }}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
                            Class {hw.class.name}-{hw.class.section}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-800 text-base leading-snug line-clamp-2">
                          {hw.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3.5">
                      <div className="text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border border-indigo-100">
                        {hw.subject.name}
                      </div>
                    </div>

                    {hw.description && (
                      <p className="text-xs text-slate-600 font-medium line-clamp-3 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        {hw.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-3.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3.5 bg-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-200/70">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      Due: {MONTHS[dueDate.getMonth()]} {dueDate.getDate()}, {dueDate.getFullYear()}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {hw.teacher?.user?.photoUrl ? (
                          <img src={hw.teacher.user.photoUrl} className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm" alt="" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {hw.teacher?.user?.name?.charAt(0) || 'T'}
                          </div>
                        )}
                        <span className="font-bold text-xs text-slate-700 truncate max-w-[130px]">
                          {hw.teacher?.user?.name || 'Assigned by Teacher'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setPreviewHw(hw)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => openEdit(hw)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all cursor-pointer"
                              title="Edit Homework"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(hw.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                              title="Delete Homework"
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

        {/* Preview Details Modal */}
        {previewHw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(6px)' }}
            onClick={() => setPreviewHw(null)}>
            <div className="bg-white rounded-[2rem] p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Class {previewHw.class.name}-{previewHw.class.section}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {previewHw.subject.name}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 leading-tight">{previewHw.title}</h2>
                </div>
                <button onClick={() => setPreviewHw(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {previewHw.description && (
                <div className="text-slate-600 text-sm leading-relaxed mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 whitespace-pre-line">
                  {previewHw.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Due Date</p>
                  <p className="font-bold text-slate-800">
                    {new Date(previewHw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Assigned By</p>
                  <p className="font-bold text-slate-800">{previewHw.teacher?.user?.name || 'Teacher'}</p>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const id = previewHw.id;
                      setPreviewHw(null);
                      navigate(`/homework/edit/${id}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Assignment
                  </button>
                  <button
                    onClick={() => {
                      const id = previewHw.id;
                      setPreviewHw(null);
                      handleDelete(id);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeworkPage;
