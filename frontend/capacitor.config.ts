import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jyschool.erp',
  appName: 'JY School ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true, // HTTP connections allow చేయడానికి
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
