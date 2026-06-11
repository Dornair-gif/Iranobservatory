import { api } from "@/lib/api";
import { T, LANG_META, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import Link from "next/link";

// ISR — refresh the homepage every 5 minutes from the backend.
export const revalidate = 300;

const RSS_FEED = {
  fr: "https://rss.app/embed/v1/wall/0aYtpxYInp9pe8Vz",
  en: "https://rss.app/embed/v1/wall/FEE7VHvtL1clR9Vl",
  fa: "https://rss.app/embed/v1/wall/MxRGXqHK1g7F9S8S",
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = T[lang];
  const langMeta = LANG_META[lang];
  return {
    title: t.seo.home.title,
    description: t.seo.home.description,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}`,
      languages: {
        "fr-FR": "https://iranobservatory.org/fr",
        "en-US": "https://iranobservatory.org/en",
        "fa-IR": "https://iranobservatory.org/fa",
        "x-default": "https://iranobservatory.org/fr",
      },
    },
    openGraph: {
      title: t.seo.home.title,
      description: t.seo.home.description,
      url: `https://iranobservatory.org/${lang}`,
      locale: langMeta.htmlLang,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function HomePage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  // Fetch latest articles + studies in parallel — both ISR-cached.
  const [articles, studies] = await Promise.all([
    api.listArticles({ limit: 9 }).catch(() => []),
    api.listStudies({ limit: 6 }).catch(() => []),
  ]);

  return (
    <>
      <Header lang={lang} />

      {/* Hero */}
      <section className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3DB883] mb-4">
            {t.independent}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight max-w-4xl">
            {t.siteName}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-300 max-w-2xl leading-relaxed">{t.tagline}</p>
          <p className="mt-4 text-sm text-[#3DB883] italic">{t.motto}</p>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e]">{t.latestNews}</h2>
          <Link
            href={`/${lang}/articles`}
            className="font-mono text-xs uppercase tracking-widest text-[#3DB883] hover:text-[#1E3A5F]"
          >
            {t.articles} →
          </Link>
        </div>
        {articles.length === 0 ? (
          <p className="text-zinc-500">—</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* Studies */}
      {studies.length > 0 && (
        <section className="bg-[#fbfaf7] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e]">{t.studies}</h2>
              <Link
                href={`/${lang}/studies`}
                className="font-mono text-xs uppercase tracking-widest text-[#3DB883] hover:text-[#1E3A5F]"
              >
                {t.studies} →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studies.map((a) => (
                <ArticleCard key={a.id} article={a} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live RSS feed (language-aware) */}
      <section className="bg-[#0f1e2e] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-2">{t.liveFeed}</h2>
          <p className="text-sm text-zinc-400 mb-6">{t.feedDesc}</p>
          <div className="bg-white/5 border border-white/10 p-6 sm:p-8">
            <iframe
              src={RSS_FEED[lang] || RSS_FEED.en}
              style={{ width: "100%", height: "900px", border: "none" }}
              title="Iran Observatory Live Feed"
            />
          </div>
        </div>
      </section>

      <Footer lang={lang} />
    </>
  );
}
