// Use relative URL when running on production domain, otherwise use env variable
function getApiBase() {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  // In browser, if current host differs from env URL host, use relative path
  if (typeof window !== 'undefined' && envUrl) {
    try {
      const envHost = new URL(envUrl).host;
      const currentHost = window.location.host;
      if (currentHost !== envHost) {
        // We're on a different domain (e.g. iranobservatory.org), use relative
        return '/api';
      }
    } catch (e) {
      // fallback
    }
  }
  return `${envUrl}/api`;
}

export const API = getApiBase();
