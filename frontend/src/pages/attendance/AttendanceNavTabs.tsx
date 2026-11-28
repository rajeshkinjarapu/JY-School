import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AttendanceNavTabs: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const tabs = [
    ...(isAdmin
      ? [{ to: '/attendance', label: 'Dashboard', icon: LayoutDashboard, exact: true }]
      : []),
    { to: '/attendance/mark', label: 'Mark Attendance', icon: CheckSquare, exact: false },
    ...(isAdmin
      ? [{ to: '/attendance/report', label: 'Class Analytics', icon: BarChart3, exact: false }]
      : []),
    { to: '/attendance/daily-report', label: 'Daily Report', icon: FileSpreadsheet, exact: false },
  ];

  return (
    <div className="inline-flex flex-wrap items-center gap-1 bg-white border border-[#DDD7F3] rounded-[16px] p-1.5 shadow-[0_6px_18px_-6px_rgba(91,33,182,0.08)] print:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1E1B4B] hover:bg-[#F4F2FC]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
