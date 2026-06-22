import { api } from "@/lib/api";
import { T, LANG_META, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import Link from "next/link";

// Iran Monitor — SSR dashboard fed by /api/dashboard/indexes.
// Shows the situation briefing + key indicators + latest dated analyses.

export const revalidate = 600;

const RSS_FEED = {
  fr: "https://rss.app/embed/v1/wall/0aYtpxYInp9pe8Vz",
  en: "https://rss.app/embed/v1/wall/FEE7VHvtL1clR9Vl",
  fa: "https://rss.app/embed/v1/wall/MxRGXqHK1g7F9S8S",
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  return {
    title: lang === "fr"
      ? "Iran Monitor — Indicateurs et briefing | Iran Observatory"
      : lang === "fa"
      ? "رصد ایران — شاخص‌ها و بریفینگ"
      : "Iran Monitor — Indicators & briefing | Iran Observatory",
    description: lang === "fr"
      ? "Iran Monitor : briefing stratégique, indicateurs en temps réel sur l'Iran (politique, économie, sanctions, droits humains, diplomatie)."
      : lang === "fa"
      ? "رصد ایران: بریفینگ استراتژیک و شاخص‌های لحظه‌ای ایران."
      : "Iran Monitor: strategic briefing and real-time indicators on Iran (politics, economy, sanctions, human rights, diplomacy).",
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/monitor`,
      languages: {
        "fr-FR": "https://iranobservatory.org/fr/monitor",
        "en-US": "https://iranobservatory.org/en/monitor",
        "fa-IR": "https://iranobservatory.org/fa/monitor",
      },
    },
  };
}

const INDEX_LABELS = {
  fr: {
    political_tension: "Tension politique",
    economic_pressure: "Pression économique",
    sanctions_pressure: "Pression des sanctions",
    human_rights: "Droits humains",
    diplomacy: "Diplomatie",
    military: "Militaire",
    regional: "Régional",
  },
  en: {
    political_tension: "Political tension",
    economic_pressure: "Economic pressure",
    sanctions_pressure: "Sanctions pressure",
    human_rights: "Human rights",
    diplomacy: "Diplomacy",
    military: "Military",
    regional: "Regional",
  },
  fa: {
    political_tension: "تنش سیاسی",
    economic_pressure: "فشار اقتصادی",
    sanctions_pressure: "فشار تحریم‌ها",
    human_rights: "حقوق بشر",
    diplomacy: "دیپلماسی",
    military: "نظامی",
    regional: "منطقه‌ای",
  },
};

function severityColor(value) {
  // value 0-100; higher = more severe
  const v = Number(value);
  if (isNaN(v)) return "bg-zinc-200 text-zinc-700";
  if (v >= 75) return "bg-red-100 text-red-700 border-red-200";
  if (v >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  if (v >= 25) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

export default async function MonitorPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  const [briefing, latestStudies] = await Promise.all([
    api.monitorIndexes(),
    api.listStudies({ limit: 6, lang }).catch(() => []),
  ]);

  const indexes = briefing?.indexes || briefing?.scores || {};
  const indexLabels = INDEX_LABELS[lang] || INDEX_LABELS.en;
  const situation = Array.isArray(briefing?.situation_summary)
    ? briefing.situation_summary
    : briefing?.situation_summary
    ? [briefing.situation_summary]
    : [];

  const updatedAt = briefing?.updated_at || briefing?.created_at;

  const copy = {
    fr: { situation: "Briefing stratégique", indicators: "Indicateurs clés", latest: "Dernières études & analyses", liveFeed: "Veille en direct", lastUpdate: "Dernière mise à jour", noData: "Briefing en cours de mise à jour. Revenez dans quelques minutes." },
    en: { situation: "Strategic briefing", indicators: "Key indicators", latest: "Latest studies & analyses", liveFeed: "Live monitoring", lastUpdate: "Last updated", noData: "Briefing is updating. Please check back shortly." },
    fa: { situation: "بریفینگ استراتژیک", indicators: "شاخص‌های کلیدی", latest: "آخرین مطالعات و تحلیل‌ها", liveFeed: "رصد زنده", lastUpdate: "آخرین به‌روزرسانی", noData: "بریفینگ در حال به‌روزرسانی است." },
  }[lang];

  return (
    <>
      <Header lang={lang} />

      {/* Hero */}
      <section className="bg-[#0a1628] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#3DB883]">
              Iran Monitor · Live
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
            {t.monitor}
          </h1>
          <p className="mt-4 text-lg text-zinc-300 max-w-3xl">
            {lang === "fr"
              ? "Briefing stratégique mis à jour en continu : indicateurs de tension, pression économique, sanctions, droits humains, signaux diplomatiques."
              : lang === "fa"
              ? "بریفینگ استراتژیک به‌روز: شاخص‌های تنش، فشار اقتصادی، تحریم‌ها، حقوق بشر، سیگنال‌های دیپلماتیک."
              : "Continuously updated strategic briefing: tension indicators, economic pressure, sanctions, human rights, diplomatic signals."}
          </p>
          {updatedAt && (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {copy.lastUpdate}: {new Date(updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : lang === "fa" ? "fa-IR" : "en-US")}
            </p>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Briefing */}
        <section data-testid="monitor-briefing">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e] mb-6">
            {copy.situation}
          </h2>
          {situation.length > 0 ? (
            <ul className="space-y-3 bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
              {situation.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-zinc-800 leading-relaxed">
                  <span className="text-[#3DB883] mt-1 flex-shrink-0 font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 py-12 text-center bg-zinc-50 rounded-lg italic">
              {copy.noData}
            </p>
          )}
        </section>

        {/* Indicators */}
        {Object.keys(indexes).length > 0 && (
          <section data-testid="monitor-indicators">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e] mb-6">
              {copy.indicators}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(indexes).map(([key, val]) => {
                const score = typeof val === "object" ? val.score ?? val.value : val;
                const trend = typeof val === "object" ? val.trend : null;
                const label = indexLabels[key] || key.replace(/_/g, " ");
                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 ${severityColor(score)}`}
                    data-testid={`indicator-${key}`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                      {label}
                    </p>
                    <p className="font-heading text-3xl font-black mt-2">
                      {score ?? "—"}
                      {typeof score === "number" && <span className="text-base opacity-60">/100</span>}
                    </p>
                    {trend && (
                      <p className="text-[11px] mt-1 font-mono">
                        {trend === "up" ? "▲" : trend === "down" ? "▼" : "→"} {trend}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest studies */}
        {latestStudies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e]">
                {copy.latest}
              </h2>
              <Link
                href={`/${lang}/studies`}
                className="font-mono text-xs uppercase tracking-widest text-[#3DB883] hover:text-[#1E3A5F]"
              >
                {t.studies} →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestStudies.map((a) => (
                <ArticleCard key={a.id} article={a} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {/* Live RSS */}
        <section className="bg-[#1E3A5F] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-6">
            {copy.liveFeed}
          </h2>
          <div className="bg-white/5 border border-white/10 p-4 sm:p-6">
            <iframe
              src={RSS_FEED[lang] || RSS_FEED.en}
              style={{ width: "100%", height: "700px", border: "none" }}
              title="Iran Observatory Live Monitor"
            />
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </>
  );
}
