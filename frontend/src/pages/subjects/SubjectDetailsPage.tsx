import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, BookOpen, School, UserCheck, UserX, Edit3, Check,
  X, ChevronRight, Calendar, Clock, BarChart3, Layers, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { DataCache } from '../../services/dataCache';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const SubjectDetailsPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    try {
      const [subRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects?limit=5000'),
        api.get('/api/teachers?limit=5000'),
      ]);

      const allSubjects = extractArray<any>(subRes);
      const related = allSubjects.filter(
        (s: any) => s.name?.trim().toUpperCase() === name.trim().toUpperCase()
      );
      setClasses(related);

      const teacherList = extractArray<any>(teachRes);
      setTeachers(teacherList);

      const initSelected: Record<string, string> = {};
      related.forEach((s: any) => {
        const existingTeacherId = s.classSubjectTeachers?.[0]?.teacherId || '';
        initSelected[s.id] = existingTeacherId;
      });
      setSelectedTeacher(initSelected);

      if (related.length > 0) {
        const slots: any[] = [];
        await Promise.all(
          related.map(async (s: any) => {
            try {
              const ttRes: any = await api.get(`/api/timetable/class?classId=${s.classId}`);
              const ttData = extractArray<any>(ttRes);
              const subjectSlots = ttData.filter((slot: any) => slot.subjectId === s.id);
              slots.push(...subjectSlots);
            } catch {
              // skip if no timetable
            }
          })
        );
        setTimetableSlots(slots);
      } else {
        setTimetableSlots([]);
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
      DataCache.invalidate('subjects');
      setAssigning(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to assign teacher');
    } finally {
      setSavingId(null);
    }
  };

  const totalClasses = classes.length;
  const assignedTeacherIds = new Set(
    classes.map((c) => c.classSubjectTeachers?.[0]?.teacherId).filter(Boolean)
  );
  const assignedCount = assignedTeacherIds.size;
  const unassignedCount = classes.filter((c) => !c.classSubjectTeachers?.[0]?.teacherId).length;
  const weeklyPeriods = timetableSlots.length;
  const coveragePct = totalClasses > 0 ? Math.round(((totalClasses - unassignedCount) / totalClasses) * 100) : 0;

  const slotsByDay: Record<string, any[]> = {};
  DAYS.forEach((d) => { slotsByDay[d] = []; });
  timetableSlots.forEach((slot) => {
    const day = slot.day;
    if (slotsByDay[day]) slotsByDay[day].push(slot);
    else slotsByDay[day] = [slot];
  });
  const hasAnySlots = timetableSlots.length > 0;
  const activeDays = DAYS.filter((d) => slotsByDay[d].length > 0);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
        <PageHeader title={`${name} Details`} icon={<BookOpen className="w-5 h-5 text-white" />} />
        <div className="flex items-center justify-center flex-1">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title={`${name} • Curriculum & Faculty`}
        icon={<BookOpen className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/subjects')}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Subjects</span>
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5B21B6]" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">

          {/* 4 Dashboard Glossy Pastel KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Classes</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">{totalClasses}</p>
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
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Teachers Assigned</p>
                  <p className="text-2xl font-black text-[#065F46] leading-tight">{assignedCount}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shrink-0">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Unassigned</p>
                  <p className="text-2xl font-black text-[#9A3412] leading-tight">{unassignedCount}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Weekly Periods</p>
                  <p className="text-2xl font-black text-[#4C1D95] leading-tight">{weeklyPeriods}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Class Assignments Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFEAFE] border border-[#DDD6FE] text-[#5B21B6] flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#1E1B4B]">Class-wise Faculty Assignment</h2>
                  <p className="text-xs text-slate-500 font-medium">Assign or update teachers for each class &amp; section</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#5B21B6] bg-[#EFEAFE] px-3 py-1 rounded-full border border-[#DDD6FE]">
                {totalClasses} {totalClasses === 1 ? 'Class' : 'Classes'}
              </span>
            </div>

            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[22px] border border-dashed border-[#DDD7F3] text-center">
                <School className="w-12 h-12 text-indigo-200 mb-3" />
                <h3 className="text-base font-black text-[#1E1B4B]">No classes mapped yet</h3>
                <p className="text-xs text-slate-500 mt-1">This subject hasn't been added to any class yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {classes.map((cls: any) => {
                  const currentTeacher = cls.classSubjectTeachers?.[0]?.teacher?.user?.name;
                  const currentTeacherId = cls.classSubjectTeachers?.[0]?.teacherId || '';
                  const isAssigningThis = assigning === cls.id;
                  const className = cls.class ? `${cls.class.name} - ${cls.class.section}` : 'N/A';
                  const classShort = cls.class ? `${cls.class.name}` : '?';
                  const saving = savingId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] hover:shadow-[0_12px_28px_-8px_rgba(91,33,182,0.14)] transition-all p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#CEC0FF] flex flex-col items-center justify-center text-[#5B21B6] shadow-2xs shrink-0">
                            <span className="text-[8px] font-black uppercase opacity-70 leading-none">Class</span>
                            <span className="text-base font-black leading-tight mt-0.5">{classShort}</span>
                          </div>
                          <div>
                            <h3 className="font-black text-[#1E1B4B] text-base leading-tight">{className}</h3>
                            <p className="text-xs text-slate-400 font-bold mt-0.5 font-mono">{cls.code || name}</p>
                          </div>
                        </div>

                        {currentTeacher ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Assigned
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <UserX className="w-3 h-3" /> Unassigned
                          </span>
                        )}
                      </div>

                      {!isAssigningThis ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FF] border border-indigo-100/80">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#EFEAFE] text-[#5B21B6] flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">Teacher</p>
                              <p className={`text-xs font-extrabold truncate ${currentTeacher ? 'text-[#1E1B4B]' : 'text-slate-400 italic'}`}>
                                {currentTeacher || 'Not Assigned'}
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssigning(cls.id);
                                setSelectedTeacher((prev) => ({ ...prev, [cls.id]: currentTeacherId }));
                              }}
                              className="ml-2 p-2 text-[#5B21B6] hover:bg-[#EFEAFE] rounded-lg transition-colors border border-indigo-100 shrink-0 cursor-pointer"
                              title="Change teacher"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#F4F2FC] border border-[#DDD6FE] space-y-2.5">
                          <p className="text-[10px] font-black text-[#5B21B6] uppercase tracking-wider">Select Faculty</p>
                          <select
                            className="w-full px-3 py-2 text-xs font-bold border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-800 cursor-pointer"
                            value={selectedTeacher[cls.id] || ''}
                            onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [cls.id]: e.target.value }))}
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
                              type="button"
                              onClick={() => handleAssignTeacher(cls)}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white text-xs font-extrabold rounded-xl transition disabled:opacity-60 cursor-pointer"
                            >
                              {saving ? <LoadingSpinner size="sm" /> : <><Check className="w-3.5 h-3.5" /> Save</>}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssigning(null)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-indigo-100 text-slate-600 text-xs font-extrabold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Weekly Timetable */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFEAFE] border border-[#DDD6FE] text-[#5B21B6] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#1E1B4B]">Weekly Timetable Schedule</h2>
                  <p className="text-xs text-slate-500 font-medium">Scheduled periods for {name} across classes</p>
                </div>
              </div>
              {weeklyPeriods > 0 && (
                <span className="text-xs font-extrabold text-[#5B21B6] bg-[#EFEAFE] px-3 py-1 rounded-full border border-[#DDD6FE]">
                  {weeklyPeriods} {weeklyPeriods === 1 ? 'period' : 'periods'}/week
                </span>
              )}
            </div>

            {!hasAnySlots ? (
              <div className="flex flex-col items-center justify-center py-14 bg-white rounded-[22px] border border-dashed border-[#DDD7F3] text-center">
                <Calendar className="w-12 h-12 text-indigo-200 mb-3" />
                <h3 className="text-base font-black text-[#1E1B4B]">No timetable slots configured</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  This subject hasn't been scheduled in the timetable yet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/timetable')}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-extrabold rounded-xl hover:opacity-95 transition cursor-pointer"
                >
                  Open Timetable <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] overflow-hidden divide-y divide-indigo-50">
                {activeDays.map((day) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-stretch">
                    <div className="sm:w-28 shrink-0 flex items-center justify-center bg-[#FAF9FF] sm:border-r border-indigo-100 px-3 py-2.5 sm:py-4">
                      <span className="text-xs font-black text-[#5B21B6] uppercase tracking-wider">{day.slice(0, 3)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 items-center">
                      {slotsByDay[day]
                        .sort((a, b) => a.periodNumber - b.periodNumber)
                        .map((slot: any, si: number) => (
                          <div
                            key={slot.id || si}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#EFEAFE]/70 border border-[#DDD6FE] rounded-xl"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#5B21B6] shrink-0" />
                            <div>
                              <p className="text-xs font-black text-[#1E1B4B]">
                                {slot.startTime} – {slot.endTime}
                              </p>
                              <p className="text-[10px] text-[#5B21B6] font-bold">
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
            )}
          </section>

          {/* Coverage Overview */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#1E1B4B]">Coverage Overview</h2>
                <p className="text-xs text-slate-500 font-medium">Teacher assignment completion summary</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 bg-white rounded-[20px] border border-[#DDD7F3] shadow-xs p-5">
                <div className="flex justify-between items-end mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Assignment Coverage</p>
                  <p className="text-2xl font-black text-[#1E1B4B]">{coveragePct}%</p>
                </div>
                <div className="w-full h-3 bg-indigo-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Assigned: {totalClasses - unassignedCount}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-amber-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Pending: {unassignedCount}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unique Teachers</p>
                  <p className="text-3xl font-black text-[#5B21B6] mt-1">{assignedCount}</p>
                </div>
                <div className="flex -space-x-2 mt-3">
                  {Array.from(assignedTeacherIds).slice(0, 5).map((tid: any, i) => {
                    const t = teachers.find((te: any) => te.id === tid);
                    const initials = t?.user?.name?.substring(0, 2)?.toUpperCase() || '?';
                    return (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-xs"
                        title={t?.user?.name}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {assignedCount > 5 && (
                    <div className="w-8 h-8 rounded-full bg-[#EFEAFE] border-2 border-white flex items-center justify-center text-[#5B21B6] text-[9px] font-black shadow-xs">
                      +{assignedCount - 5}
                    </div>
                  )}
                  {assignedCount === 0 && (
                    <p className="text-xs text-slate-400 font-semibold italic">No teachers assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SubjectDetailsPage;
