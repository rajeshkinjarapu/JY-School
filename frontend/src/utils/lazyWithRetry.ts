import React, { lazy } from 'react';

/**
 * Resilient lazy loader for dynamic imports.
 * Automatically recovers from chunk load errors caused by new deployments/builds.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory();
      // Reset reload count on successful chunk load
      sessionStorage.removeItem('chunk_retry_count');
      return module;
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString?.() || '';
      const isChunkError =
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('dynamically imported module') ||
        errorMsg.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError) {
        const retryCount = parseInt(sessionStorage.getItem('chunk_retry_count') || '0', 10);
        if (retryCount < 2) {
          sessionStorage.setItem('chunk_retry_count', (retryCount + 1).toString());

          // Clean up service workers and CacheStorage
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const reg of registrations) {
                await reg.unregister();
              }
            } catch (_) {}
          }

          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              for (const key of keys) {
                await caches.delete(key);
              }
            } catch (_) {}
          }

          // Strip any retry_preload search param to avoid URL pollution
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('retry_preload');
          window.location.replace(cleanUrl.toString());

          // Return pending promise so React doesn't re-render with error before page reloads
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw error;
    }
  });
}

