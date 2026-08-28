import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { initNativeMobileApp } from './utils/mobileApp';
import { triggerHaptic } from './utils/haptics';
import { DataCache } from './services/dataCache';

const App: React.FC = () => {
  useEffect(() => {
    initNativeMobileApp();

    // Prefetch all core data in background immediately on app boot.
    // By the time user navigates to any page, data is already in cache → instant render.
    DataCache.prefetch(['students', 'classes', 'exams', 'teachers', 'subjects']);

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
