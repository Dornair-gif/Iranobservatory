// API layer — single source of truth for backend calls.
// Server-side calls go directly to BACKEND_URL (no rewrite hop).
// Client-side calls go through /api/* (rewritten by next.config.mjs).

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://iran-events-live.preview.emergentagent.com";

// `revalidate` defaults to 5 minutes — articles refresh that often. Override
// per-call when needed (e.g. revalidate=60 for the homepage).
async function fetchJson(path, { revalidate = 300, tags = [], ...opts } = {}) {
  const url = `${BACKEND_URL}${path}`;
  const r = await fetch(url, {
    ...opts,
    next: { revalidate, tags },
    headers: { Accept: "application/json", ...(opts.headers || {}) },
  });
  if (!r.ok) {
    // Critical: throw on bad response so Next.js does NOT cache a poisoned
    // response. ISR retries on the next request.
    throw new Error(`Backend ${path} → ${r.status}`);
  }
  return r.json();
}

// Public endpoints used by the SSR pages
export const api = {
  // Articles list (paginated). Optional filters: content_type, category, tag, lang.
  listArticles: (params = {}) => {
    const qs = new URLSearchParams({ status: "published", ...params }).toString();
    return fetchJson(`/api/articles?${qs}`);
  },

  // Single article by slug. Backend accepts both slug and id at this route.
  getArticle: (slug) => fetchJson(`/api/articles/${slug}`),

  // Studies & briefs (filter on content_type)
  listStudies: (params = {}) => {
    const qs = new URLSearchParams({
      status: "published",
      content_types: "study,analysis,brief",
      ...params,
    }).toString();
    return fetchJson(`/api/articles?${qs}`);
  },

  // Sitemap — used both by app/sitemap.ts and as a sanity check.
  sitemap: () => fetchJson(`/api/sitemap/data`).catch(() => null),
};

export { BACKEND_URL };
