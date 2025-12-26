// API base URL configuration
// In development, uses relative URLs (proxied by Vite)
// In production, can be configured via environment variable

export const getApiBaseUrl = (): string => {
  // In development, use relative URLs (Vite proxy handles /api)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, check for VITE_API_URL environment variable
  // If not set, assume API is on same domain (or use Netlify proxy)
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    return apiUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Default to empty string (same origin) or Netlify proxy
  return '';
};

// Helper to build full API URL
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};



