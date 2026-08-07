import { StatusBar, Style } from '@capacitor/status-bar';

export const initNativeMobileApp = async () => {
  if (typeof window === 'undefined' || !(window as any).Capacitor) return;

  try {
    // 1. Configure Native Status Bar (Dark theme, matches app title bar)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('Native status bar setup skipped:', e);
  }
};
