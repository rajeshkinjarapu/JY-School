import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Show back button only when:
  // 1. Not on dashboard/root
  // 2. There's actual browser history to go back to
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const hasHistory = window.history.length > 1;
  const showBackButton = !isDashboard && hasHistory;

  const handleBack = () => {
    // Go back in react-router history
    navigate(-1);
  };

  return (
    <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-[length:200%_200%] animate-gradient-shift shadow-lg shadow-indigo-500/20">

      {/* Left: Hamburger + Back + Page Title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center shadow-sm border border-white/20"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Page Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white leading-tight truncate drop-shadow-md">{title}</h1>
          </div>
        </div>
      </div>

      {/* Right: Empty (reserved for future icons) */}
      <div className="flex items-center gap-2 shrink-0">
      </div>
    </header>
  );
};
export default Header;
