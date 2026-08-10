export const triggerDownloadNotification = (title: string, message: string) => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
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
