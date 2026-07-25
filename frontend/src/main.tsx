import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import { registerSW } from 'virtual:pwa-register';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: isFastModeEnabled ? 5 * 60 * 1000 : 0, // 5 minutes caching for desktop or super admin
    },
  },
});

// Handle Vite dynamic import errors (e.g. after a new deployment)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
