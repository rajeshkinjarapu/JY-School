const getBackendBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host.includes('duckdns.org')) {
      return 'https://jy-school-production-f159.up.railway.app';
    }
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:19998`;
    }
  }
  return 'http://localhost:5000';
};

export const getPhotoUrl = (photoUrl?: string | null): string | undefined => {
  if (!photoUrl) return undefined;
  
  const trimmed = photoUrl.trim().replace(/\\/g, '/');
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;

  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  const backendUrl = getBackendBaseUrl().replace(/\/+$/, '');

  // Rewrite any saved localhost URL to the active backend URL
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    const rewritten = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
    return `${backendUrl}${rewritten.startsWith('/') ? '' : '/'}${rewritten}`;
  }
  
  // If it's an external HTTP link, return it as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // If it's a relative path (e.g. /api/users/... or /uploads/...), prepend the backend URL
  return trimmed.startsWith('/') ? `${backendUrl}${trimmed}` : `${backendUrl}/${trimmed}`;
};
