import { api } from "@/lib/api";
import { T, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import Link from "next/link";

// Unified articles + studies + briefs landing page.
// Sections are split visually so visitors (and Google) understand the
// difference between flash news, structural studies and weekly briefs.

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = T[lang];
  return {
    title: t.seo.articles.title,
    description: t.seo.articles.description,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/articles`,
      languages: {
        "fr-FR": "https://iranobservatory.org/fr/articles",
        "en-US": "https://iranobservatory.org/en/articles",
        "fa-IR": "https://iranobservatory.org/fa/articles",
      },
    },
  };
}

export default async function ArticlesPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const t = T[lang];

  // Fetch in parallel; backend filters by content_type.
  // No `.catch(() => [])` here — see lib/api.js. If the backend hiccups we
  // want the error to bubble (handled by app/[lang]/error.jsx) so that the
  // ISR cache does NOT keep serving an empty page for 60s.
  const [all, studies, briefs] = await Promise.all([
    api.listArticles({ limit: 100, lang }),
    api.listArticles({ limit: 30, lang, content_types: "study,analysis" }),
    api.listArticles({ limit: 20, lang, content_types: "brief" }),
  ]);

  // Separate news from the rest so the same article doesn't appear twice
  const nonNewsIds = new Set([...studies, ...briefs].map((a) => a.id));
  const news = all.filter(
    (a) => !nonNewsIds.has(a.id) && (!a.content_type || a.content_type === "news")
  );

  const headings = {
    fr: { news: "Actualités", studies: "Decrypt — Études & Analyses", briefs: "Briefs Hebdo" },
    en: { news: "News", studies: "Decrypt — Studies & Analysis", briefs: "Weekly Briefs" },
    fa: { news: "اخبار", studies: "رمزگشایی — مطالعات و تحلیل‌ها", briefs: "گزارش‌های هفتگی" },
  }[lang];

  const Section = ({ title, items, kind }) => (
    <section className="mb-16" data-testid={`section-${kind}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0f1e2e]">
          {title}
        </h2>
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          {items.length}{" "}
          {lang === "fr" ? "publication(s)" : lang === "fa" ? "مورد" : "item(s)"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-zinc-500 py-12 text-center bg-zinc-50 rounded-lg">—</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-2">
            Iran Observatory · Decrypt & Intel
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#0f1e2e]">
            {t.articles}
          </h1>
          <p className="mt-4 text-zinc-600 max-w-2xl">
            {lang === "fr"
              ? "Toutes nos publications : actualités vérifiées, études structurelles, briefs hebdomadaires."
              : lang === "fa"
              ? "همه انتشارات ما: اخبار راستی‌آزمایی‌شده، مطالعات ساختاری، گزارش‌های هفتگی."
              : "All our publications: verified news, structural studies, weekly briefs."}
          </p>
        </header>

        <Section title={headings.news} items={news} kind="news" />
        {briefs.length > 0 && (
          <Section title={headings.briefs} items={briefs} kind="briefs" />
        )}
        {studies.length > 0 && (
          <Section title={headings.studies} items={studies} kind="studies" />
        )}

        {/* CTA to dedicated Studies page */}
        <div className="text-center py-8 border-t border-zinc-200">
          <Link
            href={`/${lang}/studies`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#0f1e2e] transition-colors"
          >
            {lang === "fr"
              ? "Voir uniquement les études"
              : lang === "fa"
              ? "فقط مطالعات را ببینید"
              : "View Studies only"}{" "}
            →
          </Link>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
