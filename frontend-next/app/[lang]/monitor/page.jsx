import { T, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";

// Iran Monitor dashboard — full version lives on the React SPA. For now we
// redirect users there. Once the Next port is ready (Phase 2), this page
// will host the SSR-friendly version.

export const revalidate = 3600;

const SPA_URL = "https://iran-events-live.preview.emergentagent.com";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = T[lang];
  return {
    title: t.monitor,
    description: lang === "fr"
      ? "Iran Monitor — indicateurs en temps réel sur l'Iran : tension politique, droits humains, économie, sanctions."
      : lang === "en"
      ? "Iran Monitor — real-time indicators on Iran: political tension, human rights, economy, sanctions."
      : "رصد ایران — شاخص‌های لحظه‌ای ایران",
  };
}

export default async function MonitorPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];
  const copy = {
    fr: {
      lead: "L'Iran Monitor est en cours de migration vers une version optimisée pour le SEO. En attendant, consultez la version complète :",
      cta: "Ouvrir l'Iran Monitor",
      back: "Retour à l'accueil",
    },
    en: {
      lead: "The Iran Monitor is being migrated to an SEO-optimized version. In the meantime, view the full version:",
      cta: "Open Iran Monitor",
      back: "Back to home",
    },
    fa: {
      lead: "رصد ایران در حال انتقال به نسخه‌ای بهینه‌شده برای SEO است. در این مدت، نسخه کامل را مشاهده کنید:",
      cta: "باز کردن رصد ایران",
      back: "بازگشت به صفحه اصلی",
    },
  }[lang] || {};

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-4">
          {t.monitor}
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#0f1e2e] mb-6">
          {t.monitor}
        </h1>
        <p className="text-lg text-zinc-600 leading-relaxed mb-8">{copy.lead}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`${SPA_URL}/monitor`}
            className="inline-block px-6 py-3 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#0f1e2e] transition-colors"
          >
            {copy.cta} →
          </a>
          <a
            href={`/${lang}`}
            className="inline-block px-6 py-3 border border-zinc-300 text-zinc-700 font-mono text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
          >
            ← {copy.back}
          </a>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
