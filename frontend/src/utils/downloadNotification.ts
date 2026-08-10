import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const triggerDownloadNotification = async (title: string, message: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: message,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_launcher_foreground',
          }
        ]
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/logo.png',
          badge: '/logo.png',
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/logo.png',
              badge: '/logo.png',
            });
          }
        });
      }
    }
  } catch (e) {}
};
