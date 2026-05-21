import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://iranobservatory.org';
const DEFAULT_IMAGE = 'https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png';

const LANG_META = {
  en: { locale: 'en_US', siteName: 'Iran Observatory' },
  fr: { locale: 'fr_FR', siteName: "Observatoire de l'Iran" },
  fa: { locale: 'fa_IR', siteName: 'رصدخانه ایران' }
};

/**
 * Universal SEO component.
 *
 * Props
 * - title: page title (without site suffix)
 * - description: meta description
 * - image: OG/Twitter image URL (absolute)
 * - url: path on the site (e.g. "/articles" — leading slash)
 * - type: "website" | "article"
 * - article: full article object → triggers NewsArticle JSON-LD
 * - keywords: array of focus keywords
 * - language: current site language ('fr'|'en'|'fa')
 * - breadcrumbs: array of { name, path } — emits BreadcrumbList JSON-LD
 * - noIndex: bool — emit `noindex,nofollow`
 */
export function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = '',
  type = 'website',
  article = null,
  keywords = [],
  language = 'fr',
  breadcrumbs = null,
  noIndex = false
}) {
  const fullTitle = title
    ? `${title} | Iran Observatory`
    : "Iran Observatory | Observatoire de l'Iran — Indépendant, multilingue";

  const fullDescription = description ||
    "Plateforme indépendante d'analyse factuelle et de veille sur l'Iran : politique, économie, droits humains, sanctions, diplomatie. Contenus en français, anglais et persan.";

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${cleanUrl}`;

  // Normalize image: make it absolute if it's a relative path
  let imgAbs = image;
  if (imgAbs && imgAbs.startsWith('/')) imgAbs = `${BASE_URL}${imgAbs}`;
  if (!imgAbs) imgAbs = DEFAULT_IMAGE;

  const currentLang = LANG_META[language] || LANG_META.fr;

  // Build article JSON-LD with rich properties
  let articleJsonLd = null;
  if (article) {
    const wordCount = String(
      article.content_en || article.content_fr || article.content_fa || ''
    ).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const isNews = article.content_type === 'news' || article.content_type === undefined;
    articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': isNews ? 'NewsArticle' : (article.content_type === 'study' || article.content_type === 'analysis' ? 'Report' : 'Article'),
      headline: title || '',
      description: fullDescription,
      image: [imgAbs],
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at || article.published_at || article.created_at,
      inLanguage: language,
      articleSection: article.category || 'news',
      wordCount: wordCount || undefined,
      keywords: (keywords && keywords.length ? keywords : article.focus_keywords || article.tags || []).join(', ') || undefined,
      author: {
        '@type': 'Organization',
        name: 'Iran Observatory',
        url: BASE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: 'Iran Observatory',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE, width: 600, height: 600 }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
      isAccessibleForFree: true
    };
  }

  // Breadcrumb JSON-LD
  let breadcrumbJsonLd = null;
  if (breadcrumbs && breadcrumbs.length) {
    breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: `${BASE_URL}${b.path.startsWith('/') ? b.path : '/' + b.path}`
      }))
    };
  }

  return (
    <Helmet>
      {/* Basic Meta */}
      <html lang={language} dir={language === 'fa' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={fullUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Hreflang — same URL but signals multilingual availability */}
      <link rel="alternate" hrefLang="fr" href={fullUrl} />
      <link rel="alternate" hrefLang="en" href={fullUrl} />
      <link rel="alternate" hrefLang="fa" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={imgAbs} />
      <meta property="og:image:alt" content={title || 'Iran Observatory'} />
      <meta property="og:site_name" content={currentLang.siteName} />
      <meta property="og:locale" content={currentLang.locale} />
      {language !== 'fr' && <meta property="og:locale:alternate" content="fr_FR" />}
      {language !== 'en' && <meta property="og:locale:alternate" content="en_US" />}
      {language !== 'fa' && <meta property="og:locale:alternate" content="fa_IR" />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={imgAbs} />
      <meta name="twitter:site" content="@IranObservatory" />

      {/* Article publication metadata */}
      {article && article.published_at && (
        <meta property="article:published_time" content={article.published_at} />
      )}
      {article && article.updated_at && (
        <meta property="article:modified_time" content={article.updated_at} />
      )}
      {article && article.category && (
        <meta property="article:section" content={article.category} />
      )}
      {article && (article.tags || []).map((t) => (
        <meta property="article:tag" content={t} key={`tag-${t}`} />
      ))}

      {/* JSON-LD: Article / NewsArticle / Report */}
      {articleJsonLd && (
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      )}

      {/* JSON-LD: BreadcrumbList */}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      )}
    </Helmet>
  );
}

/**
 * Site-wide Organization + WebSite JSON-LD with SearchAction.
 * Mount once at the app root.
 */
export function SiteJsonLd() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Iran Observatory',
    alternateName: ["Observatoire de l'Iran", 'رصدخانه ایران'],
    url: BASE_URL,
    logo: DEFAULT_IMAGE,
    sameAs: [],
    description: "Plateforme indépendante d'analyse factuelle et de veille sur l'Iran."
  };
  const site = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: BASE_URL,
    name: 'Iran Observatory',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/articles?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    inLanguage: ['fr', 'en', 'fa']
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(org)}</script>
      <script type="application/ld+json">{JSON.stringify(site)}</script>
    </Helmet>
  );
}

export default SEO;
