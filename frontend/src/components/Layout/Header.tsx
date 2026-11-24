import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, ArrowLeft, User, LogOut, Settings, Home, Calendar, ChevronDown, Plus, Check, Sparkles, Loader2, X } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPhotoUrl } from '../../utils/photo';
import { NotificationBell } from '../UI/NotificationBell';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import toast from 'react-hot-toast';

export const AcademicYearSelector: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { academicYears, selectedYear, setSelectedYear, createAcademicYear } = useAcademicYear();
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [cloneFrom, setCloneFrom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLight = variant === 'light';

  const handleSelect = (year: string) => {
    setSelectedYear(year);
    setOpen(false);
    toast.success(`Academic Year ${year} ఎంచుకోబడింది!`, { icon: '📅' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim()) {
      toast.error('దయచేసి అకడమిక్ ఇయర్ నమోదు చేయండి (ఉదా: 2027-2028)');
      return;
    }
    setSubmitting(true);
    const ok = await createAcademicYear(newYearInput, cloneFrom || selectedYear);
    setSubmitting(false);
    if (ok) {
      setShowAddModal(false);
      setNewYearInput('');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
          isLight
            ? 'bg-slate-100/95 hover:bg-slate-200/90 border border-slate-200/90 text-slate-700'
            : 'bg-white/15 hover:bg-white/25 border border-white/20 text-white'
        }`}
        title="Select Academic Year (అకడమిక్ ఇయర్ మార్చండి)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="tracking-tight">{selectedYear}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isLight ? 'text-slate-500' : 'text-white/80'}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 mb-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Academic Session</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
              {academicYears.map((yr) => {
                const isSelected = yr === selectedYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleSelect(yr)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span>{yr}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCloneFrom(selectedYear);
                  setShowAddYearModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Academic Year</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Academic Year Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Add New Academic Year</h3>
                  <p className="text-xs text-indigo-100 font-medium">కొత్త అకడమిక్ ఇయర్ జోడించండి</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Academic Year Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2027-2028"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
                {/* Quick Year Suggestions */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
                  {['2027-2028', '2028-2029'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewYearInput(sug)}
                      className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Clone Classes & Subjects From
                </label>
                <select
                  value={cloneFrom}
                  onChange={(e) => setCloneFrom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} {yr === selectedYear ? '(Current Year - Recommended)' : ''}
                    </option>
                  ))}
                </select>
                <div className="mt-2 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2 text-xs text-indigo-800 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    ఈ ఆప్షన్ ద్వారా ప్రస్తుత సంవత్సరం ఉన్న అన్ని క్లాసులు (Nursery నుండి 10th వరకు సెక్షన్లు & సబ్జెక్టులు) కొత్త సంవత్సరానికి ఆటోమేటిక్‌గా కాపీ అవుతాయి.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  రద్దు (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>సృష్టిస్తోంది...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create & Switch Year</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/' || location.pathname === '/chairman';
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

  if (isDashboard) {
    return (
      <header className="print:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-gray-800 shadow-xs">
        {/* Left: Hamburger Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.();
              window.dispatchEvent(new CustomEvent('toggleSidebar'));
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Notification Bell + Calendar + Academic Year */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NotificationBell variant="light" />

          {/* Calendar Icon Button */}
          <button
            type="button"
            onClick={() => navigate('/attendance/holidays')}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 shadow-xs transition-colors cursor-pointer flex items-center justify-center"
            title="Academic Calendar & Holidays"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Academic Year Dropdown */}
          <AcademicYearSelector variant="light" />
        </div>
      </header>
    );
  }

  return (
    <header
      className={`print:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-3.5 py-2.5 shadow-lg shadow-black/30`}
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}
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
            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer shrink-0"
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
        <AcademicYearSelector variant="dark" />
        <NotificationBell />

        {user?.role === 'TEACHER' && (
          <>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden shadow-sm hover:border-white/50 transition-colors cursor-pointer"
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
