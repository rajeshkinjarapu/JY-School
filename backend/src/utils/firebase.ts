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

const SERVER_BASE_URL = 'http://66.116.252.191:19998';

export const formatImageUrl = (url?: string): string | undefined => {
  if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return undefined; // Firebase rejects data: URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${SERVER_BASE_URL}${trimmed}`;
  return `${SERVER_BASE_URL}/${trimmed}`;
};

/**
 * Send a push notification to a specific device token with optional image
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
) => {
  if (!token) return;

  const validImageUrl = formatImageUrl(imageUrl);

  try {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
        ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'jyschool_alerts_v3',
          defaultSound: true,
          defaultVibrateTimings: true,
          priority: 'max',
          ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1,
          },
        },
        ...(validImageUrl ? { fcmOptions: { imageUrl: validImageUrl } } : {}),
      },
      data: {
        ...(data || {}),
        title,
        body,
        ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
      },
      token,
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Error sending message to token:', error);
  }
};

/**
 * Send push notification to multiple device tokens efficiently
 */
export const sendMulticastPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
) => {
  if (!tokens || tokens.length === 0) return;

  const validImageUrl = formatImageUrl(imageUrl);
  const cleanTokens = Array.from(new Set(tokens.filter(Boolean)));

  // Firebase allows max 500 tokens per multicast batch
  const BATCH_SIZE = 500;
  for (let i = 0; i < cleanTokens.length; i += BATCH_SIZE) {
    const batch = cleanTokens.slice(i, i + BATCH_SIZE);

    try {
      const multicastMessage: admin.messaging.MulticastMessage = {
        tokens: batch,
        notification: {
          title,
          body,
          ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'jyschool_alerts_v3',
            defaultSound: true,
            defaultVibrateTimings: true,
            priority: 'max',
            ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
            },
          },
          ...(validImageUrl ? { fcmOptions: { imageUrl: validImageUrl } } : {}),
        },
        data: {
          ...(data || {}),
          title,
          body,
          ...(validImageUrl ? { imageUrl: validImageUrl } : {}),
        },
      };

      const response = await admin.messaging().sendEachForMulticast(multicastMessage);
      console.log(`Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${batch.length}`);
    } catch (err) {
      console.error('Multicast push error:', err);
    }
  }
};
