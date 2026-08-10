import { StatusBar, Style } from '@capacitor/status-bar';

import { Capacitor } from '@capacitor/core';

export const initNativeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Configure Native Status Bar
    // We use a dark color and overlay: false so the OS pushes the WebView down automatically.
    // This perfectly prevents the notch from overlapping the UI without needing CSS hacks.
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('Native status bar setup skipped:', e);
  }
};
