import { api } from "@/lib/api";
import { T, isValidLang, LANG_META } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { normalizeImageUrl } from "@/lib/imageUrl";
import { renderHtml, isFullHtmlDoc } from "@/lib/sanitize";
import StudyHtmlFrame from "@/components/StudyHtmlFrame";
import { notFound } from "next/navigation";
import { format } from "date-fns";

// ISR — single articles revalidated every 5 min, on-demand triggers via
// /api/revalidate when admin clicks Publish.
export const revalidate = 60;

// Pre-render the most recent articles at build time. Stale articles render
// on first request and cache for 5 min.
export async function generateStaticParams() {
  try {
    const articles = await api.listArticles({ limit: 100 });
    const langs = ["fr", "en", "fa"];
    const params = [];
    for (const a of articles) {
      for (const lang of langs) {
        params.push({ lang, slug: a.slug || a.id });
      }
    }
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  try {
    const article = await api.getArticle(slug);
    const title = article[`title_${lang}`] || article.title_en || article.title_fr;
    const summary = article[`summary_${lang}`] || article.summary_en || article.summary_fr || "";
    const image = normalizeImageUrl(article.image_url);
    const canonical = `https://iranobservatory.org/${lang}/article/${article.slug || slug}`;
    return {
      title,
      description: summary.slice(0, 280),
      alternates: {
        canonical,
        languages: {
          "fr-FR": `https://iranobservatory.org/fr/article/${article.slug || slug}`,
          "en-US": `https://iranobservatory.org/en/article/${article.slug || slug}`,
          "fa-IR": `https://iranobservatory.org/fa/article/${article.slug || slug}`,
        },
      },
      openGraph: {
        title,
        description: summary,
        url: canonical,
        type: "article",
        locale: LANG_META[lang].htmlLang,
        publishedTime: article.published_at,
        images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      },
      twitter: { card: "summary_large_image", title, description: summary, images: image ? [image] : undefined },
    };
  } catch {
    return {};
  }
}

export default async function ArticlePage({ params }) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();

  let article;
  try {
    article = await api.getArticle(slug);
  } catch {
    notFound();
  }
  if (!article) notFound();

  const t = T[lang];
  const title = article[`title_${lang}`] || article.title_en || article.title_fr;
  const summary = article[`summary_${lang}`] || article.summary_en || article.summary_fr;
  const content = article[`content_${lang}`] || article.content_en || article.content_fr || "";
  const image = normalizeImageUrl(article.image_url);
  const date = article.published_at || article.created_at;

  const isStudy = article.content_type === "study" || article.content_type === "analysis";
  const useIframe = isStudy && isFullHtmlDoc(content);

  // JSON-LD NewsArticle schema for rich results in Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
    image: image ? [image] : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    inLanguage: LANG_META[lang].htmlLang,
    publisher: {
      "@type": "Organization",
      name: "Iran Observatory",
      url: "https://iranobservatory.org",
      logo: {
        "@type": "ImageObject",
        url: "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png",
      },
    },
    author: { "@type": "Organization", name: "Iran Observatory" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://iranobservatory.org/${lang}/article/${article.slug || slug}`,
    },
  };

  return (
    <>
      <Header lang={lang} />

      {/* JSON-LD for Google */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Meta */}
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-4">
          {article.content_type || "Article"} {date && `· ${format(new Date(date), "dd MMM yyyy")}`}
        </p>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0f1e2e] leading-tight tracking-tight mb-6">
          {title}
        </h1>

        {summary && (
          <p className="text-lg sm:text-xl text-zinc-600 leading-relaxed mb-8 italic">{summary}</p>
        )}

        {image && !useIframe && (
          <div className="-mx-4 sm:mx-0 mb-10">
            <img src={image} alt={title} className="w-full h-auto" />
          </div>
        )}

        {/* Content */}
        {useIframe ? (
          <StudyHtmlFrame html={content} ariaLabel={title} />
        ) : (
          <div
            className="prose prose-zinc max-w-none prose-headings:font-heading prose-headings:text-[#0f1e2e] prose-a:text-[#1E3A5F]"
            dangerouslySetInnerHTML={renderHtml(content)}
          />
        )}
      </article>

      <Footer lang={lang} />
    </>
  );
}
