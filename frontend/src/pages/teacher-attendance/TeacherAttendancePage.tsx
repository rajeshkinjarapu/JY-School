import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { getPhotoUrl } from '../../utils/photo';
import {
  CalendarCheck, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Save, UserCheck, FileText,
  Search, CheckCheck
} from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';

interface Teacher {
  id: string;
  employeeId: string;
  user: { id: string; name: string; email: string; photoUrl?: string };
}
interface AttRecord { id: string; teacherId: string; date: string; status: string; note?: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'];
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  PRESENT:  { bg: '#f0fdf4', text: '#16a34a', icon: CheckCircle2 },
  ABSENT:   { bg: '#fef2f2', text: '#dc2626', icon: XCircle      },
  LEAVE:    { bg: '#fff7ed', text: '#ea580c', icon: AlertCircle  },
  HALF_DAY: { bg: '#f0f9ff', text: '#0284c7', icon: CalendarCheck },
};

const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [myRecords, setMyRecords] = useState<AttRecord[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const adminStats = useMemo(() => {
    let present = 0, absent = 0, leave = 0, halfDay = 0;
    teachers.forEach(t => {
      const status = attendanceMap[t.id] || 'PRESENT';
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LEAVE') leave++;
      else if (status === 'HALF_DAY') halfDay++;
    });
    return { present, absent, leave, halfDay, total: teachers.length };
  }, [teachers, attendanceMap]);

  const handleMarkAllPresent = () => {
    const newMap = { ...attendanceMap };
    filteredTeachers.forEach(t => {
      newMap[t.id] = 'PRESENT';
    });
    setAttendanceMap(newMap);
  };
  // Fetch teachers (Admin only)
  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 200 } });
      setTeachers(res.data?.data || []);
    } catch {}
  };

  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Fetch attendance records for selected date (Admin) or month (Teacher)
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res: any = await api.get('/api/teacher-attendance', {
          params: { month: selectedMonth + 1, year: selectedYear }
        });
        setRecords(res.data?.data || []);

        // Build attendance map for the selected date
        const dateRecords = (res.data?.data || []).filter((r: AttRecord) =>
          new Date(r.date).toISOString().split('T')[0] === selectedDate
        );
        const map: Record<string, string> = {};
        const notes: Record<string, string> = {};
        dateRecords.forEach((r: AttRecord) => {
          map[r.teacherId] = r.status;
          notes[r.teacherId] = r.note || '';
        });
        setAttendanceMap(map);
        setNoteMap(notes);
      } else {
        const [attRes, leaveRes, gpRes]: any = await Promise.all([
          api.get('/api/teacher-attendance', { params: { month: selectedMonth + 1, year: selectedYear } }),
          api.get('/api/leave/my?limit=5000'),
          api.get('/api/gate-pass?limit=5000')
        ]);
        setMyRecords(attRes.data?.data || []);
        
        // Combine history
        const leaves = (leaveRes.data?.data || []).map((l: any) => ({ ...l, logType: l.type }));
        const passes = (gpRes.data?.data || []).map((gp: any) => ({ ...gp, logType: 'GATEPASS' }));
        const combined = [...leaves, ...passes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryLogs(combined);

        // Summary
        const arr = attRes.data?.data || [];
        const present = arr.filter((r: AttRecord) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absent = arr.filter((r: AttRecord) => r.status === 'ABSENT').length;
        const halfDay = arr.filter((r: AttRecord) => r.status === 'HALF_DAY').length;
        setSummary({ present, absent, halfDay, total: arr.length, rate: arr.length > 0 ? Math.round((present / arr.length) * 100) : 0 });
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAdmin) fetchTeachers();
  }, []);

  useEffect(() => { fetchRecords(); }, [selectedMonth, selectedYear, selectedDate, isAdmin]);

  const handleBulkSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const recs = teachers.map(t => ({
        teacherId: t.id,
        status: attendanceMap[t.id] || 'PRESENT',
        note: noteMap[t.id] || '',
      }));
      await api.post('/api/teacher-attendance/bulk-mark', { date: selectedDate, records: recs });
      setSuccessMsg('Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save attendance');
    } finally { setSaving(false); }
  };

  // Build calendar for teacher view
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();

  const navigateMonth = (dir: number) => {
    const d = new Date(selectedYear, selectedMonth + dir, 1);
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen animate-fade" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={isAdmin ? "Staff Attendance Manager" : "My Attendance"}
        icon={<CalendarCheck className="w-6 h-6" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          <div className="flex justify-end">
        {/* Month Navigator */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-black text-gray-900">{MONTHS[selectedMonth]}</span>
            <span className="text-xs font-bold text-gray-500">{selectedYear}</span>
          </div>
          <button onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
            disabled={selectedMonth === today.getMonth() && selectedYear === today.getFullYear()}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ADMIN VIEW */}
      {isAdmin && (
        <div className="space-y-6 pb-24">
          
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Staff</p>
                <p className="text-2xl font-black text-slate-800">{adminStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
                <p className="text-2xl font-black text-emerald-700">{adminStats.present}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-rose-50 p-5 rounded-[1.5rem] border border-rose-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</p>
                <p className="text-2xl font-black text-rose-700">{adminStats.absent}</p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-orange-50 p-5 rounded-[1.5rem] border border-orange-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">On Leave</p>
                <p className="text-2xl font-black text-orange-700">{adminStats.leave}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-[1.5rem] p-2 md:p-4 border border-slate-100 shadow-sm">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff by name or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 placeholder-slate-400" 
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <CalendarCheck className="w-5 h-5 text-violet-500" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  max={today.toISOString().split('T')[0]}
                  className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer text-slate-700" />
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {/* Teacher Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredTeachers.map(t => {
              const status = attendanceMap[t.id] || 'PRESENT';
              const sc = STATUS_COLORS[status] || STATUS_COLORS.PRESENT;
              
              return (
                <div key={t.id} className="bg-white p-4 rounded-[1.5rem] border shadow-sm transition-all hover:shadow-md flex flex-col gap-4" style={{ borderColor: sc.bg !== 'transparent' ? sc.bg : '#f1f5f9' }}>
                  <div className="flex items-center gap-4">
                    {t.user.photoUrl ? (
                      <img src={getPhotoUrl(t.user.photoUrl)} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        {t.user.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{t.user.name}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{t.employeeId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100">
                    {STATUS_OPTIONS.map(s => {
                      const isSelected = attendanceMap[t.id] === s || (!attendanceMap[t.id] && s === 'PRESENT');
                      const btnColor = STATUS_COLORS[s] || STATUS_COLORS.PRESENT;
                      return (
                        <button key={s}
                          onClick={() => setAttendanceMap(m => ({ ...m, [t.id]: s }))}
                          className="flex-1 flex justify-center py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer border"
                          style={{
                            background: isSelected ? btnColor.bg : 'transparent',
                            color: isSelected ? btnColor.text : '#94a3b8',
                            borderColor: isSelected ? btnColor.text + '40' : 'transparent',
                            boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.02)' : 'none'
                          }}>
                          {s === 'HALF_DAY' ? 'Half' : s === 'PRESENT' ? 'P' : s === 'ABSENT' ? 'A' : 'L'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No staff members found matching your search.</p>
            </div>
          )}

          {/* Sticky Bottom Bar for Admin Actions */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] p-4 animate-slide-up">
            <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-extrabold text-slate-800">
                    {filteredTeachers.length} Staff Members
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Ready to save attendance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleMarkAllPresent}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Mark All</span> Present
                </button>
                <button 
                  onClick={handleBulkSave} 
                  disabled={saving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER VIEW — Calendar */}
      {isTeacher && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: summary.present, color: 'text-emerald-600', bg: 'bg-emerald-50/60 border-emerald-100' },
              { label: 'Absent', value: summary.absent, color: 'text-rose-600', bg: 'bg-rose-50/60 border-rose-100' },
              { label: 'Half Day', value: summary.halfDay, color: 'text-sky-600', bg: 'bg-sky-50/60 border-sky-100' },
              { label: 'Attendance %', value: `${summary.rate}%`, color: 'text-violet-600', bg: 'bg-violet-50/60 border-violet-100' },
            ].map((stat, i) => (
              <div key={i} className={`rounded-[1.25rem] p-4 sm:p-5 border shadow-sm transition-all hover:-translate-y-0.5 ${stat.bg}`}>
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${stat.color}`}>{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly Attendance Records Breakdown */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Monthly Attendance Log</h3>
                <p className="text-xs font-semibold text-slate-400">{MONTHS[selectedMonth]} {selectedYear} · {myRecords.length} records</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                {summary.rate}% Attendance
              </span>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[360px] overflow-y-auto">
              {myRecords.length > 0 ? (
                myRecords.map((r: any) => {
                  const sc = STATUS_COLORS[r.status] || STATUS_COLORS.PRESENT;
                  const StatusIcon = sc.icon;
                  const dObj = new Date(r.date);
                  return (
                    <div key={r.id || r.date} className="p-3.5 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black shrink-0">
                          <span className="text-[10px] uppercase text-indigo-500 font-bold leading-none">{dObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-sm font-extrabold leading-none mt-0.5">{dObj.getDate()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
                            {dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {r.note && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{r.note}</p>}
                        </div>
                      </div>

                      <span 
                        className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {r.status === 'HALF_DAY' ? 'Half Day' : r.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No attendance records logged for {MONTHS[selectedMonth]} {selectedYear}.
                </div>
              )}
            </div>
          </div>

          {/* History Logs */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden mt-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800">My Requests History</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {historyLogs.map((log: any, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      log.logType === 'GATEPASS' ? 'bg-orange-500' : 
                      log.logType === 'LEAVE' ? 'bg-blue-500' : 'bg-teal-500'
                    }`}>
                      {log.logType === 'GATEPASS' ? <FileText className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {log.logType === 'GATEPASS' ? `Gatepass to ${log.destination}` : `${log.logType} Request`}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-md">
                        {log.reason}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                      log.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      log.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {log.status}
                    </span>
                    {log.logType !== 'GATEPASS' && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(log.startDate).toLocaleDateString()} {log.endDate && `- ${new Date(log.endDate).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {historyLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  No request history found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendancePage;

