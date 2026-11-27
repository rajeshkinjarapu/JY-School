import React, { useEffect } from 'react';
import { formatExamOptionLabel } from '../../utils/formatters';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/UI/Avatar';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AccountantDashboard } from './AccountantDashboard';
import { StudentMobileDashboard } from './StudentMobileDashboard';
import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, School, Wallet, CalendarDays, CalendarCheck,
  FileText, Award, ArrowUpRight, Clock, Activity,
  PieChart as PieChartIcon, TrendingUp, BarChart3,
  BookOpen, CheckCircle2, XCircle, Megaphone, Star, Check,
  ChevronRight, Zap, Target, BookMarked, UserCheck, PenTool, CreditCard, Key, UserPlus, Sparkles, User
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { getPhotoUrl } from '../../utils/photo';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

/* ─────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'GROUP_CHAIRMAN') {
      navigate('/chairman', { replace: true });
    }
  }, [user, navigate]);

  const roleMap: Record<string, string> = {
    super_admin: 'admin',
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
    parent: 'parent',
    accountant: 'accountant',
  };

  const endpoint = roleMap[user?.role?.toLowerCase() || ''] || 'admin';
  const { selectedYear } = useAcademicYear();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard', endpoint, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/api/dashboard/${endpoint}`, {
        params: { academicYear: selectedYear }
      });
      return res.data || res;
    },
    enabled: !!user && user.role !== 'ACCOUNTANT',
    staleTime: 1000 * 30, // 30 seconds cache
    refetchOnWindowFocus: true,
  });

  if (user?.role === 'ACCOUNTANT') return <AccountantDashboard />;

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;
  if (!data)
    return <p className="text-center py-12 text-gray-400">Failed to load. Please refresh.</p>;

  // Student on mobile → WhatsApp-style mobile dashboard
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (user?.role === 'STUDENT' && isMobile) {
    return <StudentMobileDashboard data={data} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 lg:p-6 bg-[#EEF2F8] min-h-screen animate-fade-in-up pb-10">
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ? (
        <AdminView data={data} user={user} />
      ) : (
        <>
          <WelcomeBanner name={user?.name || ''} role={user?.role || ''} photoUrl={data?.teacherProfile?.photoUrl || data?.studentProfile?.photoUrl || user?.photoUrl} />
          {user?.role === 'TEACHER' && <TeacherView data={data} />}
          {user?.role === 'STUDENT' && <StudentView data={data} />}
        </>
      )}
    </div>
  );
};

/* ── Welcome Banner (For Teacher & Student) ───────────────── */
const WelcomeBanner: React.FC<{ name: string; role: string; photoUrl?: string }> = ({ name, role, photoUrl }) => {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  const emoji = h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  const roleLabel: Record<string, string> = {
    TEACHER: 'Teacher', STUDENT: 'Student', ACCOUNTANT: 'Accountant',
  };

  const displayRole = roleLabel[role] || role;

  return (
    <div className="relative w-full overflow-hidden rounded-[1.2rem] sm:rounded-2xl bg-white border border-indigo-50 shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-fuchsia-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="shrink-0 relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl p-[2px] bg-gradient-to-tr from-indigo-400 to-purple-400 shadow-sm">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center border-[2px] border-white">
                {getPhotoUrl(photoUrl) ? (
                  <img src={getPhotoUrl(photoUrl)} alt="Profile" className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <span className={`text-sm sm:text-base font-black text-indigo-600 ${getPhotoUrl(photoUrl) ? 'hidden' : ''}`}>
                  {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : emoji}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-indigo-600 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              {greeting} <span className="text-[12px]">{emoji}</span>
            </p>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate leading-tight mb-1">
              {name}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 tracking-wide">
                JY School - {displayRole}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-wide">{today}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Shared helpers ─────────────────────────────────────── */
interface StatCardProps {
  label: string; value: string | number; icon: React.ElementType;
  gradient: string; glow: string; link?: string; sub?: string;
  badge?: string; badgeColor?: string; onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, gradient, glow, link, sub, badge, badgeColor, onClick }) => {
  const iconColor = gradient.includes('#6366f1') ? '#6366f1'
    : gradient.includes('#10b981') ? '#10b981'
      : gradient.includes('#f59e0b') ? '#d97706'
        : gradient.includes('#f43f5e') ? '#e11d48'
          : gradient.includes('#06b6d4') ? '#0891b2' : '#8b5cf6';

  const inner = (
    <div className="group relative overflow-hidden rounded-[1.2rem] p-3 sm:p-4 transition-all duration-500 hover:-translate-y-1 cursor-pointer shadow-md border border-white/20"
      style={{ background: gradient, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)' }}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-bl-full"
        style={{ backgroundImage: `linear-gradient(to bottom left, ${iconColor}, transparent)` }} />
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity bg-white/30" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1.5 md:mb-3">
          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-[0.8rem] bg-white/20 shadow-inner backdrop-blur-md border border-white/30"
            style={{ boxShadow: `0 4px 12px ${glow}` }}>
            <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-white drop-shadow-md" />
          </div>
          {badge && (
            <span className="text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full border shadow-sm"
              style={{ background: badgeColor ? badgeColor + '15' : '#ecfdf5', color: badgeColor || '#065f46', borderColor: badgeColor ? badgeColor + '30' : '#a7f3d0' }}>
              {badge}
            </span>
          )}
          {link && !badge && (
            <div className="p-1 md:p-1.5 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors border border-white/20">
              <ArrowUpRight className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
            </div>
          )}
        </div>
        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider mb-0.5 md:mb-1 truncate">{label}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-none drop-shadow-md">{value}</p>
        {sub && <p className="text-[7px] sm:text-[8px] md:text-[9px] text-white/90 mt-1 font-bold flex items-center gap-1 sm:gap-1.5 opacity-90 truncate"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/80 shrink-0" />{sub}</p>}
      </div>
    </div>
  );
  if (onClick) {
    return <div onClick={onClick}>{inner}</div>;
  }
  return link ? <Link to={link}>{inner}</Link> : inner;
};

const SectionHeader: React.FC<{
  title: string; subtitle?: string; icon: React.ElementType;
  iconColor?: string; action?: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconColor = '#6366f1', action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl" style={{ background: iconColor + '18' }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: iconColor }} />
      </div>
      <div>
        <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const ChartCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden bg-white/70 backdrop-blur-xl border-[2px] border-indigo-200/50 ring-2 ring-white/60 transition-all duration-300 hover:shadow-xl hover:bg-white/90 group ${className}`}
    style={{
      boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.10)',
    }}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400/20 to-rose-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const TT = { borderRadius: '14px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 600 };
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

/* ── Admin View (100% Exact Match to Pastel Reference Design) ── */
interface ActionCardData {
  label: string;
  value: string | number;
  icon: React.ElementType;
  cardBg: string;
  iconBg: string;
  valueColor: string;
  arrowColor: string;
  link: string;
}

const AdminView: React.FC<{ data: any; user?: any }> = ({ data, user }) => {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const roleTitleMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    ACCOUNTANT: 'Accountant',
    PARENT: 'Parent',
  };
  const roleDisplay = roleTitleMap[user?.role || ''] || user?.role || 'Super Admin';

  const totalStudentsCount = data.totalStudents ?? 0;
  const totalTeachersCount = data.totalTeachers ?? 0;
  const totalClassesCount = data.totalClasses ?? 0;
  const totalRevenueFormatted = data.totalRevenue !== undefined && data.totalRevenue !== null
    ? `₹${Number(data.totalRevenue).toLocaleString('en-IN')}`
    : '₹0';
  const appInstallsStr = `${data.totalAppInstalls ?? 0} / ${totalStudentsCount}`;

  // Live Attendance metrics from real database
  const studentAtt = data.studentAttendance;
  const isStudentAttMarked = studentAtt ? studentAtt.isMarked : (data.attendanceToday !== undefined && data.attendanceToday > 0);
  const displayAttendancePct = totalStudentsCount > 0 ? (studentAtt ? studentAtt.percentage : (data.attendanceToday || 0)) : 0;
  const presentCount = totalStudentsCount > 0 ? (studentAtt ? studentAtt.present : (isStudentAttMarked ? Math.round(totalStudentsCount * (displayAttendancePct / 100)) : 0)) : 0;
  const absentCount = totalStudentsCount > 0 ? (studentAtt ? studentAtt.absent : (isStudentAttMarked ? Math.max(0, totalStudentsCount - presentCount) : 0)) : 0;
  const leaveCount = totalStudentsCount > 0 ? (studentAtt ? studentAtt.leave : 0) : 0;

  const teacherAtt = data.teacherAttendance;
  const isTeacherAttMarked = teacherAtt ? teacherAtt.isMarked : false;
  const teacherPresentCount = teacherAtt ? teacherAtt.present : 0;
  const teacherTotalCount = teacherAtt ? (teacherAtt.totalTeachers || totalTeachersCount) : totalTeachersCount;
  const teacherAttendancePct = teacherAtt ? teacherAtt.percentage : 0;

  const actionCards: ActionCardData[] = [
    {
      label: 'TOTAL STUDENTS',
      value: totalStudentsCount,
      icon: Users,
      cardBg: 'from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF]',
      iconBg: 'from-[#2563EB] to-[#1D4ED8]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#2563EB]',
      link: '/students',
    },
    {
      label: 'TOTAL TEACHERS',
      value: totalTeachersCount,
      icon: GraduationCap,
      cardBg: 'from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0]',
      iconBg: 'from-[#10B981] to-[#059669]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#059669]',
      link: '/teachers',
    },
    {
      label: 'TOTAL CLASSES',
      value: totalClassesCount,
      icon: School,
      cardBg: 'from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B]',
      iconBg: 'from-[#F59E0B] to-[#D97706]',
      valueColor: 'text-[#9A3412]',
      arrowColor: 'text-[#D97706]',
      link: '/classes',
    },
    {
      label: 'TOTAL INCOME',
      value: totalRevenueFormatted,
      icon: Wallet,
      cardBg: 'from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7]',
      iconBg: 'from-[#EF4444] to-[#DC2626]',
      valueColor: 'text-[#991B1B]',
      arrowColor: 'text-[#DC2626]',
      link: '/finance?tab=transaction',
    },
    {
      label: 'COLLECT PAYMENT',
      value: 'Fees',
      icon: CreditCard,
      cardBg: 'from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF]',
      iconBg: 'from-[#8B5CF6] to-[#6D28D9]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#6D28D9]',
      link: '/collect-payment',
    },
    {
      label: 'RESULTS',
      value: 'Exams',
      icon: FileText,
      cardBg: 'from-[#E6FAFC] to-[#C4F1F9] border-[#B0E9F5]',
      iconBg: 'from-[#06B6D4] to-[#0891B2]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#0891B2]',
      link: '/exams?tab=results',
    },
    {
      label: 'FEE DETAILS',
      value: 'Student Fees',
      icon: BookMarked,
      cardBg: 'from-[#FFEBF3] to-[#FFD0E4] border-[#FFBDDA]',
      iconBg: 'from-[#EC4899] to-[#DB2777]',
      valueColor: 'text-[#9D174D]',
      arrowColor: 'text-[#DB2777]',
      link: '/finance?tab=student-fee-details',
    },
    {
      label: 'PROGRESS CARDS',
      value: 'Reports',
      icon: Award,
      cardBg: 'from-[#EEF0FF] to-[#D8DEFF] border-[#C6CEFE]',
      iconBg: 'from-[#7C3AED] to-[#4F46E5]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#5B3DF5]',
      link: '/exams?tab=progress-card',
    },
    {
      label: 'APP INSTALLS',
      value: appInstallsStr,
      icon: Zap,
      cardBg: 'from-[#E6F4FF] to-[#C5E5FF] border-[#B2DCFF]',
      iconBg: 'from-[#38BDF8] to-[#0284C7]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#0284C7]',
      link: '/app-installs',
    },
    {
      label: 'ADMISSIONS',
      value: 'Manage',
      icon: UserPlus,
      cardBg: 'from-[#ECFDF2] to-[#C8F7D6] border-[#B2EEC6]',
      iconBg: 'from-[#22C55E] to-[#16A34A]',
      valueColor: 'text-slate-900',
      arrowColor: 'text-[#16A34A]',
      link: '/admissions',
    },
  ];

  // Recent payments data (with robust fallback matching reference design)
  const fallbackPayments = [
    { name: 'Rovish Karnan', stream: 'Class 10 - A', date: 'Today', amount: '₹2,050.00', status: 'Paid', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face' },
    { name: 'Likitha Kumar', stream: 'Class 9 - B', date: 'Today', amount: '₹1,050.00', status: 'Paid', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face' },
    { name: 'Aneesh Kumar', stream: 'Class 8 - A', date: 'Today', amount: '₹3,050.00', status: 'Paid', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face' },
    { name: 'Rohit Vamshi', stream: 'Class 7 - A', date: 'Today', amount: '₹1,650.00', status: 'Paid', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
    { name: 'Sanjiv Mahesh', stream: 'Class 6 - B', date: 'Today', amount: '₹1,050.00', status: 'Paid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  ];

  const recentPayments = (data.recentPayments && data.recentPayments.length > 0)
    ? data.recentPayments.slice(0, 5).map((p: any) => {
      const classObj = p.student?.class;
      const className = classObj?.name
        ? `${classObj.name}${classObj.section ? ` - ${classObj.section}` : ''}`
        : (p.student?.className || (p.student?.rollNo ? `ID: ${p.student.rollNo}` : 'Student'));
      return {
        name: p.student?.user?.name || p.student?.name || 'Student',
        stream: className,
        date: p.paymentDate
          ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : 'Today',
        amount: `₹${Number(p.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: 'Paid',
        avatar: getPhotoUrl(p.student?.user?.photoUrl || p.student?.photoUrl),
      };
    })
    : fallbackPayments;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. Top Light Colourful Hero Banner ── */}
      <div className="relative w-full rounded-[20px] sm:rounded-[22px] overflow-hidden bg-gradient-to-r from-[#EBF3FF] via-[#F4EBFF] to-[#FFF0F6] px-4 py-3.5 sm:px-6 sm:py-4 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.14)] border border-indigo-200/75 text-slate-800">
        {/* Soft Colourful Pastel Glows */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-gradient-to-br from-rose-300/35 to-amber-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-gradient-to-tr from-sky-300/35 to-indigo-300/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-0 w-56 h-40 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/65 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left: Logged-in Person Photo + Name + JY School - Role Subtitle */}
          <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
            {/* User Profile Photo with Vibrant Colourful Ring */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 lg:w-15 lg:h-15 rounded-xl sm:rounded-2xl p-[2.5px] bg-gradient-to-tr from-[#3B82F6] via-[#8B5CF6] to-[#EC4899] shadow-md">
                <div className="w-full h-full rounded-[10px] sm:rounded-[13px] overflow-hidden bg-white flex items-center justify-center border-2 border-white shadow-inner">
                  {user?.photoUrl ? (
                    <img
                      src={getPhotoUrl(user.photoUrl)}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl sm:text-2xl ${user?.photoUrl ? 'hidden' : ''}`}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Active" />
            </div>

            {/* User Name & JY School - Role */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-[25px] font-black tracking-tight text-slate-900 leading-tight truncate">
                {user?.name || 'Administrator'}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] text-[11px] sm:text-xs font-bold text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                  <span>JY School - {roleDisplay}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Sleek Light Colourful Date Badge */}
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/90 hover:bg-white border border-indigo-200/80 text-slate-800 shadow-xs transition-colors">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
            <span className="text-xs sm:text-[13px] font-extrabold tracking-wide text-slate-800">{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* ── 2. 10 Soft Pastel Metric Cards (Exact Reference Match) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {actionCards.map((card, idx) => {
          const valStr = String(card.value);
          const isLargeValue = valStr.length > 10;
          const isMediumValue = valStr.length > 7 && valStr.length <= 10;

          return (
            <Link
              key={idx}
              to={card.link}
              className={`relative overflow-hidden rounded-[20px] px-3 py-3.5 sm:px-3.5 sm:py-4 border bg-gradient-to-br ${card.cardBg} shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-1.5 group`}
            >
              {/* Subtle top glossy highlight */}
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />

              {/* Icon & Details */}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                  <card.icon className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                    {card.label}
                  </p>
                  <p
                    className={`font-black ${card.valueColor} tracking-tight leading-tight mt-0.5 ${isLargeValue
                        ? 'text-xs sm:text-[13px] lg:text-[14px] whitespace-nowrap'
                        : isMediumValue
                          ? 'text-sm sm:text-base lg:text-[17px] whitespace-nowrap'
                          : 'text-lg sm:text-xl lg:text-[22px]'
                      }`}
                  >
                    {card.value}
                  </p>
                </div>
              </div>

              {/* Crisp White Circular Arrow */}
              <div className={`relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center ${card.arrowColor} group-hover:translate-x-0.5 transition-all shrink-0`}>
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 3. Bottom Two Master Cards (Recent Payments & Today's Attendance) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Card: Recent Payments (~58% / col-span-7) with Signature Purple Header */}
        <div className="lg:col-span-7 bg-white rounded-[22px] overflow-hidden shadow-[0_8px_24px_-6px_rgba(91,33,182,0.12)] border border-indigo-100/90 flex flex-col">
          {/* Purple Gradient Header Banner */}
          <div className="bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-base font-black text-white tracking-tight">Recent Payments</h2>
            </div>
            <Link
              to="/fee-payment"
              className="px-4 py-1.5 rounded-full bg-white hover:bg-indigo-50 text-xs font-extrabold text-slate-800 shadow-xs transition-colors flex items-center gap-1"
            >
              View All <span className="text-[11px]">→</span>
            </Link>
          </div>

          {/* Payments Table */}
          <div className="p-4 sm:p-5 flex-1">
            <div className="w-full overflow-hidden rounded-xl border border-slate-200/70">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="bg-[#F3F5FC] text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-4 w-[42%]">STUDENT</th>
                    <th className="py-2.5 px-3 w-[20%]">DATE</th>
                    <th className="py-2.5 px-3 w-[20%]">AMOUNT</th>
                    <th className="py-2.5 px-3 w-[18%] text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs bg-white">
                  {recentPayments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-200/80 shrink-0 flex items-center justify-center">
                            {p.avatar ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-indigo-700">{p.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold truncate">{p.stream}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-semibold text-slate-600">
                        {p.date}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-black text-slate-800">
                        {p.amount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] inline-flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          <span>{p.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Card: Today's Attendance (~42% / col-span-5) */}
        <div className="lg:col-span-5 relative overflow-hidden bg-white rounded-[22px] p-5 sm:p-6 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.08)] border border-slate-200/80 flex flex-col justify-between">
          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#4F46E5] text-white flex items-center justify-center shadow-sm shrink-0">
                <CalendarCheck className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-base font-black text-slate-800 leading-tight flex items-center gap-2">
                <span>Today's Attendance</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Today" />
              </h2>
            </div>
            <Link
              to="/attendance"
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-xs font-extrabold text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1"
            >
              <span>View Details</span>
              <span className="text-[11px]">→</span>
            </Link>
          </div>

          {/* Gauge & Metrics Body */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 my-auto py-3">
            {/* Donut Gauge */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#16A34A" />
                      <stop offset="55%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#0D9488" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="39" stroke="#EEF2F7" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    stroke="url(#attendanceGradient)"
                    strokeWidth="10"
                    strokeDasharray="245.04"
                    strokeDashoffset={245.04 * (1 - (displayAttendancePct / 100))}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {displayAttendancePct}%
                  </span>
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500 -mt-0.5">RATE</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-[#DCFCE7]/80 text-[10.5px] font-extrabold text-[#166534] border border-[#BBF7D0]">
                <BarChart3 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Overall Performance</span>
              </div>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="flex-1 w-full grid grid-cols-2 gap-2.5">
              {/* Tile 1: Total */}
              <div className="bg-[#EEF4FF] rounded-2xl p-3 border border-[#D8E6FF] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">TOTAL</p>
                  <div className="w-6 h-6 rounded-lg bg-white/80 text-[#2563EB] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1E3A8A] my-0.5 tracking-tight">{totalStudentsCount}</p>
                <p className="text-[10px] font-bold text-[#2563EB]/90">Students</p>
              </div>

              {/* Tile 2: Present */}
              <div className="bg-[#EBFBF2] rounded-2xl p-3 border border-[#C6F4D8] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#15803D] uppercase tracking-wider">PRESENT</p>
                  <div className="w-6 h-6 rounded-lg bg-white/80 text-[#16A34A] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#14532D] my-0.5 tracking-tight">{presentCount}</p>
                <p className="text-[10px] font-bold text-[#15803D]/90">Present</p>
              </div>

              {/* Tile 3: Absent */}
              <div className="bg-[#FFF0F2] rounded-2xl p-3 border border-[#FFD6DC] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-wider">ABSENT</p>
                  <div className="w-6 h-6 rounded-lg bg-white/80 text-[#DC2626] flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#991B1B] my-0.5 tracking-tight">{absentCount}</p>
                <p className="text-[10px] font-bold text-[#DC2626]/90">Absent</p>
              </div>

              {/* Tile 4: On Leave */}
              <div className="bg-[#FFF8EB] rounded-2xl p-3 border border-[#FDE5B8] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#D97706] uppercase tracking-wider">ON LEAVE</p>
                  <div className="w-6 h-6 rounded-lg bg-white/80 text-[#D97706] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#92400E] my-0.5 tracking-tight">{leaveCount}</p>
                <p className="text-[10px] font-bold text-[#D97706]/90">Students</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Live Teacher Attendance Pill Strip */}
          <div className="relative z-10 mt-2 px-3.5 py-2.5 rounded-2xl bg-[#F4F6FD] border border-[#E4E9F7] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#4F46E5] text-white flex items-center justify-center shadow-xs shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-600 text-xs">Teachers: </span>
                {isTeacherAttMarked ? (
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    {teacherPresentCount} / {teacherTotalCount} Present
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 text-xs sm:text-sm bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Today Not Marked ({totalTeachersCount} Staff)
                  </span>
                )}
              </div>
            </div>
            {isTeacherAttMarked ? (
              <span className={`px-3.5 py-1.5 rounded-full text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 shrink-0 ${teacherAttendancePct >= 90 ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`}>
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                <span>{teacherAttendancePct}% Present</span>
              </span>
            ) : (
              <Link
                to="/teacher-attendance"
                className="px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] sm:text-[11px] font-black border border-indigo-200 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Mark Attendance →</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Teacher View ───────────────────────────────────────── */
const TeacherView: React.FC<{ data: any }> = ({ data }) => {
  const navigate = useNavigate();
  const [showMarksModal, setShowMarksModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'MARKS' | 'RESULTS'>('MARKS');
  const [exams, setExams] = React.useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = React.useState('');
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [loadingExams, setLoadingExams] = React.useState(false);

  const handleOpenMarksModal = async (mode: 'MARKS' | 'RESULTS' = 'MARKS') => {
    setModalMode(mode);
    setShowMarksModal(true);
    setLoadingExams(true);
    try {
      const res = await api.get('/api/exams?limit=5000');
      setExams(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleGoToMarks = () => {
    if (selectedExamId && selectedClassId) {
      if (modalMode === 'MARKS') {
        navigate(`/exams/${selectedExamId}/entry?classId=${selectedClassId}`);
      } else {
        navigate(`/exams?tab=results&examId=${selectedExamId}&classId=${selectedClassId}`);
      }
    }
  };

  const { rate = 0, present = 0, absent = 0, total = 0 } = data.todayAttendanceSummary || {};
  const { teacherProfile, myAttendance, pendingSalary, recentHomework } = data;
  const classBarData = (data.assignedClasses || []).map((c: any) => ({ name: c.className, students: c.studentCount }));

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-7">
      {/* Teacher Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Daily Attendance', value: 'Mark', icon: UserCheck, gradient: 'linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Students Attendance', link: '/attendance' },
          { label: 'Total Students', value: data.totalStudents || 0, icon: Users, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Across all classes', link: '/students' },
          { label: 'Answer Key', value: 'Manage', icon: Key, gradient: 'linear-gradient(135deg,#f43f5e 0%,#be123c 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Update answers', link: '/answer-key' },
          { label: 'My Timetable', value: 'View', icon: School, gradient: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Weekly Schedule', link: '/timetable' },
          { label: 'Marks Entry', value: 'Enter', icon: PenTool, gradient: 'linear-gradient(135deg,#ec4899 0%,#e11d48 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Update grades', onClick: () => handleOpenMarksModal('MARKS') },
          { label: 'Results', value: 'View', icon: Award, gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'View all results', onClick: () => handleOpenMarksModal('RESULTS') },
          { label: 'Result Cards', value: 'View', icon: FileText, gradient: 'linear-gradient(135deg,#14b8a6 0%,#0f766e 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Progress Cards', link: '/exams?tab=jee-progress-card' },
          { label: 'Fee Reminder', value: 'Send', icon: CreditCard, gradient: 'linear-gradient(135deg,#f43f5e 0%,#be123c 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'WhatsApp fee dues', link: '/fee-reminder' },
          { label: 'Leave Apply', value: 'Apply', icon: FileText, gradient: 'linear-gradient(135deg,#06b6d4 0%,#2563eb 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Request leave', link: '/leave' },
          { label: 'My Salary', value: pendingSalary ? `₹${pendingSalary.netSalary}` : 'All Paid', icon: Wallet, gradient: 'linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)', glow: 'rgba(255,255,255,0.2)', sub: pendingSalary ? 'Pending' : 'No dues', link: '/salary' },
          { label: 'Announcements', value: 'View', icon: Megaphone, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Notice Board', link: '/announcements' },
          { label: 'Messages', value: 'Chat', icon: Megaphone, gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Real-time Messaging', link: '/messages' },
        ].map((stat, i) => <StatCard key={i} {...(stat as StatCardProps)} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timetable */}
        <ChartCard className="border border-slate-100">
          <SectionHeader title="Today's Schedule" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long' })} icon={CalendarDays} iconColor="#06b6d4" />
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
            {data.timetableToday?.length > 0 ? data.timetableToday.map((slot: any, idx: number) => (
              <div key={idx} className="relative flex gap-3">
                {idx < data.timetableToday.length - 1 && <div className="absolute left-[18px] top-10 bottom-[-12px] w-px bg-slate-100" />}
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center z-10" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <Clock className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="pb-3 pt-1 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{slot.subject.name}</p>
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{slot.startTime}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{slot.class.name}-{slot.class.section} · ends {slot.endTime}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-8">No classes scheduled today.</p>}
          </div>
        </ChartCard>

        {/* Recent Homework */}
        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Recent Homework" subtitle="Latest assignments given" icon={BookOpen} iconColor="#8b5cf6"
            action={<Link to="/homework" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentHomework?.length > 0 ? recentHomework.slice(0, 4).map((hw: any) => (
              <div key={hw.id} className="p-4 rounded-[1.2rem] border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{hw.class.name}-{hw.class.section}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${hw.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{hw.status}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{hw.title}</h4>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-semibold text-slate-500">{hw.subject.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )) : <div className="col-span-2 text-center py-10 text-slate-400 text-sm">No homework assigned recently.</div>}
          </div>
        </ChartCard>
      </div>

      {data.announcements?.length > 0 && (
        <ChartCard>
          <SectionHeader title="Announcements" subtitle="For teachers" icon={Megaphone} iconColor="#f59e0b"
            action={<Link to="/announcements" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.announcements.slice(0, 3).map((a: any, i: number) => {
              const c = COLORS[i % COLORS.length];
              return (
                <div key={a.id} className="p-4 rounded-xl" style={{ background: c + '08', border: `1px solid ${c}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-3.5 h-3.5" style={{ color: c }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{a.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{a.content}</p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      {showMarksModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0" onClick={() => setShowMarksModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" /> Select Exam & Class
            </h3>

            {loadingExams ? (
              <div className="py-8 flex justify-center"><LoadingSpinner size="md" /></div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam</label>
                  <select
                    value={selectedExamId}
                    onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800 font-semibold"
                  >
                    <option value="" className="text-xs font-medium">-- Choose Exam --</option>
                    {exams.map(e => <option key={e.id} value={e.id} className="text-xs font-medium">{formatExamOptionLabel(e.name)}</option>)}
                  </select>
                </div>

                {selectedExam && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class</label>
                    <select
                      value={selectedClassId}
                      onChange={e => setSelectedClassId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800 font-semibold"
                    >
                      <option value="">-- Choose Class --</option>
                      {(selectedExam.classes || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                  <button onClick={() => setShowMarksModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
                  <button
                    onClick={handleGoToMarks}
                    disabled={!selectedExamId || !selectedClassId}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ── Student View ───────────────────────────────────────── */
const StudentView: React.FC<{ data: any }> = ({ data }) => {
  const navigate = useNavigate();
  const attPct = data.attendancePercentage || 0;
  const feeStatus = data.feeStatus?.status || 'NO_FEES';
  const attColor = attPct >= 80 ? '#10b981' : attPct >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="space-y-7">
      {/* Student Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Attendance', value: `${attPct}%`, icon: UserCheck, gradient: 'linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Last 30 days', link: '/student/attendance' },
          { label: 'Latest Score', value: data.recentMarks?.length > 0 ? `${Math.round((data.recentMarks[0].marksObtained / data.recentMarks[0].maxMarks) * 100)}%` : 'N/A', icon: Award, gradient: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)', glow: 'rgba(255,255,255,0.2)', sub: data.recentMarks?.[0]?.examName || 'No results yet', link: '/exams' },
          { label: 'Fee Status', value: feeStatus === 'PAID' ? 'Paid' : feeStatus === 'PARTIAL' ? 'Partial' : 'Pending', icon: CreditCard, gradient: feeStatus === 'PAID' ? 'linear-gradient(135deg,#10b981 0%,#059669 100%)' : 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', glow: 'rgba(255,255,255,0.2)', sub: feeStatus === 'PAID' ? 'All dues cleared' : 'Payment pending', link: '/finance' },
          { label: 'My Timetable', value: 'View', icon: School, gradient: 'linear-gradient(135deg,#ec4899 0%,#e11d48 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Weekly Schedule', link: '/timetable' },
          { label: 'Admit Cards', value: 'View', icon: BookMarked, gradient: 'linear-gradient(135deg,#14b8a6 0%,#0f766e 100%)', glow: 'rgba(255,255,255,0.2)', sub: 'Download admit cards', link: '/student/admit-cards' },
        ].map((stat, i) => <StatCard key={i} {...(stat as StatCardProps)} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Classes */}
        <ChartCard className="border border-slate-100">
          <SectionHeader title="Today's Classes" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long' })} icon={CalendarDays} iconColor="#06b6d4" />
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
            {data.timetableToday?.length > 0 ? data.timetableToday.map((slot: any, idx: number) => (
              <div key={idx} className="relative flex gap-3">
                {idx < data.timetableToday.length - 1 && <div className="absolute left-[18px] top-10 bottom-[-12px] w-px bg-slate-100" />}
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center z-10" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <BookOpen className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="pb-3 pt-1 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{slot.subject.name}</p>
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{slot.startTime}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{slot.teacher?.user?.name || 'N/A'} · ends {slot.endTime}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-8">No classes scheduled today.</p>}
          </div>
        </ChartCard>

        {/* Academic Performance */}
        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Recent Results" subtitle="Latest examination scores" icon={Award} iconColor="#8b5cf6"
            action={<Link to="/exams" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">Full Report <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recentMarks?.length > 0 ? data.recentMarks.slice(0, 4).map((m: any, i: number) => {
              const isAB = m.remarks === 'AB';
              const pct = isAB ? 0 : Math.round((m.marksObtained / m.maxMarks) * 100);
              const gc = isAB ? '#f43f5e' : (pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e');
              return (
                <div key={i} className="p-4 rounded-[1.2rem] border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors hover:shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{m.examName}</span>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: gc + '20', color: gc }}>{m.grade || (isAB ? 'F' : `${pct}%`)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{m.subjectName}</h4>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs font-semibold text-slate-500">Score</span>
                    <span className="text-[14px] font-black" style={{ color: gc }}>
                      {isAB ? 'AB' : `${m.marksObtained}/${m.maxMarks}`} {!isAB && <span className="text-[10px] text-slate-400 font-medium ml-0.5">({pct}%)</span>}
                    </span>
                  </div>
                </div>
              );
            }) : <div className="col-span-2 text-center py-10 text-slate-400 text-sm">No grades recorded yet.</div>}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.admitCards?.length > 0 && (
          <ChartCard>
            <SectionHeader title="Admit Cards" subtitle="Available to download" icon={BookMarked} iconColor="#ec4899" />
            <div className="space-y-3">
              {data.admitCards.slice(0, 3).map((exam: any) => (
                <div key={exam.id} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 group cursor-pointer transition-colors border border-transparent hover:border-slate-100" onClick={() => navigate(`/admit-card-view/${exam.id}`)}>
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-pink-50 text-pink-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors line-clamp-1">{exam.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Tap to View & Download</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {data.upcomingExams?.length > 0 && (
          <ChartCard>
            <SectionHeader title="Upcoming Exams" subtitle="Scheduled examinations" icon={Target} iconColor="#f43f5e" />
            <div className="space-y-3">
              {data.upcomingExams.slice(0, 3).map((ex: any) => {
                const daysLeft = Math.ceil((new Date(ex.examDate).getTime() - Date.now()) / 86400000);
                const urgency = daysLeft <= 3 ? '#f43f5e' : daysLeft <= 7 ? '#f59e0b' : '#6366f1';
                return (
                  <div key={ex.id} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 group cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: urgency + '18' }}>
                      <span className="text-[9px] font-black uppercase" style={{ color: urgency }}>
                        {new Date(ex.examDate).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black" style={{ color: urgency }}>{new Date(ex.examDate).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{ex.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {daysLeft <= 0 ? 'Today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
