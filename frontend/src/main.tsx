import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
});

let isSuperAdmin = false;
try {
  const token = localStorage.getItem('accessToken');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'SUPER_ADMIN') {
      isSuperAdmin = true;
    }
  }
} catch (e) {
  // Ignore decode errors
}

const isDesktop = window.innerWidth > 1024;
const isFastModeEnabled = isDesktop || isSuperAdmin;

if (Capacitor.isNativePlatform()) {
  document.body.classList.add('is-native');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes — prevents unnecessary refetches on navigation
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const idbPersister = {
  persistClient: async (client: any) => {
    await set('react-query-cache', client);
  },
  restoreClient: async () => {
    return await get('react-query-cache');
  },
  removeClient: async () => {
    await del('react-query-cache');
  },
};

// Handle Vite dynamic import errors (e.g. after a new deployment)
window.addEventListener('vite:preloadError', () => {
  // If PWA Service Worker is caching old index.html, unregister it before reloading
  // to break the infinite chunk load error loop
  const url = new URL(window.location.href);
  if (url.searchParams.has('retry_preload')) {
    console.error("Vite preload error after retry. The chunk is still missing.");
    return;
  }
  url.searchParams.set('retry_preload', '1');
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
      window.location.href = url.toString();
    }).catch(() => {
      window.location.href = url.toString();
    });
  } else {
    window.location.href = url.toString();
  }
});



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: idbPersister }}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
