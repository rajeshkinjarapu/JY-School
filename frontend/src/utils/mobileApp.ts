import { StatusBar, Style } from '@capacitor/status-bar';

import { Capacitor } from '@capacitor/core';

export const initNativeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Configure Native Status Bar (Dark theme, matches app title bar)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    // Force overlay to true so CSS safe-area-insets can work
    await StatusBar.setOverlaysWebView({ overlay: true });
    
    // Add safe area padding to root to prevent notch overlap on all pages
    const root = document.getElementById('root');
    if (root) {
      root.style.paddingTop = 'max(env(safe-area-inset-top), 40px)';
    }
  } catch (e) {
    console.warn('Native status bar setup skipped:', e);
  }
};
