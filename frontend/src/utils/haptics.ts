import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      let impactStyle = ImpactStyle.Light;
      if (style === 'medium') impactStyle = ImpactStyle.Medium;
      if (style === 'heavy') impactStyle = ImpactStyle.Heavy;

      await Haptics.impact({ style: impactStyle });
    }
  } catch (e) {
    // Graceful fallback for non-supporting web browsers
  }
};

export const triggerHapticNotification = async (type: 'success' | 'warning' | 'error' = 'success') => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      let notificationType = NotificationType.Success;
      if (type === 'warning') notificationType = NotificationType.Warning;
      if (type === 'error') notificationType = NotificationType.Error;

      await Haptics.notification({ type: notificationType });
    }
  } catch (e) {
    // Graceful fallback
  }
};
