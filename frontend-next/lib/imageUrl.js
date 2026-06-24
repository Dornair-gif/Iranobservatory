// Normalize backend image URLs.
//
// IMPORTANT: for `/api/*` paths we deliberately keep the URL RELATIVE so the
// image is fetched from the same origin (iranobservatory.org), which Vercel
// then proxies to the Emergent backend via the rewrite in next.config.mjs.
// Same-origin serving means:
//   - Cloudflare can cache the response (Emergent preview URL can't)
//   - No mixed-content or CORS edge cases
//   - The site keeps working if the preview URL host briefly hiccups
//     (Vercel still serves the cached image)
//
// External absolute URLs are kept untouched (customer-assets etc.).

import { BACKEND_URL } from "./api";

export function normalizeImageUrl(url) {
  if (!url) return null;

  // Already absolute. If it points to the Emergent preview backend, rewrite
  // it to a relative `/api/*` path so we go through the Vercel proxy and
  // benefit from same-origin caching. Otherwise keep it as-is.
  if (/^https?:\/\//.test(url)) {
    try {
      const u = new URL(url);
      if (u.hostname.endsWith(".emergentagent.com") && u.pathname.startsWith("/api/")) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* ignore — fall through to "leave alone" */
    }
    return url;
  }

  // Relative `/api/files/...` → keep relative. The browser hits the public
  // domain, Vercel proxies to the backend.
  if (url.startsWith("/api/")) return url;

  // Other relative paths (e.g. bare slug, legacy) → prefix with backend host.
  if (url.startsWith("/")) return `${BACKEND_URL}${url}`;
  return `${BACKEND_URL}/${url}`;
}
