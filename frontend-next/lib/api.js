// API layer — single source of truth for backend calls.
// Server-side calls go directly to BACKEND_URL (no rewrite hop).
// Client-side calls go through /api/* (rewritten by next.config.mjs).

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://iran-events-live.preview.emergentagent.com";

// `revalidate` defaults to 5 minutes — articles refresh that often. Override
// per-call when needed (e.g. revalidate=60 for the homepage).
// Retries on transient errors (5xx, timeouts) so cold-starts don't poison the
// ISR cache with an empty payload.
async function fetchJson(
  path,
  { revalidate = 300, tags = [], retries = 2, retryDelay = 800, ...opts } = {}
) {
  const url = `${BACKEND_URL}${path}`;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s per attempt
      const r = await fetch(url, {
        ...opts,
        signal: controller.signal,
        next: { revalidate, tags },
        headers: { Accept: "application/json", ...(opts.headers || {}) },
      });
      clearTimeout(timeout);

      // Retry on 5xx (backend issue), keep 4xx as-is (real error).
      if (!r.ok) {
        if (r.status >= 500 && attempt < retries) {
          lastError = new Error(`Backend ${path} → ${r.status}`);
          await new Promise((res) => setTimeout(res, retryDelay * (attempt + 1)));
          continue;
        }
        throw new Error(`Backend ${path} → ${r.status}`);
      }
      return r.json();
    } catch (err) {
      lastError = err;
      // Network / abort / timeout → retry
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, retryDelay * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error(`Backend ${path} failed`);
}

// Public endpoints used by the SSR pages.
// IMPORTANT: most list endpoints DO NOT swallow errors with `.catch(() => [])`.
// If we did, an empty array would be cached by Next.js ISR for the whole
// revalidate window — leaving the public site looking empty after the backend
// briefly hiccups. Letting the error propagate forces Next.js to retry the
// build on the next request, which is what we want.
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

  // Articles by category — used by /[lang]/articles/category/[slug]
  listByCategory: (slug) =>
    fetchJson(`/api/articles/by-category/${encodeURIComponent(slug)}`),

  // Articles by tag — used by /[lang]/articles/tag/[slug]
  listByTag: (slug) =>
    fetchJson(`/api/articles/by-tag/${encodeURIComponent(slug)}`),

  // All tags (for generateStaticParams + display).
  // Tags failing is non-blocking (the nav still works), so we keep the fallback.
  listTags: () => fetchJson(`/api/tags`).catch(() => []),

  // Monitor indexes (live indicators) — non-fatal: home keeps rendering even
  // if the monitor briefly fails, but we no longer cache `null` for 10 min.
  monitorIndexes: () =>
    fetchJson(`/api/dashboard/indexes`, { revalidate: 600 }).catch(() => null),

  // Sitemap — also non-fatal (the sitemap page handles null).
  sitemap: () => fetchJson(`/api/sitemap/data`).catch(() => null),
};

export { BACKEND_URL };
