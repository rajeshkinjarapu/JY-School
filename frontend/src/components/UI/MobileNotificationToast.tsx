import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, ShieldAlert, UserCheck, AlertTriangle, FileText, Award, Calendar, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { playNotificationChime } from '../../utils/sound';
import { useNavigate } from 'react-router-dom';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
}

export const MobileNotificationToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [modalData, setModalData] = useState<ToastNotification | null>(null);
  const prevCountRef = useRef<number>(-1);
  const navigate = useNavigate();

  const triggerNativeNotification = (item: ToastNotification) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(item.title, {
            body: item.message,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: item.id,
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
              new Notification(item.title, {
                body: item.message,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: item.id,
              });
            }
          });
        }
      }
    } catch (e) {}
  };

  const checkNewNotifications = async () => {
    try {
      const res: any = await api.get('/api/notifications');
      const data = res.data?.data || res.data || {};
      const list: ToastNotification[] = data.notifications || [];
      const unreadCount: number = data.unreadCount || 0;

      // Check if unread count increased or new unread items exist
      if (prevCountRef.current !== -1 && unreadCount > prevCountRef.current) {
        const newestUnread = list.find(n => !(n as any).isRead);
        if (newestUnread) {
          playNotificationChime();
          setActiveToast(newestUnread);
          triggerNativeNotification(newestUnread);
        }
      }
      prevCountRef.current = unreadCount;
    } catch (e) {
      // Quiet catch
    }
  };

  useEffect(() => {
    // Request permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Polling fallback
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000); 
    
    // Live Push listener from Capacitor
    const handleLivePush = (e: any) => {
      const pushData = e.detail;
      const title = pushData.title || pushData.notification?.title || 'New Notification';
      const body = pushData.body || pushData.notification?.body || '';
      
      const newToast: ToastNotification = {
        id: pushData.id || Date.now().toString(),
        title: title,
        message: body,
        type: 'INFO',
        createdAt: new Date().toISOString()
      };
      
      playNotificationChime();
      setActiveToast(newToast);
    };

    window.addEventListener('appPushNotification', handleLivePush);

    return () => {
      clearInterval(interval);
      window.removeEventListener('appPushNotification', handleLivePush);
    };
  }, []);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentX = e.touches[0].clientX;
    setSwipeOffset(currentX - touchStartRef.current);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 100) {
      setActiveToast(null);
    }
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  if (!activeToast) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ACTIVITY':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'MARKS':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'ATTENDANCE':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'RESULT':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'LEAVE':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case 'HOMEWORK':
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div 
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-96 z-[100] animate-bounce-in"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: touchStartRef.current !== null ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        opacity: Math.abs(swipeOffset) > 100 ? 0 : 1 - (Math.abs(swipeOffset) / 250)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        onClick={() => {
          setModalData(activeToast);
          setActiveToast(null);
        }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 text-white rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 cursor-pointer hover:border-indigo-400 transition-all active:scale-[0.98]"
      >
        <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0 shadow-inner">
          {getTypeIcon(activeToast.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
              Notification Alert
            </span>
            <span className="text-[10px] text-gray-400 font-bold">Just now</span>
          </div>
          <h4 className="text-xs font-black text-white mt-0.5 truncate">{activeToast.title}</h4>
          <p className="text-xs font-medium text-gray-300 mt-0.5 line-clamp-2 leading-snug">
            {activeToast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    {/* Full Details Modal */}
    {modalData && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setModalData(null)}
        />
        <div className="relative w-full max-w-sm bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 rounded-3xl shadow-2xl border border-indigo-500/30 overflow-hidden animate-bounce-in flex flex-col max-h-[85vh]">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 shadow-inner">
                {getTypeIcon(modalData.type)}
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">Notification</h3>
            </div>
            <button 
              onClick={() => setModalData(null)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
            <h4 className="text-xl font-bold text-white mb-3 leading-snug">{modalData.title}</h4>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">
                {modalData.message}
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-end gap-2 text-xs font-semibold text-slate-400">
              <span>Received:</span>
              <span className="text-indigo-300">
                {new Date(modalData.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {modalData.link && (
            <div className="p-5 border-t border-white/10 bg-black/20">
              <button
                onClick={() => {
                  navigate(modalData.link!);
                  setModalData(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
              >
                View Action Details
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
};
