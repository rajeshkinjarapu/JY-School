import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  hideOnDesktop?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, hideOnDesktop = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const showBackButton = !isDashboard;

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const segments = location.pathname.split('/').filter(Boolean);
      if (segments.length > 1) {
        navigate('/' + segments.slice(0, -1).join('/'));
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <header
      className={`print:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-3 py-2.5 shadow-lg shadow-black/30 ${hideOnDesktop ? 'lg:hidden' : ''}`}
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}
    >
      {/* Left: Hamburger + Back + Page Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 lg:hidden cursor-pointer shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center shadow-sm border border-white/20"
            title="Go Back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Page Title */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-black text-white leading-tight truncate drop-shadow-md">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: reserved */}
      <div className="flex items-center gap-2 shrink-0" />
    </header>
  );
};
export default Header;
