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

  // Show back button only when not on dashboard/root
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const showBackButton = !isDashboard;

  const handleBack = () => {
    // If we have history state indicating we navigated within the app, go back
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Fallback: navigate to parent route
      const segments = location.pathname.split('/').filter(Boolean);
      if (segments.length > 1) {
        navigate('/' + segments.slice(0, -1).join('/'));
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 shadow-lg shadow-black/30" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}>

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
