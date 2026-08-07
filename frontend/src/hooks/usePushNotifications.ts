import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setIsSubscribed(true);
        }
      });
    }).catch(err => {
      console.warn('Service Worker registration skipped/failed:', err);
    });
  }, []);

  const subscribeToPush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported on this browser.');
      return false;
    }

    setLoading(true);
    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Notification permission was denied. Please allow notifications in browser settings.');
        setLoading(false);
        return false;
      }

      // 2. Fetch VAPID public key from backend
      const res: any = await api.get('/api/notifications/vapid-public-key');
      const publicKey = res.data?.publicKey || res.publicKey;

      if (!publicKey) {
        toast.error('Failed to retrieve notification encryption key.');
        setLoading(false);
        return false;
      }

      // 3. Register SW & subscribe to PushManager
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Send subscription JSON payload to backend
      const subJson = subscription.toJSON();
      await api.post('/api/notifications/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setIsSubscribed(true);
      toast.success('Mobile Push Notifications enabled successfully!');
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error(error.message || 'Error subscribing to notifications');
      setLoading(false);
      return false;
    }
  };

  return {
    permission,
    isSubscribed,
    loading,
    subscribeToPush,
  };
};
