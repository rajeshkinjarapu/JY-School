import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, BookOpen, School, GraduationCap,
  UserCheck, UserX, Edit3, Check, X, ChevronRight,
  Calendar, Clock, BarChart3, Layers, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GRADIENT_PRESETS = [
  'from-violet-600 via-purple-600 to-indigo-700',
  'from-blue-600 via-cyan-600 to-teal-700',
  'from-emerald-600 via-teal-600 to-cyan-700',
  'from-rose-600 via-pink-600 to-fuchsia-700',
  'from-amber-500 via-orange-500 to-red-600',
  'from-indigo-600 via-blue-600 to-violet-700',
  'from-teal-600 via-emerald-600 to-green-700',
  'from-fuchsia-600 via-rose-600 to-pink-700',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const SubjectDetailsPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null); // subjectId being assigned
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const gradient = GRADIENT_PRESETS[hashString(name || 'subject') % GRADIENT_PRESETS.length];

  const fetchData = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    try {
      const [subRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects?limit=5000'),
        api.get('/api/teachers?limit=5000'),
      ]);

      const allSubjects: any[] = subRes?.data?.data || subRes?.data || subRes || [];
      const related = allSubjects.filter(
        (s: any) => s.name?.trim().toUpperCase() === name.trim().toUpperCase()
      );
      setClasses(related);

      const teacherList: any[] = teachRes?.data?.data || teachRes?.data || teachRes || [];
      setTeachers(teacherList);

      // Init selected teachers from existing assignments
      const initSelected: Record<string, string> = {};
      related.forEach((s: any) => {
        const existingTeacherId = s.classSubjectTeachers?.[0]?.teacherId || '';
        initSelected[s.id] = existingTeacherId;
      });
      setSelectedTeacher(initSelected);

      // Fetch timetable slots for all related classes
      if (related.length > 0) {
        const slots: any[] = [];
        await Promise.all(
          related.map(async (s: any) => {
            try {
              const ttRes: any = await api.get(`/api/timetable/class?classId=${s.classId}`);
              const ttData: any[] = ttRes?.data || ttRes || [];
              // Filter slots that match this subject
              const subjectSlots = ttData.filter((slot: any) => slot.subjectId === s.id);
              slots.push(...subjectSlots);
            } catch {
              // skip if no timetable
            }
          })
        );
        setTimetableSlots(slots);
      }
    } catch (error) {
      toast.error('Failed to load subject data');
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignTeacher = async (subjectEntry: any) => {
    const tid = selectedTeacher[subjectEntry.id];
    if (!tid) {
      toast.error('Please select a teacher first');
      return;
    }
    setSavingId(subjectEntry.id);
    try {
      await api.post('/api/subjects/assign-teacher', {
        classId: subjectEntry.classId,
        subjectId: subjectEntry.id,
        teacherId: tid,
      });
      toast.success('Teacher assigned successfully!');
      setAssigning(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign teacher');
    } finally {
      setSavingId(null);
    }
  };

  // Computed stats
  const totalClasses = classes.length;
  const assignedTeacherIds = new Set(
    classes.map(c => c.classSubjectTeachers?.[0]?.teacherId).filter(Boolean)
  );
  const assignedCount = assignedTeacherIds.size;
  const unassignedCount = classes.filter(c => !c.classSubjectTeachers?.[0]?.teacherId).length;
  const weeklyPeriods = timetableSlots.length;

  // Timetable: group by day
  const slotsByDay: Record<string, any[]> = {};
  DAYS.forEach(d => { slotsByDay[d] = []; });
  timetableSlots.forEach(slot => {
    const day = slot.day;
    if (slotsByDay[day]) slotsByDay[day].push(slot);
    else slotsByDay[day] = [slot];
  });
  const hasAnySlots = timetableSlots.length > 0;
  const activeDays = DAYS.filter(d => slotsByDay[d].length > 0);

  const abbr = name ? name.substring(0, 2).toUpperCase() : 'SB';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ═══════════════ HERO ═══════════════ */}
      <div className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-white/5 rotate-12 blur-3xl" />

        <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: back + title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/subjects')}
                className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm transition-all text-white shadow-lg border border-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                    Subject
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-xl shadow-inner backdrop-blur-sm">
                    {abbr}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none drop-shadow">
                      {name}
                    </h1>
                    <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Class-wise subject assignments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: refresh */}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-bold border border-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* ── Stat Pills ── */}
          <div className="mt-7 flex flex-wrap gap-3">
            {[
              { icon: <Layers className="w-4 h-4" />, label: 'Total Classes', value: totalClasses },
              { icon: <UserCheck className="w-4 h-4" />, label: 'Teachers Assigned', value: assignedCount },
              { icon: <UserX className="w-4 h-4" />, label: 'Unassigned', value: unassignedCount },
              { icon: <Calendar className="w-4 h-4" />, label: 'Weekly Periods', value: weeklyPeriods },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 text-white"
              >
                <div className="opacity-80">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider leading-none">{stat.label}</p>
                  <p className="text-lg font-black leading-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ BODY ═══════════════ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* ── Class Assignment Cards ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Class Assignments</h2>
                <p className="text-xs text-gray-500 font-medium">Manage teachers for each class</p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {totalClasses} {totalClasses === 1 ? 'class' : 'classes'}
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
              <School className="w-14 h-14 text-gray-200 mb-3" />
              <h3 className="text-base font-black text-gray-700">No classes found</h3>
              <p className="text-sm text-gray-400 mt-1">This subject hasn't been added to any class yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {classes.map((cls: any) => {
                const currentTeacher = cls.classSubjectTeachers?.[0]?.teacher?.user?.name;
                const currentTeacherId = cls.classSubjectTeachers?.[0]?.teacherId || '';
                const isAssigningThis = assigning === cls.id;
                const className = cls.class ? `${cls.class.name}-${cls.class.section}` : 'N/A';
                const classShort = cls.class ? `${cls.class.name}` : '?';
                const saving = savingId === cls.id;

                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden group"
                  >
                    {/* Card Top */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700 shadow-inner">
                            <span className="text-[9px] font-black opacity-50 uppercase leading-none mt-1">Class</span>
                            <span className="text-xl font-black leading-tight">{classShort}</span>
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                              {className}
                            </h3>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">
                              {cls.code || name}
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        {currentTeacher ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Assigned
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                            <UserX className="w-3 h-3" /> Unassigned
                          </span>
                        )}
                      </div>

                      {/* Teacher row */}
                      {!isAssigningThis ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-gray-500 border-2 border-white shadow shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Teacher</p>
                              <p className={`text-sm font-black truncate ${currentTeacher ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                {currentTeacher || 'Not Assigned'}
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setAssigning(cls.id);
                                setSelectedTeacher(prev => ({ ...prev, [cls.id]: currentTeacherId }));
                              }}
                              className="ml-2 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 shrink-0"
                              title="Change teacher"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Inline assignment UI */
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5">
                          <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Select Teacher</p>
                          <select
                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-semibold text-gray-800"
                            value={selectedTeacher[cls.id] || ''}
                            onChange={e => setSelectedTeacher(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          >
                            <option value="">-- Select Teacher --</option>
                            {teachers.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.user?.name} ({t.employeeId})
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAssignTeacher(cls)}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-colors disabled:opacity-60"
                            >
                              {saving ? <LoadingSpinner size="sm" /> : <><Check className="w-3.5 h-3.5" /> Save</>}
                            </button>
                            <button
                              onClick={() => setAssigning(null)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Weekly Timetable ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Weekly Schedule</h2>
                <p className="text-xs text-gray-500 font-medium">Timetable slots for this subject</p>
              </div>
            </div>
            {weeklyPeriods > 0 && (
              <span className="text-xs font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {weeklyPeriods} {weeklyPeriods === 1 ? 'period' : 'periods'}/week
              </span>
            )}
          </div>

          {!hasAnySlots ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
              <Calendar className="w-12 h-12 text-gray-200 mb-3" />
              <h3 className="text-base font-black text-gray-700">No timetable slots</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                This subject hasn't been scheduled in the timetable yet. Go to Timetable to add slots.
              </p>
              <button
                onClick={() => navigate('/timetable')}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors"
              >
                Go to Timetable <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {activeDays.map(day => (
                  <div key={day} className="flex items-stretch">
                    {/* Day label */}
                    <div className="w-28 shrink-0 flex items-center justify-center bg-gray-50 border-r border-gray-100 px-3 py-4">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{day.slice(0, 3)}</span>
                    </div>
                    {/* Slots */}
                    <div className="flex flex-wrap gap-2 p-3 items-center">
                      {slotsByDay[day]
                        .sort((a, b) => a.periodNumber - b.periodNumber)
                        .map((slot: any, si: number) => (
                          <div
                            key={slot.id || si}
                            className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-xl"
                          >
                            <Clock className="w-3 h-3 text-violet-500 shrink-0" />
                            <div>
                              <p className="text-xs font-black text-violet-800">
                                {slot.startTime} – {slot.endTime}
                              </p>
                              <p className="text-[10px] text-violet-500 font-semibold">
                                {slot.class ? `${slot.class.name}-${slot.class.section}` : ''}
                                {slot.room ? ` · Room ${slot.room}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Quick Insights ── */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Coverage Overview</h2>
              <p className="text-xs text-gray-500 font-medium">Teacher assignment summary</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Assignment coverage bar */}
            <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-end mb-3">
                <p className="text-sm font-black text-gray-700">Assignment Coverage</p>
                <p className="text-2xl font-black text-gray-900">
                  {totalClasses > 0 ? Math.round(((totalClasses - unassignedCount) / totalClasses) * 100) : 0}%
                </p>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalClasses > 0 ? ((totalClasses - unassignedCount) / totalClasses) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Assigned: {totalClasses - unassignedCount}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-amber-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Pending: {unassignedCount}
                </span>
              </div>
            </div>

            {/* Unique teachers card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Unique Teachers</p>
                <p className="text-4xl font-black text-gray-900 mt-1">{assignedCount}</p>
              </div>
              <div className="flex -space-x-2 mt-3">
                {Array.from(assignedTeacherIds).slice(0, 5).map((tid: any, i) => {
                  const t = teachers.find((te: any) => te.id === tid);
                  const initials = t?.user?.name?.substring(0, 2)?.toUpperCase() || '?';
                  return (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow"
                      title={t?.user?.name}
                    >
                      {initials}
                    </div>
                  );
                })}
                {assignedCount > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-[9px] font-black shadow">
                    +{assignedCount - 5}
                  </div>
                )}
                {assignedCount === 0 && (
                  <p className="text-xs text-gray-400 font-semibold italic">No teachers assigned yet</p>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SubjectDetailsPage;
