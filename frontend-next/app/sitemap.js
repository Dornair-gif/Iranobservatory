import { api, BACKEND_URL } from "@/lib/api";
import { LANGUAGES } from "@/lib/i18n";

// Single sitemap.xml served from the Next app at /sitemap.xml.
// Generated dynamically from the backend article list, in all 3 languages,
// with proper <xhtml:link rel="alternate" hreflang="..."> via the Next API.
// Revalidate every hour — articles are cached at the same TTL.

export const revalidate = 3600;

const SITE = "https://iranobservatory.org";

export default async function sitemap() {
  const entries = [];
  const now = new Date();

  // Static editorial routes (in all languages)
  const STATIC_PATHS = ["", "/articles", "/studies", "/monitor", "/a-propos", "/methodologie", "/manifeste"];
  for (const path of STATIC_PATHS) {
    for (const lang of LANGUAGES) {
      entries.push({
        url: `${SITE}/${lang}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            LANGUAGES.map((l) => [l, `${SITE}/${l}${path}`])
          ),
        },
      });
    }
  }

  // Articles
  try {
    const articles = await api.listArticles({ limit: 500 });
    for (const a of articles) {
      const slug = a.slug || a.id;
      const last = a.updated_at || a.published_at || a.created_at;
      for (const lang of LANGUAGES) {
        entries.push({
          url: `${SITE}/${lang}/article/${slug}`,
          lastModified: last ? new Date(last) : now,
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              LANGUAGES.map((l) => [l, `${SITE}/${l}/article/${slug}`])
            ),
          },
        });
      }
    }
  } catch (e) {
    console.error("sitemap: backend articles fetch failed", e);
  }

  return entries;
}
