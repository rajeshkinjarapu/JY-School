import * as admin from 'firebase-admin';
import path from 'path';

try {
  // Initialize Firebase Admin SDK
  const serviceAccountPath = path.resolve(__dirname, '../config/firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization error', error);
}

/**
 * Send a push notification to a specific device token
 * @param token FCM Device Token
 * @param title Notification Title
 * @param body Notification Body
 * @param data Optional data payload
 */
export const sendPushNotification = async (token: string, title: string, body: string, data?: Record<string, string>) => {
  if (!token) return;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
