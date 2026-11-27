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
import { getCachedRbacMatrix, syncRbacMatrixFromServer, RbacMatrixMap, RbacRole, RbacModuleKey } from '../../utils/rbac';

interface SidebarProps { isOpen: boolean; setIsOpen: (v: boolean) => void; }

const roleLabels: Record<string, string> = {
  GROUP_CHAIRMAN: 'Group Chairman',
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', TEACHER: 'Teacher',
  STUDENT: 'Student', ACCOUNTANT: 'Accountant',
  TRANSPORT_MANAGER: 'Transport Mgr', SECURITY: 'Security',
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [forceDesktopCollapse, setForceDesktopCollapse] = useState(false);
  const [rbacMatrix, setRbacMatrix] = useState<RbacMatrixMap>(getCachedRbacMatrix);

  useEffect(() => {
    setForceDesktopCollapse(
      location.pathname.includes('/question-bank/mcq-generator') ||
      location.pathname.includes('/question-bank/exam-generator') ||
      location.pathname.includes('/students/custom-report') ||
      location.pathname.includes('/students/report')
    );
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
    syncRbacMatrixFromServer().then(setRbacMatrix).catch(() => {});
    const onMatrixChange = () => setRbacMatrix(getCachedRbacMatrix());
    window.addEventListener('rbacMatrixUpdated', onMatrixChange);
    return () => window.removeEventListener('rbacMatrixUpdated', onMatrixChange);
  }, []);

  if (!user) return null;

  const role = (user.role || '').toUpperCase();
  const canAccessModule = (modKey: RbacModuleKey) => {
    if (role === 'SUPER_ADMIN') return true;
    const lvl = rbacMatrix[modKey]?.[role as RbacRole];
    return lvl !== undefined && lvl !== 'None';
  };

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

    const items: any[] = [...base];

    if (canAccessModule('students')) {
      if (role === 'TEACHER') {
        items.push(
          { to: '/admissions/register', label: 'Admissions', icon: UserPlus },
          { to: '/students', label: 'Total Students', icon: Users },
          { to: '/students/birthdays', label: 'Birthdays', icon: Cake },
          { to: '/address-collection/teacher', label: 'Address Data', icon: Users },
        );
      } else {
        items.push(
          { to: '/students', label: 'Students', icon: Users },
          { to: '/students/birthdays', label: 'Birthdays', icon: Cake },
          { to: '/students/promotion', label: 'Promotion', icon: GraduationCap },
          { to: '/admissions', label: 'Admissions', icon: UserPlus },
          ...(role === 'SUPER_ADMIN' || role === 'ADMIN' ? [{ to: '/teachers', label: 'Teachers', icon: GraduationCap }] : []),
          { to: '/classes', label: 'Classes', icon: School },
          { to: '/address-collection/admin', label: 'Address Data', icon: Users },
          { to: '/subjects', label: 'Subjects', icon: BookOpen },
        );
      }
    }

    if (canAccessModule('attendance')) {
      items.push(
        { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
        ...(role === 'SUPER_ADMIN' || role === 'ADMIN' ? [{ to: '/teacher-attendance', label: 'Staff Attendance', icon: UserCheck }] : []),
        { to: '/homework', label: 'Homework', icon: BookOpen },
      );
    }

    if (canAccessModule('exams')) {
      items.push(
        { to: '/exams', label: 'Examination', icon: ClipboardList },
        { to: '/competitive-exams', label: 'Online Exam Module', icon: PenTool },
        { to: '/timetable', label: 'Timetable', icon: Calendar },
        ...(role === 'TEACHER' ? [{ to: '/answer-key', label: 'Answer Key', icon: Key }] : []),
        ...(role !== 'TEACHER' ? [{ to: '/reports', label: 'Reports', icon: BarChart3 }] : []),
      );
    }

    if (canAccessModule('gatePass')) {
      items.push({ to: '/leave/gate-pass', label: 'Gate Pass', icon: MapPin });
    }

    if (canAccessModule('hrSalary')) {
      items.push(
        { to: '/leave', label: 'Leave', icon: UserCheck },
        ...(role === 'TEACHER'
          ? [{ to: '/salary', label: 'My Salary', icon: CreditCard }]
          : [{ to: '/hr/salary', label: 'HR Salary', icon: Shield }]),
      );
    }

    if (canAccessModule('finance')) {
      items.push(
        { to: '/finance', label: 'Finance', icon: CreditCard },
        { to: '/finance/pending-approvals', label: 'Fee Approvals', icon: CreditCard },
      );
    }

    items.push(
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/messages', label: 'Messages', icon: MessageSquare },
    );

    if (canAccessModule('questionBank') && (role === 'SUPER_ADMIN' || rbacMatrix.questionBank?.[role as RbacRole] === 'Full')) {
      items.push({ to: '/question-bank', label: 'Question Bank', icon: Database });
    }

    if (canAccessModule('transport')) {
      items.push({ to: '/transport', label: 'Transport', icon: Bus });
    }

    if (canAccessModule('settings')) {
      items.push(
        ...(role === 'SUPER_ADMIN' ? [{ to: '/office-tools', label: 'Office Tools', icon: Briefcase }] : []),
        { to: '/id-cards', label: 'ID Cards', icon: IdCard },
        { to: '/staff-management', label: 'Staff Roles', icon: Shield },
        { to: '/settings/website', label: 'Website CMS', icon: Target },
        { to: '/settings', label: 'Settings', icon: Settings },
      );
    }

    return items;
  };

  const links = getLinks();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0E2666] via-[#0B1F54] to-[#081742] text-white">
      {/* Brand Header */}
      <div className="px-3 pt-4 pb-3.5 border-b border-white/12 bg-white/5 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 pr-6 lg:pr-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white overflow-hidden border-2 border-white/80 shadow-[0_6px_18px_rgba(4,12,40,0.45)]">
            <img
              src="/logo.png?v=1"
              alt="School Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-[#0E2666] font-black text-sm">JY</span>';
              }}
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h1 className="text-sm font-black text-white leading-tight truncate tracking-tight drop-shadow-2xs">
              {schoolName || 'JY School'}
            </h1>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/12 text-blue-100 border border-white/20 text-[9px] font-extrabold uppercase tracking-wider w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              School ERP Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links (Compact & crisp contrast on Dark Blue) */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
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
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200 cursor-pointer select-none group border ${
                isActive
                  ? 'bg-white text-[#0B1F54] border-white shadow-[0_8px_20px_-4px_rgba(4,12,40,0.5)]'
                  : 'bg-transparent border-transparent text-blue-100/90 hover:text-white hover:bg-white/10 hover:border-white/15'
              }`}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive
                    ? 'bg-[#E8F0FF] text-[#143D99]'
                    : 'bg-white/12 text-blue-100 group-hover:bg-white/20 group-hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span className="flex-1 leading-snug truncate tracking-tight">
                {label}
              </span>
              {isActive && (
                <span className="w-1 h-3.5 rounded-full bg-[#143D99] shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer: App Install + Profile */}
      <div className="px-2.5 pb-3 pt-2.5 border-t border-white/12 bg-[#07143A]/45 backdrop-blur-xs space-y-2">
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
            className="w-full flex items-center justify-between px-2.5 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] hover:brightness-110 text-white rounded-xl border border-white/20 shadow-[0_6px_18px_rgba(14,165,233,0.3)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs shrink-0">
                🚀
              </div>
              <div className="text-left min-w-0">
                <p className="font-extrabold text-[11px] leading-tight text-white truncate">Install App</p>
                <p className="text-[9.5px] font-medium text-sky-100 leading-tight truncate">Get School App</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/85 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm shadow-sm">
          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex flex-1 items-center gap-2 min-w-0 group cursor-pointer"
            title="Update Profile"
          >
            {user.photoUrl ? (
              <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-white/70 group-hover:border-white transition-colors">
                <img src={getPhotoUrl(user.photoUrl)} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg shrink-0 bg-white text-[#0E2666] font-black text-xs flex items-center justify-center border border-white/80">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold text-white truncate leading-snug group-hover:text-sky-200 transition-colors">
                {user.name}
              </p>
              <span className="inline-block mt-0.5 text-[9.5px] font-bold text-blue-100 bg-white/15 border border-white/20 px-1.5 py-0.5 rounded-full">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-rose-500/80 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-blue-950/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-[224px] shrink-0 bg-[#0B1F54] border-r border-blue-900/50 shadow-[4px_0_24px_rgba(8,23,66,0.22)] transform transition-transform duration-300 ease-out ${forceDesktopCollapse ? 'lg:hidden lg:absolute' : 'lg:relative lg:translate-x-0'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-3 z-10 p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        {renderContent()}
      </aside>
    </>
  );
};
export default Sidebar;



