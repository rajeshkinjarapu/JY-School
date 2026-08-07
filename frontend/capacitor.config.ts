import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jyschool.erp',
  appName: 'JY School ERP',
  webDir: 'dist',
  server: {
    url: 'http://148.113.8.82:19999',
    cleartext: true, // Allow live HTTP connections to VPS
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#243e8b',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
