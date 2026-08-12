import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let isRegistered = false;

export const registerPushNotifications = async (userId: string, tokenStr: string) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  if (isRegistered) return;

  try {
    // Request permission to use push notifications
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('User denied push notification permission');
      return;
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();
    isRegistered = true;

    // Create a notification channel for Android (required for high priority banner/heads-up notifications)
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'default',
          name: 'Important Notifications',
          description: 'Used for important alerts and banners',
          importance: 5, // 5 = MAX (Heads-up banner)
          visibility: 1, // 1 = PUBLIC (Show on lock screen)
          sound: 'default',
          vibration: true,
        });
      } catch (e) {
        console.error('Error creating push channel', e);
      }
    }

    // Clear old listeners to avoid duplicates on re-renders
    await PushNotifications.removeAllListeners();

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send token to backend
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/users/device-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenStr}`
          },
          body: JSON.stringify({ deviceToken: token.value })
        });
        console.log('Token successfully sent to backend.');
      } catch (e) {
        console.error('Error sending token to backend', e);
      }
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      window.dispatchEvent(new CustomEvent('appPushNotification', { detail: notification }));
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};
