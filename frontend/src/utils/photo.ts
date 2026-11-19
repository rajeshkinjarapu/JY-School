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
      return `http://${host}:5000`;
    }
  }
  return 'http://localhost:5000';
};

export const getPhotoUrl = (photoUrl?: string | null): string | undefined => {
  if (!photoUrl) return undefined;
  
  const trimmed = photoUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
  
  // If it's a base64 data URI or an external HTTP link, return it as is
  if (trimmed.startsWith('data:') || trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // If it's a relative path (e.g. /api/users/... or /uploads/...), prepend the backend URL
  const backendUrl = getBackendBaseUrl();
  return trimmed.startsWith('/') ? `${backendUrl}${trimmed}` : `${backendUrl}/${trimmed}`;
};
