import { api } from "@/lib/api";
import { T, isValidLang, LANG_META, LANGUAGES } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import Link from "next/link";

// Category landing page — one of the strongest SEO levers because it bundles
// articles by topic (Sanctions, Politics, IRGC, …). Each route is ISR with
// rich BreadcrumbList + ItemList JSON-LD.

export const revalidate = 600;

// Known category slugs from the React SPA. New categories added in the
// backend will still resolve via on-demand rendering — only static params
// here drive build-time pre-rendering.
const CATEGORY_LABELS = {
  news:      { fr: "Actualités", en: "News", fa: "اخبار" },
  politics:  { fr: "Politique", en: "Politics", fa: "سیاست" },
  economy:   { fr: "Économie", en: "Economy", fa: "اقتصاد" },
  society:   { fr: "Société", en: "Society", fa: "جامعه" },
  military:  { fr: "Militaire", en: "Military", fa: "نظامی" },
  diplomacy: { fr: "Diplomatie", en: "Diplomacy", fa: "دیپلماسی" },
  sanctions: { fr: "Sanctions", en: "Sanctions", fa: "تحریم‌ها" },
  rights:    { fr: "Droits humains", en: "Human Rights", fa: "حقوق بشر" },
  analysis:  { fr: "Analyses", en: "Analysis", fa: "تحلیل" },
  study:     { fr: "Études", en: "Studies", fa: "مطالعات" },
  brief:     { fr: "Briefs", en: "Briefs", fa: "بریف‌ها" },
};

export function generateStaticParams() {
  const slugs = Object.keys(CATEGORY_LABELS);
  const params = [];
  for (const lang of LANGUAGES) {
    for (const slug of slugs) {
      params.push({ lang, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  const labelObj = CATEGORY_LABELS[slug] || { fr: slug, en: slug, fa: slug };
  const heading = labelObj[lang] || labelObj.fr;
  const t = T[lang];

  const title = lang === "fr"
    ? `${heading} sur l'Iran — Iran Observatory · Decrypt & Intel`
    : lang === "fa"
      ? `${heading} ایران — رصدخانه ایران`
      : `${heading} on Iran — Iran Observatory · Decrypt & Intel`;

  const description = lang === "fr"
    ? `Articles, analyses et études d'Iran Observatory sur le thème "${heading}". Couverture indépendante, multilingue, sources vérifiées.`
    : lang === "fa"
      ? `مقالات و تحلیل‌های رصدخانه ایران درباره "${heading}". پوشش مستقل، چندزبانه، منابع تأیید‌شده.`
      : `Articles and analyses from Iran Observatory on "${heading}". Independent, multilingual, verified sources.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/articles/category/${slug}`,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [
          LANG_META[l].htmlLang,
          `https://iranobservatory.org/${l}/articles/category/${slug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `https://iranobservatory.org/${lang}/articles/category/${slug}`,
      type: "website",
      locale: LANG_META[lang].htmlLang,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  const articles = await api.listByCategory(slug).catch(() => []);
  const labelObj = CATEGORY_LABELS[slug] || { fr: slug, en: slug, fa: slug };
  const heading = labelObj[lang] || labelObj.fr;

  // BreadcrumbList + ItemList JSON-LD for Google rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.articles, item: `https://iranobservatory.org/${lang}/articles` },
          { "@type": "ListItem", position: 2, name: heading, item: `https://iranobservatory.org/${lang}/articles/category/${slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: heading,
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
            data-testid="category-heading"
          >
            {heading}
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
