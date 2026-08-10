import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import {
  Home, Calendar, BarChart2, ClipboardList, MoreHorizontal,
  BookOpen, Clock, Award, CreditCard, Download, GraduationCap,
  FileText, Image, CalendarDays, PenTool, Megaphone, Bell,
  LogOut, ChevronRight, TrendingUp, CheckCircle, AlertCircle,
  User, BookMarked, Wallet, UserCheck, Star, Zap
} from 'lucide-react';

/* ─── Types ─────────────────────────────────── */
interface BottomNavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string; strokeWidth?: number; color?: string; style?: React.CSSProperties }>;
  color: string;
}

interface ModuleCard {
  id: string;
  label: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  glow: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

/* ─── Bottom Nav Config ──────────────────────── */
const BOTTOM_NAV: BottomNavItem[] = [
  { id: 'home',       label: 'Home',       icon: Home,          color: '#6366f1' },
  { id: 'timetable',  label: 'Timetable',  icon: Calendar,      color: '#06b6d4' },
  { id: 'attendance', label: 'Attendance', icon: BarChart2,      color: '#10b981' },
  { id: 'exams',      label: 'Exams',      icon: ClipboardList, color: '#f59e0b' },
  { id: 'more',       label: 'More',       icon: MoreHorizontal, color: '#8b5cf6' },
];

/* ─── Module Cards Config ─────────────────────── */
const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'timetable', label: "Today's Timetable", sub: 'Current periods',
    icon: Calendar, gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/30',
    route: '/timetable',
  },
  {
    id: 'homework', label: 'Homework', sub: 'Pending & completed',
    icon: BookOpen, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30',
    route: '/homework',
  },
  {
    id: 'attendance', label: 'Attendance', sub: 'Monthly progress',
    icon: BarChart2, gradient: 'from-indigo-500 to-violet-600', glow: 'shadow-indigo-500/30',
    route: '/attendance',
  },
  {
    id: 'exams', label: 'Examinations', sub: 'Results & hall ticket',
    icon: ClipboardList, gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/30',
    route: '/exams',
  },
  {
    id: 'fees', label: 'Fees', sub: 'Pay & download receipt',
    icon: Wallet, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30',
    route: '/finance',
  },
  {
    id: 'study', label: 'Study Material', sub: 'PDFs, videos & notes',
    icon: BookMarked, gradient: 'from-purple-500 to-fuchsia-600', glow: 'shadow-purple-500/30',
    route: '/homework',
  },
  {
    id: 'downloads', label: 'Downloads', sub: 'Papers, syllabus & more',
    icon: Download, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30',
    route: '/exams?tab=question-papers',
  },
  {
    id: 'certificates', label: 'Certificates', sub: 'Bonafide, TC, Study',
    icon: GraduationCap, gradient: 'from-green-500 to-emerald-600', glow: 'shadow-green-500/30',
    route: '/finance',
  },
  {
    id: 'leave', label: 'Apply Leave', sub: 'Request & status',
    icon: UserCheck, gradient: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/30',
    route: '/leave/request-log',
  },
  {
    id: 'gallery', label: 'Gallery', sub: 'Events & photos',
    icon: Image, gradient: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/30',
    route: '/announcements',
  },
  {
    id: 'calendar', label: 'Academic Calendar', sub: 'Holidays & exam dates',
    icon: CalendarDays, gradient: 'from-teal-500 to-cyan-600', glow: 'shadow-teal-500/30',
    route: '/timetable',
  },
  {
    id: 'classtest', label: 'Class Test', sub: 'Upcoming & past marks',
    icon: PenTool, gradient: 'from-violet-500 to-purple-700', glow: 'shadow-violet-500/30',
    route: '/exams?tab=slip-tests',
  },
  {
    id: 'notice', label: 'Notice Board', sub: 'Announcements & circulars',
    icon: Megaphone, gradient: 'from-yellow-500 to-amber-600', glow: 'shadow-yellow-500/30',
    route: '/announcements',
  },
];

/* ─── Main Component ──────────────────────────── */
export const StudentMobileDashboard: React.FC<{ data: any }> = ({ data }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const [schoolName, setSchoolName] = useState('JY School');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEmoji = h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';

  useEffect(() => {
    api.get('/api/settings').then((r: any) => {
      if (r.data?.schoolName) setSchoolName(r.data.schoolName);
    }).catch(() => {});
  }, []);

  const attPct = data?.attendancePercentage || 0;
  const feeStatus = data?.feeStatus?.status || 'PAID';
  const attColor = attPct >= 80 ? '#10b981' : attPct >= 60 ? '#f59e0b' : '#f43f5e';

  const handleTabClick = (tabId: string) => {
    if (tabId === 'more') {
      setShowMoreMenu(v => !v);
      return;
    }
    setShowMoreMenu(false);
    setActiveTab(tabId);
    if (tabId === 'timetable')  navigate('/timetable');
    if (tabId === 'attendance') navigate('/attendance');
    if (tabId === 'exams')      navigate('/exams');
    if (tabId === 'home')       navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-x-hidden">

      {/* ── Hero Header ───────────────────────────── */}
      <div className="relative overflow-hidden pb-6 pt-safe"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />

        <div className="relative px-5 pt-5 pb-2">
          {/* Top row: school name + bell */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-lg">
                <img src="/logo.png?v=1" alt="logo" className="w-full h-full object-contain p-0.5"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <span className="text-white/90 text-xs font-bold uppercase tracking-widest">{schoolName}</span>
            </div>
            <button onClick={() => navigate('/announcements')}
              className="relative p-2 rounded-xl bg-white/10 text-white/90 backdrop-blur-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-400 rounded-full" />
            </button>
          </div>

          {/* Greeting + student info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl shrink-0">
              {user?.photoUrl
                ? <img src={getPhotoUrl(user.photoUrl)} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-indigo-400 flex items-center justify-center text-white text-2xl font-black">
                    {user?.name?.charAt(0) || 'S'}
                  </div>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-indigo-300 text-xs font-semibold mb-0.5">{greetEmoji} {greeting}</p>
              <h1 className="text-white text-xl font-black leading-tight truncate">{user?.name || 'Student'}</h1>
              <p className="text-indigo-300 text-xs font-medium mt-0.5">
                {data?.studentProfile?.class?.name
                  ? `Class ${data.studentProfile.class.name} - ${data.studentProfile.class.section}`
                  : 'Student'}
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Attendance', value: `${attPct}%`, color: attColor },
              {
                label: 'Fee Status',
                value: feeStatus === 'PAID' ? 'Paid ✓' : feeStatus === 'PARTIAL' ? 'Partial' : 'Due',
                color: feeStatus === 'PAID' ? '#10b981' : '#f59e0b',
              },
              {
                label: 'Last Score',
                value: data?.recentMarks?.length > 0
                  ? `${data.recentMarks[0].marksObtained}/${data.recentMarks[0].maxMarks}`
                  : 'N/A',
                color: '#a5b4fc',
              },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl px-3 py-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <p className="text-xs font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-white/60 font-medium mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">

        {/* Today's Quick Access */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quick Access</h2>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Today Timetable quick strip */}
          {data?.timetableToday?.length > 0 ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {data.timetableToday.slice(0, 5).map((slot: any, idx: number) => {
                const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
                const c = colors[idx % colors.length];
                return (
                  <div key={idx} className="shrink-0 rounded-2xl px-4 py-3 min-w-[110px]"
                    style={{ background: c + '15', border: `1px solid ${c}30` }}>
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c }}>
                      {slot.startTime}
                    </span>
                    <p className="text-sm font-bold text-slate-800 mt-1 leading-tight line-clamp-1">
                      {slot.subject.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                      {slot.teacher?.user?.name || '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-slate-100 text-center">
              <p className="text-sm text-slate-400 font-medium">No classes scheduled today</p>
            </div>
          )}
        </div>

        {/* Attendance Progress */}
        <div className="mb-5 rounded-2xl p-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${attColor}18, ${attColor}06)`, border: `1px solid ${attColor}25` }}>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Attendance This Month</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {attPct >= 80 ? '✓ Great! Keep it up' : attPct >= 60 ? '⚠ Needs improvement' : '✗ At risk — attend classes'}
              </p>
            </div>
            <span className="text-2xl font-black" style={{ color: attColor }}>{attPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200/60 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${attPct}%`, background: `linear-gradient(90deg, ${attColor}, ${attColor}bb)` }} />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">All Modules</h2>
          <div className="grid grid-cols-2 gap-3">
            {MODULE_CARDS.map(card => {
              const Icon = card.icon;
              return (
                <button key={card.id}
                  onClick={() => navigate(card.route)}
                  className={`group relative flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.glow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden text-left`}>
                  {/* Decorative circle */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-6 translate-x-6" />

                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="relative z-10">
                    <p className="text-[13px] font-black leading-tight text-white">{card.label}</p>
                    <p className="text-[11px] text-white/70 font-medium mt-0.5 leading-tight">{card.sub}</p>
                  </div>

                  {card.badge && (
                    <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                      style={{ background: card.badgeColor + '40', color: card.badgeColor }}>
                      {card.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Marks */}
        {data?.recentMarks?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recent Marks</h2>
              <button onClick={() => navigate('/exams')}
                className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {data.recentMarks.slice(0, 4).map((m: any, i: number) => {
                const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                const gc = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
                return (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: gc + '18' }}>
                      <Award className="w-4.5 h-4.5" style={{ color: gc }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.subjectName}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{m.examName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: gc }}>
                        {m.marksObtained}/{m.maxMarks}
                      </p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: gc + '18', color: gc }}>
                        {m.grade || `${pct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Exams */}
        {data?.upcomingExams?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Upcoming Exams</h2>
              <button onClick={() => navigate('/exams')}
                className="text-[11px] font-bold text-rose-500 flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {data.upcomingExams.slice(0, 3).map((ex: any, i: number) => {
                const daysLeft = Math.ceil((new Date(ex.examDate).getTime() - Date.now()) / 86400000);
                const urgency = daysLeft <= 3 ? '#f43f5e' : daysLeft <= 7 ? '#f59e0b' : '#6366f1';
                return (
                  <div key={ex.id} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: urgency + '18' }}>
                      <ClipboardList className="w-4.5 h-4.5" style={{ color: urgency }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{ex.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Date(ex.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: urgency + '18', color: urgency }}>
                      {daysLeft <= 0 ? 'Today!' : `${daysLeft}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admit Cards */}
        {data?.admitCards?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Admit Cards</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {data.admitCards.slice(0, 4).map((exam: any) => (
                <button key={exam.id}
                  onClick={() => navigate(`/admit-card-view/${exam.id}`)}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white text-left shadow-md shadow-pink-500/25 hover:shadow-lg transition-all">
                  <BookMarked className="w-5 h-5 mb-2 text-white/80" />
                  <p className="text-[13px] font-black leading-tight line-clamp-2">{exam.name}</p>
                  <p className="text-[10px] text-white/70 mt-1 font-medium">Tap to download</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── More Menu Overlay ───────────────────── */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-20 left-0 right-0 mx-4 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">More Options</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Profile', icon: User, route: '/profile', color: '#6366f1' },
                { label: 'Messages', icon: Megaphone, route: '/messages', color: '#06b6d4' },
                { label: 'Admit Cards', icon: BookMarked, route: '/student/admit-cards', color: '#ec4899' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label}
                    onClick={() => { setShowMoreMenu(false); navigate(item.route); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                    style={{ background: item.color + '12' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: item.color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={logout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation ───────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-gray-100"
        style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {BOTTOM_NAV.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px] ${
                  isActive ? 'scale-105' : 'opacity-60 hover:opacity-80'
                }`}
                style={isActive ? { background: tab.color + '15' } : {}}>
                <div className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-all ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? tab.color : '#94a3b8'} />
                  {tab.id === 'more' && showMoreMenu && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-bold"
                  style={{ color: isActive ? tab.color : '#94a3b8' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full" style={{ background: tab.color }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default StudentMobileDashboard;
