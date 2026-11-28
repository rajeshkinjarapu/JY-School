import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Plus, School, BookOpen, Users, Search, LayoutGrid, List,
  ChevronRight, CheckCircle2, AlertCircle, Layers, UserCheck, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { DataCache } from '../../services/dataCache';

const PASTEL_PALETTES = [
  {
    headerBg: 'from-[#F2EDFF] to-[#DDD2FF]',
    border: 'border-[#CEC0FF]',
    iconBg: 'from-[#8B5CF6] to-[#6D28D9]',
    title: 'text-[#4C1D95]',
    pill: 'bg-white/80 text-[#5B21B6] border-[#CEC0FF]',
  },
  {
    headerBg: 'from-[#EAF2FF] to-[#CBE0FF]',
    border: 'border-[#B6D2FF]',
    iconBg: 'from-[#2563EB] to-[#1D4ED8]',
    title: 'text-[#1E3A8A]',
    pill: 'bg-white/80 text-[#1D4ED8] border-[#B6D2FF]',
  },
  {
    headerBg: 'from-[#E5FAEF] to-[#C2F2D9]',
    border: 'border-[#ACEAD0]',
    iconBg: 'from-[#10B981] to-[#059669]',
    title: 'text-[#065F46]',
    pill: 'bg-white/80 text-[#059669] border-[#ACEAD0]',
  },
  {
    headerBg: 'from-[#FFEFEF] to-[#FFD2D7]',
    border: 'border-[#FFC0C7]',
    iconBg: 'from-[#EF4444] to-[#DC2626]',
    title: 'text-[#991B1B]',
    pill: 'bg-white/80 text-[#DC2626] border-[#FFC0C7]',
  },
  {
    headerBg: 'from-[#FFF6E5] to-[#FFE4B8]',
    border: 'border-[#FAD79B]',
    iconBg: 'from-[#F59E0B] to-[#D97706]',
    title: 'text-[#9A3412]',
    pill: 'bg-white/80 text-[#B45309] border-[#FAD79B]',
  },
  {
    headerBg: 'from-[#E6FAFC] to-[#C4F1F9]',
    border: 'border-[#B0E9F5]',
    iconBg: 'from-[#06B6D4] to-[#0891B2]',
    title: 'text-[#155E75]',
    pill: 'bg-white/80 text-[#0891B2] border-[#B0E9F5]',
  },
  {
    headerBg: 'from-[#FFEBF3] to-[#FFD0E4]',
    border: 'border-[#FFBDDA]',
    iconBg: 'from-[#EC4899] to-[#DB2777]',
    title: 'text-[#9D174D]',
    pill: 'bg-white/80 text-[#DB2777] border-[#FFBDDA]',
  },
];

export const SubjectPage: React.FC = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async (forceRefresh = false) => {
    try {
      const [subRes, teachRes]: any = await Promise.all([
        DataCache.get('subjects', forceRefresh),
        DataCache.get('teachers'),
      ]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setTeachers(Array.isArray(teachRes) ? teachRes : []);
    } catch (e) {
      toast.error('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const subjectSummaries = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    subjects.forEach((sub: any) => {
      const key = (sub.name?.trim() || 'Unknown').toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(sub);
    });

    return Object.keys(grouped)
      .sort()
      .map((subjectName) => {
        const entries = grouped[subjectName];
        const classLabels = Array.from(
          new Set(
            entries
              .map((e) => (e.class ? `${e.class.name}-${e.class.section}` : null))
              .filter(Boolean) as string[]
          )
        );
        const teacherMap = new Map<string, string>();
        let assignedEntries = 0;
        entries.forEach((e) => {
          const cst = e.classSubjectTeachers?.[0];
          if (cst?.teacherId) {
            assignedEntries++;
            teacherMap.set(cst.teacherId, cst.teacher?.user?.name || 'Faculty');
          }
        });
        const teacherNames = Array.from(teacherMap.values());
        const unassignedEntries = entries.length - assignedEntries;

        return {
          subjectName,
          abbr: subjectName.substring(0, 2).toUpperCase(),
          entries,
          classCount: entries.length,
          classLabels,
          assignedEntries,
          unassignedEntries,
          teacherNames,
          teacherCount: teacherNames.length,
          isFullyAssigned: entries.length > 0 && unassignedEntries === 0,
        };
      });
  }, [subjects]);

  const stats = useMemo(() => {
    const totalSubjects = subjectSummaries.length;
    const totalClassMappings = subjects.length;
    const uniqueTeacherIds = new Set<string>();
    let unassignedCount = 0;
    subjects.forEach((s) => {
      const tid = s.classSubjectTeachers?.[0]?.teacherId;
      if (tid) uniqueTeacherIds.add(tid);
      else unassignedCount++;
    });
    return {
      totalSubjects,
      totalClassMappings,
      assignedTeachers: uniqueTeacherIds.size,
      unassignedCount,
    };
  }, [subjectSummaries, subjects]);

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return subjectSummaries.filter((item) => {
      const matchesSearch =
        !q ||
        item.subjectName.toLowerCase().includes(q) ||
        item.teacherNames.some((t) => t.toLowerCase().includes(q)) ||
        item.classLabels.some((c) => c.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (statusFilter === 'ASSIGNED') return item.assignedEntries > 0 && item.unassignedEntries === 0;
      if (statusFilter === 'UNASSIGNED') return item.unassignedEntries > 0;
      return true;
    });
  }, [subjectSummaries, searchQuery, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingSubject) {
        await api.put(`/api/subjects/${editingSubject.id}`, { name });
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId: editingSubject.classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        await api.post('/api/subjects', { name, teacherId });
        toast.success('Subject created successfully!');
      }

      setShowModal(false);
      setName('');
      setTeacherId('');
      setEditingSubject(null);
      DataCache.invalidate('subjects');
      fetchData(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Error saving subject details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Subjects & Curriculum"
        icon={<BookOpen className="w-5 h-5 text-white" />}
        action={
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#5B21B6]" />
            <span>New Subject</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-10">

          {/* 4 Dashboard Glossy Pastel KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Curriculum Subjects</p>
                  <p className="text-2xl font-black text-[#4C1D95] leading-tight">{stats.totalSubjects}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Class Mappings</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">{stats.totalClassMappings}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Active Faculty</p>
                  <p className="text-2xl font-black text-[#065F46] leading-tight">{stats.assignedTeachers}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Unassigned Slots</p>
                  <p className="text-2xl font-black text-[#9A3412] leading-tight">{stats.unassignedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search, Filter & View Switcher Toolbar */}
          <div className="bg-white border border-indigo-100/80 rounded-[18px] p-3 sm:p-4 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[210px] max-w-md">
                <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subject, class or teacher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { key: 'ALL', label: `All (${subjectSummaries.length})`, active: 'bg-[#5B21B6] text-white', idle: 'bg-[#F8FAFF] text-slate-600 border-indigo-100' },
                  { key: 'ASSIGNED', label: 'Fully Assigned', active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { key: 'UNASSIGNED', label: 'Needs Teacher', active: 'bg-amber-600 text-white', idle: 'bg-amber-50 text-amber-700 border-amber-200' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setStatusFilter(chip.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      statusFilter === chip.key ? `${chip.active} border-transparent shadow-xs` : chip.idle
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards vs Table Switcher */}
            <div className="inline-flex items-center bg-[#F3F5FC] p-1 rounded-xl border border-indigo-100 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E1B4B]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E1B4B]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[22px] border border-indigo-100/80 shadow-xs">
              <LoadingSpinner size="lg" />
              <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Loading subjects curriculum...</p>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="bg-white border border-[#DDD7F3] rounded-[22px] p-14 text-center shadow-[0_12px_32px_-6px_rgba(91,33,182,0.08)] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#CEC0FF] flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[#5B21B6]" />
              </div>
              <h3 className="text-lg font-black text-[#1E1B4B] mb-1">No Matching Subjects Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5">
                {subjects.length === 0
                  ? 'Click "New Subject" at the top right to configure your school curriculum.'
                  : 'Try clearing your search query or status filter.'}
              </p>
              {subjects.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubject(null);
                    setName('');
                    setTeacherId('');
                    setShowModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Subject</span>
                </button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* ── DASHBOARD PASTEL SUBJECT CARDS GRID ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSummaries.map((item, idx) => {
                const pal = PASTEL_PALETTES[idx % PASTEL_PALETTES.length];
                return (
                  <div
                    key={item.subjectName}
                    onClick={() => navigate('/subjects/' + encodeURIComponent(item.subjectName))}
                    className="group bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] hover:shadow-[0_14px_30px_-8px_rgba(91,33,182,0.16)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
                  >
                    {/* Glossy Pastel Card Header */}
                    <div className={`relative overflow-hidden px-4 py-4 bg-gradient-to-br ${pal.headerBg} border-b ${pal.border}`}>
                      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${pal.iconBg} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0`}>
                            {item.abbr}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`font-black text-sm sm:text-base tracking-tight truncate ${pal.title}`}>
                              {item.subjectName}
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600">
                              {item.classCount} {item.classCount === 1 ? 'Class' : 'Classes'}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all ${pal.title}`} />
                      </div>
                    </div>

                    {/* Clean White Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-2.5">
                        {/* Classes Preview */}
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <School className="w-3 h-3 text-indigo-400" /> Classes Covered
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.classLabels.slice(0, 4).map((cls) => (
                              <span
                                key={cls}
                                className="px-2 py-0.5 rounded-md bg-[#F4F2FC] border border-[#E5E0FA] text-[#5B21B6] text-[10px] font-extrabold"
                              >
                                {cls}
                              </span>
                            ))}
                            {item.classLabels.length > 4 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                +{item.classLabels.length - 4} more
                              </span>
                            )}
                            {item.classLabels.length === 0 && (
                              <span className="text-[11px] text-slate-400 font-medium italic">Not mapped to classes</span>
                            )}
                          </div>
                        </div>

                        {/* Faculty Preview */}
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-500" /> Assigned Faculty
                          </p>
                          {item.teacherNames.length > 0 ? (
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {item.teacherNames.slice(0, 2).join(', ')}
                              {item.teacherNames.length > 2 ? ` +${item.teacherNames.length - 2}` : ''}
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-amber-600">No teacher assigned yet</p>
                          )}
                        </div>
                      </div>

                      {/* Footer Status Row */}
                      <div className="pt-2.5 border-t border-indigo-50 flex items-center justify-between">
                        {item.unassignedEntries === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                            <CheckCircle2 className="w-3 h-3" /> All Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" /> {item.unassignedEntries} Unassigned
                          </span>
                        )}
                        <span className="text-[11px] font-extrabold text-[#5B21B6] group-hover:underline">
                          Manage &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── PURPLE GRID DIRECTORY TABLE VIEW ── */
            <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs student-grid-table">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-3 w-14 text-center border-r border-white/20 !text-white">#</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Code</th>
                      <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Subject Name</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Classes</th>
                      <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Assigned Teachers</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Coverage</th>
                      <th className="py-3.5 px-4 text-center !text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.map((item, idx) => {
                      const rowBorderBottom = idx === filteredSummaries.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                      return (
                        <tr
                          key={item.subjectName}
                          onClick={() => navigate('/subjects/' + encodeURIComponent(item.subjectName))}
                          className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white cursor-pointer"
                        >
                          <td className={`py-3 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {idx + 1}
                          </td>
                          <td className={`py-3 px-4 text-center border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE] font-mono">
                              {item.abbr}
                            </span>
                          </td>
                          <td className={`py-3 px-5 font-extrabold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.subjectName}
                          </td>
                          <td className={`py-3 px-4 text-center font-black text-slate-700 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.classCount}
                          </td>
                          <td className={`py-3 px-5 font-semibold text-slate-700 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.teacherNames.length > 0 ? item.teacherNames.join(', ') : <span className="text-amber-600 font-bold">Not Assigned</span>}
                          </td>
                          <td className={`py-3 px-4 text-center border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.unassignedEntries === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                                <CheckCircle2 className="w-3 h-3" /> Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                {item.unassignedEntries} Pending
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-center ${rowBorderBottom}`}>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#EFEAFE] text-[#5B21B6] font-extrabold text-[11px] hover:bg-[#5B21B6] hover:text-white transition-colors">
                              Open <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add / Edit Subject Modal (Clean Light Theme) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-[#DDD7F3]">
            <div className="px-6 py-4 bg-gradient-to-r from-[#F2EDFF] to-[#EAF2FF] border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E1B4B]">
                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {editingSubject ? 'Update subject details and teacher.' : 'Create a subject and map it to faculty.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/80 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              {editingSubject && (
                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Class Room
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingSubject.class ? `${editingSubject.class.name}-${editingSubject.class.section}` : 'N/A'}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 font-bold cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-indigo-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
