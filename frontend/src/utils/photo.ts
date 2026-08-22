export const getPhotoUrl = (photoUrl?: string | null): string | undefined => {
  if (!photoUrl) return undefined;
  
  const trimmed = photoUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
  
  // If it's a base64 data URI or an external HTTP link, return it as is
  if (trimmed.startsWith('data:') || trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // If it's a relative path (old format), prepend the backend URL
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return trimmed.startsWith('/') ? `${backendUrl}${trimmed}` : `${backendUrl}/${trimmed}`;
};
