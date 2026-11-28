import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Search, Calendar, Users, ListFilter, CheckCircle2, XCircle,
  CheckCheck, Save, Percent, Eye, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { DataCache } from '../../services/dataCache';
import { getPhotoUrl } from '../../utils/photo';
import { AttendanceNavTabs } from './AttendanceNavTabs';

const formatLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const AttendanceMarkingPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(() => formatLocalYMD(new Date()));

  const [activeClassId, setActiveClassId] = useState('');
  const [activeClassLabel, setActiveClassLabel] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  const fetchClasses = async () => {
    try {
      const data = await DataCache.get('classes');
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      if (list.length > 0) {
        setSelectedClassName('All Classes');
        setSelectedSection('All Sections');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassName && selectedClassName !== 'All Classes') {
      const sections = classes.filter((c) => c.name === selectedClassName).map((c) => c.section);
      if (sections.length > 0 && !sections.includes(selectedSection)) {
        setSelectedSection(sections[0]);
      }
    } else if (selectedClassName === 'All Classes') {
      setSelectedSection('All Sections');
    }
  }, [selectedClassName, classes]);

  const loadStudentRoster = async () => {
    let classId = 'ALL';
    let label = 'All Classes';
    if (selectedClassName && selectedClassName !== 'All Classes') {
      const matchedClass = classes.find((c) => c.name === selectedClassName && c.section === selectedSection);
      if (!matchedClass) {
        toast.error('No matching class-section found.');
        return;
      }
      classId = matchedClass.id;
      label = `${matchedClass.name} - ${matchedClass.section}`;
    }

    setActiveClassId(classId);
    setActiveClassLabel(label);
    setLoading(true);
    setStatusFilter('ALL');

    try {
      const attendancePromise = api.get('/api/attendance/class', { params: { classId, date } });
      const studentsPromise =
        classId === 'ALL'
          ? api.get('/api/students', { params: { limit: 2000 } })
          : api.get(`/api/classes/${classId}/students`);

      const [attendanceRes, studentsRes]: any = await Promise.all([attendancePromise, studentsPromise]);
      const attendanceList = extractArray(attendanceRes);
      const studentList = extractArray(studentsRes);

      setStudents(studentList);

      const initialRecords: { [studentId: string]: string } = {};
      studentList.forEach((s: any) => {
        const record = attendanceList.find((a: any) => a.studentId === s.id);
        initialRecords[s.id] = record?.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';
      });
      setRecords(initialRecords);
    } catch (e) {
      toast.error('Failed to load student roster');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllAs = (status: string) => {
    const newRecords = { ...records };
    students.forEach((s) => {
      newRecords[s.id] = status;
    });
    setRecords(newRecords);
    toast.success(`Marked all ${students.length} students as ${status === 'PRESENT' ? 'Present' : 'Absent'}`);
  };

  const handleSubmit = async () => {
    if (!activeClassId || saving) return;

    const payload = {
      classId: activeClassId,
      date,
      records: Object.keys(records).map((studentId) => ({
        studentId,
        status: records[studentId],
      })),
    };

    setSaving(true);
    const toastId = toast.loading('Saving student attendance...');
    try {
      await api.post('/api/attendance/bulk', payload);
      toast.success(`Attendance saved for ${payload.records.length} students!`, { id: toastId });
    } catch (e: any) {
      console.error('Failed to save attendance:', e);
      toast.error(e?.response?.data?.message || 'Failed to save attendance. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const uniqueClassNames = ['All Classes', ...Array.from(new Set(classes.map((c) => c.name)))];
  const availableSections =
    selectedClassName === 'All Classes'
      ? ['All Sections']
      : classes.filter((c) => c.name === selectedClassName).map((c) => c.section);

  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    students.forEach((s) => {
      if (records[s.id] === 'ABSENT') absent++;
      else present++;
    });
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, rate };
  }, [students, records]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const nameMatch = (student.user?.name || '').toLowerCase().includes(q);
      const rollMatch = (student.rollNo || '').toLowerCase().includes(q);
      if (q && !nameMatch && !rollMatch) return false;

      const st = records[student.id] || 'PRESENT';
      if (statusFilter === 'PRESENT') return st === 'PRESENT';
      if (statusFilter === 'ABSENT') return st === 'ABSENT';
      return true;
    });
  }, [students, searchQuery, statusFilter, records]);

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Mark Student Attendance"
        icon={<Calendar className="w-5 h-5 text-white" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className={`w-full max-w-7xl mx-auto space-y-5 ${students.length > 0 && activeClassId ? 'pb-24' : 'pb-8'}`}>

          {/* Top Navigation & Info Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AttendanceNavTabs />
            {activeClassId && (
              <span className="px-3.5 py-1.5 rounded-full bg-[#EFEAFE] border border-[#DDD6FE] text-[#5B21B6] text-xs font-extrabold">
                Active Register: {activeClassLabel} &bull; {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Filter Selector Card */}
          <div className="bg-white border border-indigo-100/80 rounded-[20px] p-4 sm:p-5 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-[10.5px] uppercase font-extrabold text-[#5B21B6] tracking-wider flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5" /> Class
              </label>
              <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                {uniqueClassNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[10.5px] uppercase font-extrabold text-[#5B21B6] tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[10.5px] uppercase font-extrabold text-[#5B21B6] tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="date"
                value={date}
                max={formatLocalYMD(new Date())}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={loadStudentRoster}
                disabled={loading}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Eye className="w-4 h-4" />
                <span>{loading ? 'LOADING...' : 'VIEW'}</span>
              </button>
            </div>
          </div>

          {activeClassId ? (
            loading ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white rounded-[22px] border border-indigo-100/80 shadow-xs">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Loading student register...</p>
              </div>
            ) : (
              <>
                {/* 4 Dashboard Pastel KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Strength</p>
                        <p className="text-2xl font-black text-slate-900 leading-tight">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Present Today</p>
                        <p className="text-2xl font-black text-[#065F46] leading-tight">{stats.present}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white shadow-md shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Absent Today</p>
                        <p className="text-2xl font-black text-[#991B1B] leading-tight">{stats.absent}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] px-4 py-3.5 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Attendance Rate</p>
                        <p className="text-2xl font-black text-[#4C1D95] leading-tight">{stats.rate}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Register Table Container */}
                <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
                  {/* Toolbar */}
                  <div className="px-4 sm:px-5 py-3.5 border-b border-indigo-100/80 bg-[#FAF9FF] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name or Roll No..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-indigo-100 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[
                          { key: 'ALL', label: `All (${stats.total})`, active: 'bg-[#5B21B6] text-white', idle: 'bg-white text-slate-600 border-indigo-100' },
                          { key: 'PRESENT', label: `Present (${stats.present})`, active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                          { key: 'ABSENT', label: `Absent (${stats.absent})`, active: 'bg-rose-600 text-white', idle: 'bg-rose-50 text-rose-700 border-rose-200' },
                        ].map((chip) => (
                          <button
                            key={chip.key}
                            type="button"
                            onClick={() => setStatusFilter(chip.key as any)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              statusFilter === chip.key ? `${chip.active} border-transparent shadow-xs` : chip.idle
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => markAllAs('PRESENT')}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-indigo-100 hover:border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark All Present</span>
                      </button>
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">No students match your filter.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs student-grid-table">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                            <th className="py-3.5 px-3 w-14 text-center border-r border-white/20 !text-white">#</th>
                            <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white whitespace-nowrap">Student ID / Roll</th>
                            <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Student Name</th>
                            <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Mark Attendance</th>
                            <th className="py-3.5 px-4 text-center w-32 !text-white">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, idx) => {
                            const isPresent = records[student.id] !== 'ABSENT';
                            const rowBorderBottom = idx === filteredStudents.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                            const rollCode = student.rollNo || student.admissionNo || student.id.substring(0, 8).toUpperCase();
                            const photo = student.user?.photoUrl || student.photoUrl;

                            return (
                              <tr
                                key={student.id}
                                className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white"
                              >
                                <td className={`py-2.5 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  {idx + 1}
                                </td>

                                <td className={`py-2.5 px-4 border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE]/80 font-mono">
                                    {rollCode}
                                  </span>
                                </td>

                                <td className={`py-2.5 px-5 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center overflow-hidden shrink-0">
                                      {photo ? (
                                        <img
                                          src={getPhotoUrl(photo)}
                                          alt={student.user?.name || 'Student'}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-[11px] bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]">
                                          {(student.user?.name || 'ST').slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-extrabold text-[#1E1B4B] text-xs sm:text-[13px] uppercase tracking-tight">
                                      {student.user?.name}
                                    </span>
                                  </div>
                                </td>

                                <td className={`py-2.5 px-5 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                                  <div className="inline-flex items-center bg-[#F3F5FC] p-1 rounded-xl border border-indigo-100 gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isPresent
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Present</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        !isPresent
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                                      }`}
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Absent</span>
                                    </button>
                                  </div>
                                </td>

                                <td className={`py-2.5 px-4 text-center ${rowBorderBottom}`}>
                                  <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border ${
                                      isPresent
                                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {isPresent ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    <span>{isPresent ? 'Present' : 'Absent'}</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )
          ) : (
            /* Clean Empty State Card */
            <div className="bg-white border border-[#DDD7F3] rounded-[22px] p-12 sm:p-16 text-center shadow-[0_12px_32px_-6px_rgba(91,33,182,0.08)] flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#CEC0FF] flex items-center justify-center mb-5 shadow-sm">
                <ClipboardList className="w-8 h-8 text-[#5B21B6]" />
              </div>
              <h3 className="text-xl font-black text-[#1E1B4B] mb-2">Select Class &amp; Date to Mark Attendance</h3>
              <p className="font-medium text-slate-500 text-xs sm:text-sm max-w-md mb-5">
                Choose a Class, Section, and Date above, then click <strong className="text-[#5B21B6]">VIEW</strong> to open the interactive student attendance register.
              </p>
              <button
                type="button"
                onClick={loadStudentRoster}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-extrabold shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Load {selectedClassName || 'All Classes'} Now</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Unified Sticky Save Action Bar */}
      {students.length > 0 && activeClassId && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-0 left-0 right-0 lg:left-[224px] z-40 bg-white/95 backdrop-blur-xl border-t border-indigo-100 px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(91,33,182,0.08)]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EFEAFE] border border-[#DDD6FE] flex items-center justify-center text-[#5B21B6] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider">
                  {activeClassLabel} &bull; {stats.total} Students
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {stats.present} Present &bull; {stats.absent} Absent ({stats.rate}% Attendance)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => markAllAs('PRESENT')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Mark All Present</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AttendanceMarkingPage;
