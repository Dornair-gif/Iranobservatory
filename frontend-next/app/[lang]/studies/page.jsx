import { api } from "@/lib/api";
import { T, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = T[lang];
  return {
    title: t.studies,
    description: lang === "fr"
      ? "Études et briefs Iran Observatory — analyses structurelles, anticipations longues, scénarios."
      : lang === "en"
      ? "Iran Observatory studies and briefs — structural analyses, long-horizon forecasts, scenarios."
      : "مطالعات و گزارش‌های رصدخانه ایران",
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/studies`,
      languages: {
        "fr-FR": "https://iranobservatory.org/fr/studies",
        "en-US": "https://iranobservatory.org/en/studies",
        "fa-IR": "https://iranobservatory.org/fa/studies",
      },
    },
  };
}

export default async function StudiesPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  // Fetch in parallel: deep studies/analyses on one side, weekly briefs on the other.
  const [studiesAndAnalyses, briefs] = await Promise.all([
    api.listArticles({ limit: 50, content_types: "study,analysis", lang }).catch(() => []),
    api.listArticles({ limit: 12, content_types: "brief", lang }).catch(() => []),
  ]);

  const studiesHeading =
    lang === "fr" ? "Études & Analyses" : lang === "fa" ? "مطالعات و تحلیل‌ها" : "Studies & Analyses";
  const studiesBlurb =
    lang === "fr"
      ? "Décryptages structurels et notes d'anticipation signés par la direction éditoriale."
      : lang === "fa"
      ? "رمزگشایی‌های ساختاری و یادداشت‌های آینده‌نگر امضادار."
      : "Structural decryptions and forward-looking notes signed by the editorial direction.";

  const briefsHeading =
    lang === "fr" ? "Briefs Hebdomadaires" : lang === "fa" ? "گزارش‌های هفتگی" : "Weekly Briefs";
  const briefsBlurb =
    lang === "fr"
      ? "La synthèse stratégique de la semaine, livrée chaque lundi. Format court, lecture rapide."
      : lang === "fa"
      ? "خلاصه‌ی راهبردی هفته، هر دوشنبه. کوتاه و سریع‌خوان."
      : "The weekly strategic recap, delivered every Monday. Short format, quick read.";

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero */}
        <header className="border-b border-zinc-200 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-3">
            Decrypt
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#0f1e2e]">
            {t.studies}
          </h1>
        </header>

        {/* Studies & Analyses — primary editorial block */}
        <section data-testid="decrypt-studies-section">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-700 mb-2">
                {lang === "fr" ? "Décryptages" : lang === "fa" ? "رمزگشایی" : "Decryption"}
              </p>
              <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#0f1e2e]">
                {studiesHeading}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 italic max-w-2xl">{studiesBlurb}</p>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {studiesAndAnalyses.length} {lang === "fr" ? "publication" : lang === "fa" ? "مقاله" : "items"}
              {studiesAndAnalyses.length > 1 && lang === "fr" ? "s" : ""}
            </span>
          </div>
          {studiesAndAnalyses.length === 0 ? (
            <p className="text-zinc-400 italic">—</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studiesAndAnalyses.map((a) => (
                <ArticleCard key={a.id} article={a} lang={lang} />
              ))}
            </div>
          )}
        </section>

        {/* Visual divider */}
        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
          <div className="relative flex justify-center">
            <span className="bg-white px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              ◆ ◆ ◆
            </span>
          </div>
        </div>

        {/* Weekly Briefs — emerald distinct block */}
        {briefs.length > 0 && (
          <section
            className="relative -mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-y border-emerald-200 px-4 sm:px-6 lg:px-8 py-12"
            data-testid="decrypt-briefs-section"
          >
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(4,120,87,0.15) 1px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-700">
                      {lang === "fr" ? "Hebdomadaire · Lundi" : lang === "fa" ? "هفتگی · دوشنبه" : "Weekly · Monday"}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-700 text-emerald-50 font-mono text-[9px] uppercase tracking-wider rounded">
                      Brief
                    </span>
                  </div>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-emerald-900">
                    {briefsHeading}
                  </h2>
                  <p className="mt-2 text-sm text-emerald-800/80 italic max-w-2xl">{briefsBlurb}</p>
                </div>
                <span className="font-mono text-xs text-emerald-700/70">
                  {briefs.length} {lang === "fr" ? "brief" : "brief"}
                  {briefs.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {briefs.map((brief) => (
                  <a
                    key={brief.id}
                    href={`/${lang}/article/${brief.slug || brief.id}`}
                    className="group relative bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-0.5 transition-all rounded-lg overflow-hidden"
                    style={{ boxShadow: "0 1px 0 rgba(4,120,87,0.08), 0 4px 12px rgba(4,120,87,0.06)" }}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-3 -right-7 w-24 bg-emerald-700 text-emerald-50 text-center font-mono text-[9px] uppercase tracking-widest py-0.5 rotate-45">
                        Brief
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-700">
                          {new Date(brief.published_at || brief.created_at).toLocaleDateString(
                            lang === "fr" ? "fr-FR" : lang === "fa" ? "fa-IR" : "en-US",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-3 leading-tight text-emerald-950 group-hover:text-emerald-900 transition-colors">
                        {brief[`title_${lang}`] || brief.title_en || brief.title_fr}
                      </h3>
                      <p className="text-sm text-emerald-900/75 line-clamp-3 leading-relaxed mb-4">
                        {brief[`summary_${lang}`] || brief.summary_en || brief.summary_fr}
                      </p>
                      <div className="flex items-center gap-1 pt-3 border-t border-emerald-200 text-xs font-mono uppercase tracking-wider text-emerald-700">
                        {lang === "fr" ? "Lire le brief" : lang === "fa" ? "خواندن گزارش" : "Read brief"} →
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
