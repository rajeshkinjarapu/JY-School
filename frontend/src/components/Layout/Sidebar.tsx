import React, { useState, useEffect, useRef, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen,
  CalendarCheck, ClipboardList, PenTool, Calendar, CreditCard,
  Megaphone, MessageSquare, BarChart3, Settings, LogOut,
  Shield, FileText, UserCheck, X, ChevronDown, ChevronRight, Smartphone, MapPin, Target, Briefcase, Bus, Database, Key, IdCard, UserPlus, Cake, Crown
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { getPhotoUrl } from '../../utils/photo';

interface SidebarProps { isOpen: boolean; setIsOpen: (v: boolean) => void; }

const roleLabels: Record<string, string> = {
  GROUP_CHAIRMAN: 'Group Chairman',
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', TEACHER: 'Teacher',
  STUDENT: 'Student', ACCOUNTANT: 'Accountant',
};

// Soft Pastel Light-Theme icon badges & accents for every nav item
const NAV_COLORS: Record<string, { iconBg: string; iconText: string }> = {
  Dashboard:              { iconBg: 'bg-[#EFEAFE]', iconText: 'text-[#5B3DF5]' },
  Admissions:             { iconBg: 'bg-[#E6F4FE]', iconText: 'text-[#0284C7]' },
  Forms:                  { iconBg: 'bg-[#EAF3FF]', iconText: 'text-[#2563EB]' },
  Students:               { iconBg: 'bg-[#E6FAFC]', iconText: 'text-[#0891B2]' },
  Birthdays:              { iconBg: 'bg-[#FCEBF4]', iconText: 'text-[#DB2777]' },
  'Student Birthdays':    { iconBg: 'bg-[#FCEBF4]', iconText: 'text-[#DB2777]' },
  Promotion:              { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  Teachers:               { iconBg: 'bg-[#E8F9EF]', iconText: 'text-[#059669]' },
  Classes:                { iconBg: 'bg-[#EAFAEE]', iconText: 'text-[#16A34A]' },
  Subjects:               { iconBg: 'bg-[#F0FAD8]', iconText: 'text-[#65A30D]' },
  Attendance:             { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'Daily Report':         { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'Examination':          { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  'Online Quizzes':       { iconBg: 'bg-[#F4EEFF]', iconText: 'text-[#7C3AED]' },
  'Online Exam Module':   { iconBg: 'bg-[#E8F9EF]', iconText: 'text-[#059669]' },
  'My Grades':            { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  Timetable:              { iconBg: 'bg-[#E6FAFC]', iconText: 'text-[#0891B2]' },
  Leave:                  { iconBg: 'bg-[#FFF1E6]', iconText: 'text-[#EA580C]' },
  'Gate Pass':            { iconBg: 'bg-[#FCEBF4]', iconText: 'text-[#DB2777]' },
  'Staff Gate Pass':      { iconBg: 'bg-[#FCEBF4]', iconText: 'text-[#DB2777]' },
  Finance:                { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  'Fee Approvals':        { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  'Fee Payment':          { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  'My Fees':              { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  Announcements:          { iconBg: 'bg-[#F5EDFF]', iconText: 'text-[#9333EA]' },
  Messages:               { iconBg: 'bg-[#FCEFFE]', iconText: 'text-[#C026D3]' },
  Reports:                { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  Settings:               { iconBg: 'bg-[#EEF2F7]', iconText: 'text-[#475569]' },
  'Website CMS':          { iconBg: 'bg-[#FCEBF4]', iconText: 'text-[#DB2777]' },
  'Office Tools':         { iconBg: 'bg-[#E6FAFC]', iconText: 'text-[#0891B2]' },
  'ID Cards':             { iconBg: 'bg-[#EEF2FF]', iconText: 'text-[#4F46E5]' },
  'Question Bank':        { iconBg: 'bg-[#EFEAFE]', iconText: 'text-[#5B3DF5]' },
  'Answer Key':           { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  Transport:              { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  Roles:                  { iconBg: 'bg-[#EEF2FF]', iconText: 'text-[#4F46E5]' },
  'Staff Roles':          { iconBg: 'bg-[#EEF2FF]', iconText: 'text-[#4F46E5]' },
  'Total Students':       { iconBg: 'bg-[#E6FAFC]', iconText: 'text-[#0891B2]' },
  'My Attendance':        { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'My Salary':            { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  Homework:               { iconBg: 'bg-[#EAFAEE]', iconText: 'text-[#16A34A]' },
  'HR Salary':            { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  'Staff Attendance':     { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'Address Data':         { iconBg: 'bg-[#E8F9EF]', iconText: 'text-[#059669]' },
  'Executive Dashboard':  { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'Consolidated Finance': { iconBg: 'bg-[#F2EDFF]', iconText: 'text-[#6D28D9]' },
  'Group Analytics':      { iconBg: 'bg-[#FEECEF]', iconText: 'text-[#E11D48]' },
  'Faculty Directory':    { iconBg: 'bg-[#E8F9EF]', iconText: 'text-[#059669]' },
  'Student Directory':    { iconBg: 'bg-[#E6FAFC]', iconText: 'text-[#0891B2]' },
  'Group Broadcasts':     { iconBg: 'bg-[#F5EDFF]', iconText: 'text-[#9333EA]' },
  'Chairman Portal':      { iconBg: 'bg-[#FFF4E5]', iconText: 'text-[#D97706]' },
  'University View':      { iconBg: 'bg-[#E6F4FE]', iconText: 'text-[#0284C7]' },
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [forceDesktopCollapse, setForceDesktopCollapse] = useState(false);

  useEffect(() => {
    setForceDesktopCollapse(location.pathname.includes('/question-bank/mcq-generator') || location.pathname.includes('/question-bank/exam-generator'));
  }, [location.pathname]);

  useEffect(() => {
    const handleToggle = () => setForceDesktopCollapse(v => !v);
    window.addEventListener('toggleDesktopSidebar', handleToggle);
    return () => window.removeEventListener('toggleDesktopSidebar', handleToggle);
  }, []);

  useEffect(() => {
    api.get('/api/settings').then((r: any) => {
      if (r.data?.schoolName) setSchoolName(r.data.schoolName);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const role = (user.role || '').toUpperCase();

  const getLinks = () => {
    const base = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];
    if (role === 'GROUP_CHAIRMAN') return [
      { to: '/chairman', label: 'Executive Dashboard', icon: Crown },
      { to: '/finance', label: 'Consolidated Finance', icon: CreditCard },
      { to: '/reports', label: 'Group Analytics', icon: BarChart3 },
      { to: '/teachers', label: 'Faculty Directory', icon: GraduationCap },
      { to: '/students', label: 'Student Directory', icon: Users },
      { to: '/announcements', label: 'Group Broadcasts', icon: Megaphone },
      { to: '/university-demo', label: 'University View', icon: School },
    ];
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return [...base,
      { to: '/students',      label: 'Students',      icon: Users         },
      { to: '/students/birthdays', label: 'Birthdays', icon: Cake         },
      { to: '/students/promotion', label: 'Promotion', icon: GraduationCap },
      { to: '/admissions',    label: 'Admissions',    icon: UserPlus      },
      { to: '/teachers',      label: 'Teachers',      icon: GraduationCap },
      { to: '/classes',       label: 'Classes',       icon: School        },
      { to: '/address-collection/admin', label: 'Address Data', icon: Users },
      { to: '/subjects',      label: 'Subjects',      icon: BookOpen      },
      { to: '/attendance',    label: 'Attendance',    icon: CalendarCheck },
      
      { to: '/exams',         label: 'Examination',         icon: ClipboardList },
      { to: '/competitive-exams',  label: 'Online Exam Module',  icon: PenTool   },
      { to: '/timetable',     label: 'Timetable',     icon: Calendar      },
      { to: '/leave/gate-pass', label: 'Gate Pass',    icon: MapPin       },
      { to: '/leave',    label: 'Leave',         icon: UserCheck     },
      { to: '/finance',       label: 'Finance',       icon: CreditCard    },
      { to: '/finance/pending-approvals', label: 'Fee Approvals', icon: CreditCard },
      { to: '/announcements', label: 'Announcements', icon: Megaphone     },
      { to: '/messages',      label: 'Messages',      icon: MessageSquare },
      { to: '/reports',       label: 'Reports',       icon: BarChart3     },
      // HR Section
      { to: '/hr/salary',        label: 'HR Salary',         icon: Shield    },
      { to: '/teacher-attendance', label: 'Staff Attendance', icon: UserCheck },
      { to: '/homework',         label: 'Homework',          icon: BookOpen  },
      ...(role === 'SUPER_ADMIN' ? [{ to: '/office-tools', label: 'Office Tools', icon: Briefcase }] : []),
      ...(role === 'SUPER_ADMIN' || role === 'ADMIN' ? [{ to: '/id-cards', label: 'ID Cards', icon: IdCard }] : []),
      ...(role === 'SUPER_ADMIN' ? [{ to: '/question-bank', label: 'Question Bank', icon: Database }] : []),
      
      { to: '/transport',     label: 'Transport',     icon: Bus },
      { to: '/staff-management', label: 'Staff Roles', icon: Shield },
      { to: '/settings/website', label: 'Website CMS', icon: Target },
      { to: '/settings',      label: 'Settings',      icon: Settings      },
    ];
    if (role === 'TEACHER') return [...base, 
      { to: '/admissions/register', label: 'Admissions', icon: UserPlus },
      { to: '/students',          label: 'Total Students', icon: Users         },
      { to: '/students/birthdays', label: 'Birthdays', icon: Cake              },
      { to: '/attendance',        label: 'Attendance',     icon: CalendarCheck },
      { to: '/address-collection/teacher', label: 'Address Data', icon: Users },
      { to: '/answer-key',        label: 'Answer Key',     icon: Key           },
      { to: '/homework',          label: 'Homework',       icon: BookOpen      },
      { to: '/exams',             label: 'Examination',    icon: PenTool       },
      { to: '/competitive-exams', label: 'Online Exam Module', icon: PenTool    },
      { to: '/timetable',         label: 'Timetable',      icon: Calendar      },
      
      { to: '/leave', label: 'Leave',          icon: UserCheck     },
      { to: '/salary',            label: 'My Salary',      icon: CreditCard    },
      { to: '/announcements',     label: 'Announcements',  icon: Megaphone     },
      { to: '/messages',          label: 'Messages',       icon: MessageSquare },
    ];
    if (role === 'STUDENT') return [...base,
      { to: '/exams',     label: 'My Grades',     icon: ClipboardList },
      { to: '/competitive-exams', label: 'Online Exam Module', icon: PenTool },
      { to: '/attendance',label: 'Attendance',    icon: CalendarCheck },
      { to: '/timetable', label: 'Timetable',     icon: Calendar      },
      { to: '/homework',  label: 'Homework',      icon: BookOpen      },
      { to: '/finance',   label: 'My Fees',       icon: CreditCard    },
      
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/messages',  label: 'Messages',      icon: MessageSquare },
    ];
    if (role === 'ACCOUNTANT') return [...base,
      { to: '/finance',   label: 'Finance',       icon: CreditCard    },
      { to: '/finance/pending-approvals', label: 'Fee Approvals', icon: CreditCard },
      
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/messages',  label: 'Messages',      icon: MessageSquare },
    ];
    return base;
  };

  const links = getLinks();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FC]">
      {/* Brand Header */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-200/80 bg-gradient-to-br from-[#F6F3FF] via-white to-[#F4F7FC]">
        <div className="flex items-center gap-3 pr-6 lg:pr-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white overflow-hidden border border-[#DDD4FE] shadow-[0_4px_14px_rgba(91,61,245,0.15)]">
            <img
              src="/logo.png?v=1"
              alt="School Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-[#5B3DF5] font-black text-sm">JY</span>';
              }}
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h1 className="text-[15px] font-black text-slate-900 leading-tight break-words tracking-tight">
              {schoolName || 'JY School'}
            </h1>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#EFEAFE] text-[#5B3DF5] border border-[#DDD4FE] text-[9.5px] font-extrabold uppercase tracking-wider w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              School ERP Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links (Zero truncation — all labels 100% visible) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-1">
        {links.map(l => {
          const { to, label, icon: Icon } = l;
          const hasMoreSpecificMatch = links.some(
            other => other.to !== to && other.to.startsWith(to + '/') && (location.pathname === other.to || location.pathname.startsWith(other.to + '/'))
          );
          const isActive = !hasMoreSpecificMatch && (
            to === '/dashboard'
              ? location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
              : location.pathname === to || location.pathname.startsWith(to + '/')
          );
          const c = NAV_COLORS[label] || NAV_COLORS['Settings'];

          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              onMouseEnter={() => {
                if (window.innerWidth > 1024 || user?.role === 'SUPER_ADMIN') {
                  hoverTimeoutRef.current = setTimeout(() => {
                    import('../../router/routeImports').then(module => {
                      const loader = module.routeImports[to];
                      if (loader) loader();
                    }).catch(() => {});
                  }, 150);
                }
              }}
              onMouseLeave={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer select-none group border ${
                isActive
                  ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] text-white border-transparent shadow-[0_6px_16px_-4px_rgba(91,61,245,0.45)]'
                  : 'bg-transparent border-transparent text-slate-700 hover:text-slate-950 hover:bg-white hover:border-slate-200/80 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]'
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'bg-white/20 text-white' : `${c.iconBg} ${c.iconText}`
                }`}
              >
                <Icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span className="flex-1 leading-snug break-words whitespace-normal tracking-tight">
                {label}
              </span>
              {isActive && (
                <span className="w-1.5 h-4 rounded-full bg-white/90 shrink-0 shadow-xs" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer: App Install + Profile */}
      <div className="px-3 pb-3.5 pt-3 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs space-y-2.5">
        {!isInstalled && (
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/JYSchool.apk';
              link.download = 'JYSchool.apk';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[#5B3DF5] to-[#7B3DF5] hover:opacity-95 text-white rounded-xl shadow-[0_4px_14px_rgba(91,61,245,0.3)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm shrink-0">
                🚀
              </div>
              <div className="text-left">
                <p className="font-extrabold text-xs leading-tight text-white">Install App</p>
                <p className="text-[10px] font-medium text-white/85 leading-tight">Get School Application</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex flex-1 items-center gap-2.5 min-w-0 group cursor-pointer"
            title="Update Profile"
          >
            {user.photoUrl ? (
              <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden border border-[#DDD4FE] group-hover:border-[#5B3DF5] transition-colors">
                <img src={getPhotoUrl(user.photoUrl)} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl shrink-0 bg-[#EFEAFE] text-[#5B3DF5] font-black text-xs flex items-center justify-center border border-[#DDD4FE]">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-slate-900 break-words leading-snug group-hover:text-[#5B3DF5] transition-colors">
                {user.name}
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-[#5B3DF5] bg-[#F3EEFF] px-2 py-0.5 rounded-full">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 bg-white border-r border-slate-200/90 shadow-[4px_0_24px_rgba(15,23,42,0.04)] transform transition-transform duration-300 ease-out ${forceDesktopCollapse ? 'lg:hidden lg:absolute' : 'lg:relative lg:translate-x-0'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-3 z-10 p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        {renderContent()}
      </aside>
    </>
  );
};
export default Sidebar;



