import React from 'react';
import { Menu, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, action }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 px-3 py-3 sm:px-8 sm:py-3 shadow-md border-b border-indigo-900/50 shrink-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center justify-between sm:justify-start w-full sm:w-auto">
        <div className="flex items-center gap-2">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
            className="p-1.5 -ml-1 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {!isDashboard && (
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Home Dashboard"
            >
              <Home className="w-5 h-5" />
            </Link>
          )}
          
          {icon && (
            <div className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-md text-white rounded-lg sm:rounded-xl border border-white/20 shadow-inner flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        {/* Title Centered on Mobile */}
        <h1 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 whitespace-nowrap">
          {title}
        </h1>
        
        {/* Invisible spacer on mobile to balance flex-between if needed, or we just rely on absolute positioning for title */}
        <div className="w-8 h-8 lg:hidden"></div>
      </div>

      {action && (
        <div className="relative z-10 flex shrink-0 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  );
};
