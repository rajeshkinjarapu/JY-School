import React, { useState, useEffect } from 'react';
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
  Users, GraduationCap, School, Wallet, CalendarDays,
  FileText, Award, ArrowUpRight, Clock, Activity,
  PieChart as PieChartIcon, TrendingUp, BarChart3,
  BookOpen, CheckCircle2, XCircle, Megaphone, Star,
  ChevronRight, Zap, Target, BookMarked, UserCheck, PenTool, CreditCard, Key
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { getPhotoUrl } from '../../utils/photo';

/* ─────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleMap: Record<string, string> = {
    super_admin: 'admin',
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
    parent: 'parent',
    accountant: 'accountant',
  };

  const endpoint = roleMap[user?.role?.toLowerCase() || ''] || 'admin';

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard', endpoint],
    queryFn: async () => {
      const res = await api.get(`/api/dashboard/${endpoint}`);
      return res.data || res;
    },
    enabled: !!user && user.role !== 'ACCOUNTANT',
    staleTime: 1000 * 60 * 5, // 5 minutes cache
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
    <div className="space-y-4 sm:space-y-5 p-2 sm:p-3 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-fade-in-up pb-6">
      <WelcomeBanner name={user?.name || ''} role={user?.role || ''} photoUrl={data?.teacherProfile?.photoUrl || data?.studentProfile?.photoUrl || user?.photoUrl} />
      <div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && <AdminView data={data} />}
        {user?.role === 'TEACHER' && <TeacherView data={data} />}
        {user?.role === 'STUDENT' && <StudentView data={data} />}
      </div>
    </div>
  );
};

/* ── Welcome Banner ─────────────────────────────────────── */
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
    <div className="relative w-full overflow-hidden rounded-[1.2rem] sm:rounded-2xl" style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
    }}>
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2.5L22.5 16 25 13.5V0h2v13.5L29.5 16 32 18.5V20h8v2h-8v1.5L29.5 26 27 28.5V40h-2V28.5L22.5 26 20 23.5V20.5z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Avatar and Info */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-[2px] border-[#1e1b4b]">
                {getPhotoUrl(photoUrl) ? (
                  <img src={getPhotoUrl(photoUrl)} alt="Profile" className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <span className={`text-sm sm:text-base font-black text-white ${getPhotoUrl(photoUrl) ? 'hidden' : ''}`}>
                  {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : emoji}
                </span>
              </div>
            </div>
            {/* Online Badge */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#1e1b4b] rounded-full shadow-sm" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-indigo-200/90 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              {greeting} <span className="text-[12px]">{emoji}</span>
            </p>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate leading-tight mb-1">
              {name}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold bg-white/10 text-indigo-100 border border-white/10 tracking-wide uppercase">
                {displayRole}
              </span>
              <span className="text-indigo-300/50 text-[10px] font-bold">•</span>
              <span className="text-indigo-100/70 text-[9px] sm:text-[10px] font-semibold tracking-wide">JY School</span>
            </div>
          </div>
        </div>

        {/* Right Side: Date Date Badge */}
        <div className="flex w-full sm:w-auto items-center justify-end border-t border-white/5 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[10px] sm:text-[11px] font-bold text-white tracking-wide">{today}</span>
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
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-bl-full"
        style={{ backgroundImage: `linear-gradient(to bottom left, ${iconColor}, transparent)` }} />
        
      {/* Top gradient border */}
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
        {sub && <p className="text-[7px] sm:text-[8px] md:text-[9px] text-white/90 mt-1 font-bold flex items-center gap-1 sm:gap-1.5 opacity-90 truncate"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/80 shrink-0"/>{sub}</p>}
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
    {/* Decorative colorful ambient glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400/20 to-rose-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const TT = { borderRadius: '14px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 600 };
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

/* ── Admin View ─────────────────────────────────────────── */
const AdminView: React.FC<{ data: any }> = ({ data }) => {
  const totalPresent = data.attendanceTrend?.reduce((s: number, d: any) => s + d.present, 0) || 0;
  const totalAbsent  = data.attendanceTrend?.reduce((s: number, d: any) => s + d.absent, 0) || 0;
  const attendancePct = totalPresent + totalAbsent > 0
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : data.attendanceToday || 0;

  const stats: StatCardProps[] = [
    { label: 'Total Students', value: data.totalStudents, icon: Users, gradient: 'linear-gradient(90deg,#6366f1,#818cf8)', glow: 'rgba(99,102,241,0.08)', link: '/students', sub: 'Enrolled this year' },
    { label: 'Total Teachers', value: data.totalTeachers, icon: GraduationCap, gradient: 'linear-gradient(90deg,#10b981,#34d399)', glow: 'rgba(16,185,129,0.08)', link: '/teachers', sub: 'On staff' },
    { label: 'Total Classes', value: data.totalClasses, icon: School, gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.08)', link: '/classes', sub: 'Active sections' },
    { label: 'Total Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: Wallet, gradient: 'linear-gradient(90deg,#f43f5e,#fb7185)', glow: 'rgba(244,63,94,0.08)', link: '/finance?tab=transaction', sub: 'Fees collected' },
    { label: 'Collect Payment', value: 'Fees', icon: CreditCard, gradient: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,0.08)', link: '/collect-payment', sub: 'Process new fees' },
    { label: 'Results', value: 'Exams', icon: FileText, gradient: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', glow: 'rgba(14,165,233,0.08)', link: '/exams?tab=results', sub: 'View exam scores' },
    { label: 'Fee Details', value: 'Student Fees', icon: BookMarked, gradient: 'linear-gradient(90deg,#db2777,#f472b6)', glow: 'rgba(219,39,119,0.08)', link: '/finance?tab=student-fee-details', sub: 'Student balances & dues' },
    { label: 'Progress Cards', value: 'Reports', icon: Award, gradient: 'linear-gradient(90deg,#059669,#34d399)', glow: 'rgba(5,150,105,0.08)', link: '/exams?tab=progress-card', sub: 'Generate & View' },
    { label: 'App Installs', value: `${data.totalAppInstalls || 0} / ${data.totalStudents || 0}`, icon: Zap, gradient: 'linear-gradient(90deg,#14b8a6,#2dd4bf)', glow: 'rgba(20,184,166,0.08)', link: '/app-installs', sub: 'Mobile app usage' },
  ];

  const pieData = [
    { name: 'Male',   value: data.genderDistribution?.male   || 0 },
    { name: 'Female', value: data.genderDistribution?.female || 0 },
    { name: 'Other',  value: data.genderDistribution?.other  || 0 },
  ].filter(d => d.value > 0);

  const enrollmentData = (data.enrollmentByClass || []).slice(0, 8);

  return (
    <div className="space-y-7">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Attendance Ribbon */}
      <div className="relative overflow-hidden rounded-2xl p-4" style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#1e293b 100%)',
        boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
      }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle,#818cf8,transparent)' }} />
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Attendance", value: `${data.attendanceToday || 0}%`, icon: CheckCircle2, color: '#10b981' },
            { label: '7-Day Avg', value: `${attendancePct}%`, icon: Activity, color: '#818cf8' },
            { label: 'Present (7d)', value: totalPresent, icon: UserCheck, color: '#34d399' },
            { label: 'Absent (7d)', value: totalAbsent, icon: XCircle, color: '#f87171' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <div className="p-2 md:p-2.5 rounded-[0.6rem] shrink-0" style={{ background: item.color + '22' }}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-white text-sm sm:text-base md:text-lg font-black mt-0.5">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard className="lg:col-span-3">
          <SectionHeader title="Recent Payments" subtitle="Latest fee transactions" icon={Wallet} iconColor="#6366f1"
            action={<Link to="/fee-payment" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="border-b border-r border-gray-200 dark:border-gray-700 p-2.5 w-[50%]">Student</th>
                  <th className="border-b border-r border-gray-200 dark:border-gray-700 p-2.5 w-[25%] text-center whitespace-nowrap">Date</th>
                  <th className="border-b border-gray-200 dark:border-gray-700 p-2.5 w-[25%] text-right whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const payments = data.recentPayments || [];
                  if (payments.length === 0) {
                    return (
                      <tr>
                        <td colSpan={3} className="text-sm text-slate-400 text-center py-8">
                          No recent payments.
                        </td>
                      </tr>
                    );
                  }
                  
                  return payments.map((p: any, idx: number) => {
                    const studentName = p.student?.user?.name || p.student?.name || 'Unknown Student';
                    const dateStr = p.paymentDate 
                      ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                      : '-';
                    const amountStr = `₹${Number(p.amountPaid).toLocaleString('en-IN')}`;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                        <td className="p-2.5 border-r border-gray-200 dark:border-gray-700 truncate">
                          <span className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate block" title={studentName}>
                            {studentName}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-gray-200 dark:border-gray-700 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="p-2.5 text-right text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {amountStr}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Demographics" subtitle="Student gender distribution" icon={PieChartIcon} iconColor="#8b5cf6" />
          <div className="h-[200px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="48%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={TT} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data yet.</div>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: COLORS[i] + '18', color: COLORS[i] }}>
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}: {d.value}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard className="lg:col-span-3">
          <SectionHeader title="Attendance Overview" subtitle="Present vs absent — last 7 days" icon={Activity} iconColor="#10b981" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <RechartsTooltip contentStyle={TT} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 8 }} />
                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-2">
          <SectionHeader title="Class Enrollment" subtitle="Students per class" icon={BarChart3} iconColor="#f59e0b"
            action={<Link to="/classes" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">All Classes <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="h-[220px]">
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} width={52} />
                  <RechartsTooltip contentStyle={TT} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No enrollment data.</div>}
          </div>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5">
        <ChartCard>
          <SectionHeader title="Notice Board" subtitle="Latest school announcements" icon={Megaphone} iconColor="#8b5cf6"
            action={<Link to="/announcements" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">View All <ChevronRight className="w-3.5 h-3.5" /></Link>} />
          <div className="space-y-3">
            {data.recentAnnouncements?.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No announcements.</p>}
            {data.recentAnnouncements?.map((a: any, i: number) => {
              const c = COLORS[i % COLORS.length];
              return (
                <div key={a.id} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 group cursor-pointer transition-colors">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: c + '18' }}>
                    <span className="text-[9px] font-black uppercase" style={{ color: c }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-sm font-black" style={{ color: c }}>{new Date(a.createdAt).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{a.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-medium">{a.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
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
                    <CalendarDays className="w-3 h-3"/> Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
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
      {/* Student Quick Stats Grid (Matching Teacher Style) */}
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
        {/* Today's Classes (Timetable) - Matches Teacher's Timetable position */}
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

        {/* Academic Performance - Matches Teacher's Recent Homework position */}
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

