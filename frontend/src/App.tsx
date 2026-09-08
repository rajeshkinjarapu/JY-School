import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { initNativeMobileApp } from './utils/mobileApp';
import { triggerHaptic } from './utils/haptics';
import { DataCache } from './services/dataCache';

const App: React.FC = () => {
  useEffect(() => {
    initNativeMobileApp();

    // Prefetch all core data in background immediately on app boot ONLY if logged in
    // This prevents unauthenticated public pages (like progress card view) from being redirected to login
    if (localStorage.getItem('accessToken')) {
      DataCache.prefetch(['students', 'classes', 'exams', 'teachers', 'subjects']);
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a'))) {
        triggerHaptic('light');
      }
    };

    window.addEventListener('click', handleGlobalClick, { passive: true });
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
