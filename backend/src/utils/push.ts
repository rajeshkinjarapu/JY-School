import webpush from 'web-push';
import { prisma } from './prisma';

// Generate standard VAPID keys on startup if env vars are missing
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

try {
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || generated.publicKey,
      privateKey: process.env.VAPID_PRIVATE_KEY || generated.privateKey
    };
  }
} catch (e) {
  console.error('Error initializing VAPID keys:', e);
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@jyschool.edu',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (e) {
    console.error('Error setting VAPID details:', e);
  }
}

export const getVapidPublicKey = () => vapidKeys.publicKey;

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  tag?: string;
}

export const sendWebPushNotification = async (
  target: { userIds?: string[]; roles?: string[] },
  payload: PushPayload
) => {
  try {
    const whereClause: any = {};
    if (target.userIds && target.userIds.length > 0) {
      whereClause.userId = { in: target.userIds };
    } else if (target.roles && target.roles.length > 0) {
      whereClause.user = { role: { in: target.roles } };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: payload.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      requireInteraction: true,
      data: {
        url: payload.url || '/dashboard'
      },
      tag: payload.tag || 'general-alert'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, pushPayload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid, clean up DB
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`Web Push failed for subscription ${sub.id}:`, err.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error in sendWebPushNotification:', error);
  }
};
