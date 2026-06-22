import { api } from "@/lib/api";
import { T, isValidLang, LANG_META, LANGUAGES } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import Link from "next/link";

// Tag landing page — long-tail SEO. Articles tagged with a specific keyword
// (e.g. "khamenei", "irgc", "bourse-tehran") get grouped here.

export const revalidate = 600;

// Pre-render the top 50 tags at build time so most tag URLs are pure HTML.
// Less popular tags still render on-demand with ISR caching.
export async function generateStaticParams() {
  try {
    const tags = await api.listTags();
    const top = (tags || []).slice(0, 50);
    const params = [];
    for (const lang of LANGUAGES) {
      for (const tag of top) {
        if (tag.slug) params.push({ lang, slug: tag.slug });
      }
    }
    return params;
  } catch {
    return [];
  }
}

async function resolveTagName(slug) {
  const tags = await api.listTags().catch(() => []);
  const match = (tags || []).find((t) => t.slug === slug);
  return match?.name || slug.replace(/-/g, " ");
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  const name = await resolveTagName(slug);

  const title = lang === "fr"
    ? `Articles : ${name} | Iran Observatory · Decrypt & Intel`
    : lang === "fa"
      ? `مقالات: ${name} — رصدخانه ایران`
      : `Articles tagged: ${name} | Iran Observatory · Decrypt & Intel`;

  const description = lang === "fr"
    ? `Tous les articles d'Iran Observatory sur "${name}". Analyses indépendantes, factuelles, multilingues.`
    : lang === "fa"
      ? `همه مقالات رصدخانه ایران درباره "${name}".`
      : `All Iran Observatory articles tagged "${name}". Independent, fact-based, multilingual reporting.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/articles/tag/${slug}`,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [
          LANG_META[l].htmlLang,
          `https://iranobservatory.org/${l}/articles/tag/${slug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `https://iranobservatory.org/${lang}/articles/tag/${slug}`,
      type: "website",
      locale: LANG_META[lang].htmlLang,
    },
  };
}

export default async function TagPage({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  const [articles, name] = await Promise.all([
    api.listByTag(slug).catch(() => []),
    resolveTagName(slug),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.articles, item: `https://iranobservatory.org/${lang}/articles` },
          { "@type": "ListItem", position: 2, name: `#${name}`, item: `https://iranobservatory.org/${lang}/articles/tag/${slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: `#${name}`,
        itemListElement: articles.slice(0, 20).map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://iranobservatory.org/${lang}/article/${a.slug || a.id}`,
          name: a[`title_${lang}`] || a.title_en || a.title_fr,
        })),
      },
    ],
  };

  return (
    <>
      <Header lang={lang} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href={`/${lang}/articles`}
            className="text-zinc-400 hover:text-white font-mono text-[11px] uppercase tracking-widest"
          >
            ← {t.articles}
          </Link>
          <h1
            className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mt-3"
            data-testid="tag-heading"
          >
            #{name}
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            {articles.length}{" "}
            {lang === "fr" ? "article(s)" : lang === "fa" ? "مقاله" : "article(s)"}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          <p className="text-center text-zinc-500 py-20">—</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} lang={lang} />
            ))}
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </>
  );
}
