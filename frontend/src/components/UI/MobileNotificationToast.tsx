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

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto hide active toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

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
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-96 z-[100] animate-bounce-in">
      <div 
        onClick={() => {
          if (activeToast.link) navigate(activeToast.link);
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
  );
};
