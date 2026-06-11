// Normalize backend image URLs to absolute Emergent URLs so Next/Image can
// optimize them, and so they work both server-side and client-side.

import { BACKEND_URL } from "./api";

export function normalizeImageUrl(url) {
  if (!url) return null;
  // Already absolute → leave it alone (unless it's pointing to the wrong
  // preview URL — we don't auto-rewrite to avoid surprises).
  if (/^https?:\/\//.test(url)) return url;
  // Relative path like "/api/files/xxx" → prefix with backend host
  if (url.startsWith("/")) return `${BACKEND_URL}${url}`;
  // Bare path
  return `${BACKEND_URL}/${url}`;
}
