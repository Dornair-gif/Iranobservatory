import { api } from "@/lib/api";
import { T, isValidLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";

export const revalidate = 300;

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

  const articles = await api.listArticles({ limit: 50 }).catch(() => []);

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#0f1e2e]">{t.articles}</h1>
        </header>

        {articles.length === 0 ? (
          <p className="text-zinc-500">—</p>
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
