import React, { useEffect, useState, useRef } from 'react';
import { Bell, ShieldAlert, FileText, AlertTriangle, Award, Calendar, BookOpen, X } from 'lucide-react';
import api from '../../api/axios';
import { playNotificationChime } from '../../utils/sound';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
}

export const MobileNotificationToast: React.FC = () => {
  const [modalData, setModalData] = useState<ToastNotification | null>(null);
  const prevCountRef = useRef<number>(-1);
  const lastShownIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  const triggerNativeNotification = async (item: ToastNotification) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Ensure channel exists for local notifications (different from PushNotifications channel)
        try {
          await LocalNotifications.createChannel({
            id: 'high_importance_channel',
            name: 'Important Notifications',
            description: 'Used for important alerts and banners',
            importance: 5, // 5 = MAX
            visibility: 1,
            sound: 'default',
            vibration: true,
          });
        } catch (e) {
          console.error('Error creating local notification channel', e);
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title: item.title,
              body: item.message,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 50) },
              smallIcon: 'ic_launcher_foreground',
              channelId: 'high_importance_channel',
            }
          ]
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
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

      if (prevCountRef.current !== -1 && unreadCount > prevCountRef.current) {
        const newestUnread = list.find(n => !(n as any).isRead);
        if (newestUnread && newestUnread.id !== lastShownIdRef.current) {
          lastShownIdRef.current = newestUnread.id;
          playNotificationChime();
          triggerNativeNotification(newestUnread);
        }
      }
      prevCountRef.current = unreadCount;
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000); 
    
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
      
      if (newToast.id !== lastShownIdRef.current) {
        lastShownIdRef.current = newToast.id;
        playNotificationChime();
        triggerNativeNotification(newToast);
      }
    };

    window.addEventListener('appPushNotification', handleLivePush);

    let localNotifListener: any = null;
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const item = {
          id: String(notification.notification.id),
          title: notification.notification.title || '',
          message: notification.notification.body || '',
          type: 'INFO',
          createdAt: new Date().toISOString()
        };
        setModalData(item);
      }).then(l => localNotifListener = l);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('appPushNotification', handleLivePush);
      if (localNotifListener) {
        localNotifListener.remove();
      }
    };
  }, []);

  if (!modalData) return null;

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
    <>
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
