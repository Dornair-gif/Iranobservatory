import { api } from "@/lib/api";
import { T, LANG_META, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { normalizeImageUrl as normalizeFileUrl } from "@/lib/imageUrl";
import { notFound } from "next/navigation";
import Link from "next/link";

// ISR — refresh every 5 minutes from the backend.
export const revalidate = 300;

const RSS_FEED = {
  fr: "https://rss.app/embed/v1/wall/0aYtpxYInp9pe8Vz",
  en: "https://rss.app/embed/v1/wall/FEE7VHvtL1clR9Vl",
  fa: "https://rss.app/embed/v1/wall/MxRGXqHK1g7F9S8S",
};

const DONATE_URL = "https://www.helloasso.com/associations/dorna/formulaires/2";

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

  // Fetch articles, studies, briefing in parallel.
  const [allNews, studies, briefing] = await Promise.all([
    api.listArticles({ limit: 20, lang }).catch(() => []),
    api.listStudies({ limit: 8, lang }).catch(() => []),
    api.monitorIndexes(),
  ]);

  // De-dup: keep only news that aren't in the studies list
  const studyIds = new Set(studies.map((s) => s.id));
  const newsArticles = allNews.filter(
    (a) =>
      !studyIds.has(a.id) &&
      (!a.content_type || a.content_type === "news")
  );

  const featured = newsArticles[0];
  const side = newsArticles.slice(1, 4);
  const more = newsArticles.slice(4, 10);

  const supportCopy = {
    fr: {
      lead: "Si ces analyses vous sont utiles, soutenez l'indépendance d'Iran Observatory.",
      cta: "Soutenir",
    },
    en: {
      lead: "If this work is useful to you, consider supporting Iran Observatory's independence.",
      cta: "Support us",
    },
    fa: {
      lead: "اگر این تحلیل‌ها برای شما مفیدند، از استقلال رصدخانه ایران حمایت کنید.",
      cta: "حمایت",
    },
  }[lang];

  const sidebarCopy = {
    fr: { situation: "Situation", briefs: "Briefs Hebdo", briefsBlurb: "Chaque lundi, un résumé analytique de la semaine sur l'Iran.", viewBriefs: "Voir les briefs", monitor: "Iran Monitor" },
    en: { situation: "Briefing", briefs: "Weekly Briefs", briefsBlurb: "Every Monday, an analytical summary of the week on Iran.", viewBriefs: "View Briefs", monitor: "Iran Monitor" },
    fa: { situation: "بریفینگ", briefs: "گزارش‌های هفتگی", briefsBlurb: "هر دوشنبه، خلاصه تحلیلی هفته درباره ایران.", viewBriefs: "مشاهده گزارش‌ها", monitor: "رصد ایران" },
  }[lang];

  const studiesHeading = lang === "fr" ? "Études & Analyses" : lang === "fa" ? "مطالعات و تحلیل‌ها" : "Studies & Analysis";
  const viewAll = lang === "fr" ? "Tous les articles" : lang === "fa" ? "همه مقالات" : "All Articles";
  const viewAllStudies = lang === "fr" ? "Voir tout" : lang === "fa" ? "مشاهده همه" : "View All";
  const swipeHint = lang === "fr" ? "← Glissez pour voir plus →" : lang === "fa" ? "← برای دیدن بیشتر بکشید →" : "← Swipe to see more →";

  return (
    <>
      <Header lang={lang} />

      {/* Hero */}
      <section className="relative bg-[#0a1628] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-tehran-milad-night.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[#1E3A5F]/70" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#3DB883]">
                {lang === "fr" ? "Live • Independent" : lang === "fa" ? "زنده • مستقل" : "Live • Independent"}
              </span>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none mb-4">
              {t.siteName}
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-white font-heading font-bold mb-4 tracking-tight leading-snug">
              {t.tagline}
            </p>
            <p className="text-lg sm:text-xl text-[#3DB883] font-bold">"{t.motto}"</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/articles`}
                className="bg-[#3DB883] text-white uppercase tracking-widest text-xs font-bold px-6 py-3 hover:bg-[#2D9E6E] transition-colors inline-flex items-center gap-2"
                data-testid="hero-articles-btn"
              >
                {t.latestNews} →
              </Link>
              <Link
                href={`/${lang}/monitor`}
                className="border border-[#3DB883] text-[#3DB883] uppercase tracking-widest text-xs font-bold px-6 py-3 hover:bg-[#3DB883] hover:text-white transition-colors"
                data-testid="hero-monitor-btn"
              >
                {sidebarCopy.monitor} →
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3DB883]" />
      </section>

      {/* Articles + Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="latest">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Articles (2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-[#1E3A5F]">
                {t.latestNews}
              </h2>
              <Link
                href={`/${lang}/articles`}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#1E3A5F] hover:text-[#3DB883] transition-colors"
                data-testid="view-all-articles-link"
              >
                {viewAll} →
              </Link>
            </div>

            {newsArticles.length === 0 ? (
              <p className="text-center text-zinc-500 py-16 border border-zinc-200 bg-zinc-50 rounded-xl font-mono text-sm uppercase tracking-wider">—</p>
            ) : (
              <div className="space-y-5">
                {featured && <ArticleCard article={featured} lang={lang} featured />}

                {side.map((article) => (
                  <Link
                    key={article.id}
                    href={`/${lang}/article/${article.slug || article.id}`}
                    className="group flex gap-4 items-start bg-white border border-zinc-100 rounded-lg p-4 hover:shadow-md hover:border-zinc-200 transition-all"
                    data-testid={`side-article-${article.id}`}
                  >
                    {article.image_url && (
                      <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={normalizeFileUrl(article.image_url)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#3DB883] font-bold">
                          {article.category || "News"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString(
                                lang === "fr" ? "fr-FR" : lang === "fa" ? "fa-IR" : "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : ""}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-lg leading-snug mb-1.5 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
                        {article[`title_${lang}`] || article.title_en || article.title_fr}
                      </h3>
                      <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                        {article[`summary_${lang}`] || article.summary_en || article.summary_fr}
                      </p>
                    </div>
                  </Link>
                ))}

                {more.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {more.map((a) => (
                      <ArticleCard key={a.id} article={a} lang={lang} />
                    ))}
                  </div>
                )}

                <Link
                  href={`/${lang}/articles`}
                  className="flex items-center justify-center gap-2 py-3 border border-[#1E3A5F] text-[#1E3A5F] font-mono text-xs uppercase tracking-wider hover:bg-[#1E3A5F] hover:text-white transition-colors rounded-lg"
                >
                  {viewAll} →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <aside className="space-y-6">
            {/* Situation Briefing */}
            {briefing?.situation_summary && (
              <div className="bg-[#1E3A5F] text-white rounded-xl p-6 sticky top-28" data-testid="home-briefing">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#3DB883] text-lg">●</span>
                  <h3 className="font-heading font-black text-xl tracking-tight">
                    {sidebarCopy.situation}
                  </h3>
                  <span className="w-2 h-2 ml-auto bg-[#3DB883] rounded-full animate-pulse" />
                </div>
                <ul className="space-y-3 mb-5">
                  {(Array.isArray(briefing.situation_summary)
                    ? briefing.situation_summary
                    : [briefing.situation_summary]
                  )
                    .slice(0, 4)
                    .map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-200 leading-relaxed">
                        <span className="text-[#3DB883] mt-0.5 flex-shrink-0 font-bold">•</span>
                        <span className="line-clamp-3">{b}</span>
                      </li>
                    ))}
                </ul>
                <Link
                  href={`/${lang}/monitor`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#3DB883] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded"
                  data-testid="home-monitor-link"
                >
                  {sidebarCopy.monitor} →
                </Link>
              </div>
            )}

            {/* Weekly Briefs */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-heading font-bold text-lg text-[#1E3A5F] mb-2">
                {sidebarCopy.briefs}
              </h3>
              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{sidebarCopy.briefsBlurb}</p>
              <Link
                href={`/${lang}/studies`}
                className="flex items-center gap-2 text-amber-700 font-mono text-xs uppercase tracking-wider hover:text-amber-900 transition-colors"
              >
                {sidebarCopy.viewBriefs} →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Live RSS Feed */}
      <section className="bg-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-white">
                {t.liveFeed}
              </h2>
              <p className="text-zinc-400 text-base mt-1">{t.feedDesc}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#3DB883] rounded-full animate-pulse" />
              <span className="font-mono text-sm uppercase tracking-widest text-[#3DB883]">
                {lang === "fr" ? "Live" : lang === "fa" ? "زنده" : "Live"}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 p-6 sm:p-8">
            <iframe
              src={RSS_FEED[lang] || RSS_FEED.en}
              style={{ width: "100%", height: "900px", border: "none" }}
              title="Iran Observatory Live News Feed"
              data-testid="rss-widget"
            />
          </div>
        </div>
      </section>

      {/* Studies & Analysis */}
      {studies.length > 0 && (
        <section className="bg-[#f8fafc] border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-[#1E3A5F]">
                {studiesHeading}
              </h2>
              <Link
                href={`/${lang}/studies`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 text-xs font-mono uppercase tracking-wider hover:bg-purple-200 transition-colors rounded"
              >
                {viewAllStudies} →
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: "thin" }}>
              {studies.map((study) => (
                <Link
                  key={study.id}
                  href={`/${lang}/article/${study.slug || study.id}`}
                  className="flex-shrink-0 w-80 sm:w-96 bg-white border border-zinc-200 hover:shadow-lg transition-shadow group snap-start overflow-hidden rounded-lg"
                >
                  {study.image_url && (
                    <div className="w-full aspect-[16/9] overflow-hidden bg-zinc-100 relative">
                      <img
                        src={normalizeFileUrl(study.image_url)}
                        alt={study[`title_${lang}`] || study.title_en || ""}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <span
                        className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white ${
                          study.content_type === "study"
                            ? "bg-indigo-600"
                            : study.content_type === "brief"
                            ? "bg-amber-600"
                            : "bg-purple-600"
                        }`}
                      >
                        {study.content_type === "study"
                          ? lang === "fr" ? "Étude" : lang === "fa" ? "مطالعه" : "Study"
                          : study.content_type === "brief"
                          ? lang === "fr" ? "Brief" : lang === "fa" ? "گزارش" : "Brief"
                          : lang === "fr" ? "Analyse" : lang === "fa" ? "تحلیل" : "Analysis"}
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-xs text-zinc-400 font-mono mb-2">
                      {new Date(study.published_at || study.created_at).toLocaleDateString(
                        lang === "fr" ? "fr-FR" : lang === "fa" ? "fa-IR" : "en-US"
                      )}
                    </p>
                    <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
                      {study[`title_${lang}`] || study.title_en || study.title_fr}
                    </h3>
                    <p className="text-sm text-zinc-600 line-clamp-3">
                      {study[`summary_${lang}`] || study.summary_en || study.summary_fr}
                    </p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-mono uppercase tracking-wider text-[#3DB883]">
                      {t.readMore} →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-center text-zinc-500 text-sm mt-4">{swipeHint}</p>
          </div>
        </section>
      )}

      {/* Support Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] via-[#2a4d75] to-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="text-[#3DB883] text-2xl">♥</span>
            <p className="text-base text-white/90 font-medium">{supportCopy.lead}</p>
          </div>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3DB883] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded-full shadow-lg shadow-[#3DB883]/20"
            data-testid="support-cta"
          >
            ♥ {supportCopy.cta}
          </a>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSignup lang={lang} />

      <Footer lang={lang} />
    </>
  );
}
