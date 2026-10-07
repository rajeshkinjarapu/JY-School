import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { getPhotoUrl } from '../../utils/photo';
import {
  CalendarCheck, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Save, UserCheck, FileText,
  Search, CheckCheck, User
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
        icon={<CalendarCheck className="w-5 h-5 text-indigo-600" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          <div className="flex justify-end">
        {/* Month Navigator */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <button onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-black text-slate-900">{MONTHS[selectedMonth]}</span>
            <span className="text-xs font-bold text-slate-500">{selectedYear}</span>
          </div>
          <button onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
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
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Staff</p>
                <p className="text-3xl font-extrabold text-slate-800">{adminStats.total}</p>
              </div>
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 transition-transform group-hover:scale-110">
                <UserCheck className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
                <p className="text-3xl font-extrabold text-emerald-700">{adminStats.present}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</p>
                <p className="text-3xl font-extrabold text-rose-700">{adminStats.absent}</p>
              </div>
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110">
                <XCircle className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">On Leave</p>
                <p className="text-3xl font-extrabold text-orange-700">{adminStats.leave}</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
                <AlertCircle className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
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
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                <CalendarCheck className="w-5 h-5 text-indigo-500" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  max={today.toISOString().split('T')[0]}
                  className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer text-slate-700 w-[130px]" />
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-green-50 text-green-700 text-sm font-bold border border-green-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-200 shadow-sm">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {/* Teacher Table View */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-5">Staff Member</th>
                    <th className="px-6 py-5">Employee ID</th>
                    <th className="px-6 py-5 min-w-[300px]">Attendance Status</th>
                    <th className="px-6 py-5 min-w-[200px]">Note (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map(t => {
                    const status = attendanceMap[t.id] || 'PRESENT';
                    const sc = STATUS_COLORS[status] || STATUS_COLORS.PRESENT;
                    
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {t.user.photoUrl ? (
                              <img src={getPhotoUrl(t.user.photoUrl)} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-indigo-600 bg-indigo-50 font-bold border border-indigo-100 shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <p className="font-bold text-slate-800 text-sm">{t.user.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                            {t.employeeId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200/60 max-w-[320px]">
                            {STATUS_OPTIONS.map(s => {
                              const isSelected = attendanceMap[t.id] === s || (!attendanceMap[t.id] && s === 'PRESENT');
                              const btnColor = STATUS_COLORS[s] || STATUS_COLORS.PRESENT;
                              return (
                                <button key={s}
                                  onClick={() => setAttendanceMap(m => ({ ...m, [t.id]: s }))}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center"
                                  style={{
                                    background: isSelected ? btnColor.bg : 'transparent',
                                    color: isSelected ? btnColor.text : '#94a3b8',
                                    borderColor: isSelected ? btnColor.text + '40' : 'transparent',
                                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.02)' : 'none'
                                  }}>
                                  {s === 'HALF_DAY' ? 'HALF' : s}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text"
                            placeholder="Add a note..."
                            value={noteMap[t.id] || ''}
                            onChange={(e) => setNoteMap(m => ({...m, [t.id]: e.target.value}))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-400 transition-all"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">No staff members found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Bottom Bar for Admin Actions */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] p-4">
            <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-base font-extrabold text-slate-800">
                    {filteredTeachers.length} Staff Members
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Ready to save attendance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleMarkAllPresent}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                >
                  <CheckCheck className="w-5 h-5" /> 
                  <span className="hidden sm:inline">Mark All</span> Present
                </button>
                <button 
                  onClick={handleBulkSave} 
                  disabled={saving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER VIEW — Calendar */}
      {isTeacher && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: summary.present, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Absent', value: summary.absent, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
              { label: 'Half Day', value: summary.halfDay, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
              { label: 'Attendance Rate', value: `${summary.rate}%`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            ].map((stat, i) => (
              <div key={i} className={`rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md ${stat.bg}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${stat.color}`}>{stat.label}</p>
                <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Attendance Records Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm h-fit">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Monthly Attendance Log</h3>
                  <p className="text-sm font-semibold text-slate-400 mt-1">{MONTHS[selectedMonth]} {selectedYear} · {myRecords.length} records</p>
                </div>
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-100">
                  {summary.rate}% Rate
                </span>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {myRecords.length > 0 ? (
                  myRecords.map((r: any) => {
                    const sc = STATUS_COLORS[r.status] || STATUS_COLORS.PRESENT;
                    const StatusIcon = sc.icon;
                    const dObj = new Date(r.date);
                    return (
                      <div key={r.id || r.date} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center bg-slate-50 text-slate-700 border border-slate-100 font-black shrink-0 shadow-sm">
                            <span className="text-[10px] uppercase text-indigo-500 font-bold leading-none">{dObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="text-lg font-extrabold leading-none mt-1">{dObj.getDate()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {dObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </p>
                            {r.note && <p className="text-xs font-semibold text-slate-400 mt-0.5">{r.note}</p>}
                          </div>
                        </div>

                        <span 
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 border"
                          style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.text + '30' }}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {r.status === 'HALF_DAY' ? 'Half Day' : r.status}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center">
                    <CalendarCheck className="w-12 h-12 text-slate-200 mb-3" />
                    No attendance records logged for {MONTHS[selectedMonth]} {selectedYear}.
                  </div>
                )}
              </div>
            </div>

            {/* History Logs */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm h-fit">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">My Requests History</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {historyLogs.map((log: any, idx) => (
                  <div key={idx} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                        log.logType === 'GATEPASS' ? 'bg-orange-500' : 
                        log.logType === 'LEAVE' ? 'bg-indigo-500' : 'bg-teal-500'
                      }`}>
                        {log.logType === 'GATEPASS' ? <FileText className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {log.logType === 'GATEPASS' ? `Gatepass to ${log.destination}` : `${log.logType} Request`}
                        </p>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-[250px] mt-0.5">
                          {log.reason}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                        log.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {log.status}
                      </span>
                      {log.logType !== 'GATEPASS' && (
                        <span className="text-[11px] text-slate-400 font-bold mt-1">
                          {new Date(log.startDate).toLocaleDateString()} {log.endDate && `- ${new Date(log.endDate).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {historyLogs.length === 0 && (
                  <div className="p-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center">
                    <FileText className="w-12 h-12 text-slate-200 mb-3" />
                    No request history found.
                  </div>
                )}
              </div>
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
