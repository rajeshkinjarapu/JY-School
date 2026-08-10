import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, ArrowLeft, User, LogOut, Settings, Home } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPhotoUrl } from '../../utils/photo';
import { NotificationBell } from '../UI/NotificationBell';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  forceShow?: boolean;
  hideMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, forceShow, hideMenuButton }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = React.useState(false);

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const showBackButton = !isDashboard;

  if (!isDashboard && !forceShow) {
    return null;
  }

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
      className={`print:hidden lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-3.5 pb-2.5 shadow-lg shadow-black/30`}
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)'
      }}
    >
      {/* Left: Hamburger + Home + Back + Page Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Hamburger — mobile only */}
        {!hideMenuButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.();
              window.dispatchEvent(new CustomEvent('toggleSidebar'));
            }}
            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Home Button for Teachers & All Users */}
        <Link
          to="/dashboard"
          className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center border border-white/20 bg-white/10"
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
        >
          <Home className="w-4 h-4 text-white" />
        </Link>

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

        {/* Page Title - Hidden on desktop to avoid double headings with Hero Banners */}
        <div className="flex items-center gap-2 min-w-0 md:hidden">
          <h1 className="text-base font-black text-white leading-tight truncate drop-shadow-md">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 shrink-0 relative">
        <NotificationBell />

        {user?.role === 'TEACHER' && (
          <>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden shadow-sm hover:border-white/50 transition-colors"
            >
              {getPhotoUrl(user?.photoUrl) ? (
                <img src={getPhotoUrl(user?.photoUrl)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>
            
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                <div className="absolute top-10 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in-up">
                  <Link 
                    to="/profile" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile Update
                  </Link>
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
export default Header;
