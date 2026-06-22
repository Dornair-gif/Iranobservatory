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

  const studies = await api.listStudies({ limit: 50 }).catch(() => []);

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-3">
            {t.studies}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#0f1e2e]">
            {t.studies}
          </h1>
        </header>

        {studies.length === 0 ? (
          <p className="text-zinc-500">—</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((a) => (
              <ArticleCard key={a.id} article={a} lang={lang} />
            ))}
          </div>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
