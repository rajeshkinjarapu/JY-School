import { StatusBar, Style } from '@capacitor/status-bar';

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export const initNativeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Configure Native Status Bar
    // We use a dark color and overlay: false so the OS pushes the WebView down automatically.
    // This perfectly prevents the notch from overlapping the UI without needing CSS hacks.
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    await StatusBar.setOverlaysWebView({ overlay: false });

    // 2. Hardware Back Button Handling
    CapacitorApp.addListener('backButton', (data) => {
      // If we are at the root dashboard, exit the app
      if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
        CapacitorApp.exitApp();
      } else if (data.canGoBack) {
        window.history.back();
      } else {
        window.history.back(); // Fallback to browser history
      }
    });

  } catch (e) {
    console.warn('Native mobile app setup skipped or failed:', e);
  }
};
