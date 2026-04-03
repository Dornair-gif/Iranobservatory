import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://iranobservatory.org';
const DEFAULT_IMAGE = 'https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png';

export function SEO({ 
  title, 
  description, 
  image = DEFAULT_IMAGE,
  url = '',
  type = 'website',
  article = null,
  language = 'en'
}) {
  const fullTitle = title 
    ? `${title} | Iran Observatory` 
    : 'Iran Observatory | Independent Insights into Iran\'s Political, Economic & Social Dynamics';
  
  const fullDescription = description || 
    'Independent platform offering fact-based insights into Iran\'s political, economic and social dynamics. Iran\'s future matters, far beyond its borders.';
  
  const fullUrl = `${BASE_URL}${url}`;
  
  // Language-specific meta
  const langMeta = {
    en: { locale: 'en_US', siteName: 'Iran Observatory' },
    fr: { locale: 'fr_FR', siteName: 'Observatoire de l\'Iran' },
    fa: { locale: 'fa_IR', siteName: 'رصدخانه ایران' }
  };
  
  const currentLang = langMeta[language] || langMeta.en;

  return (
    <Helmet>
      {/* Basic Meta */}
      <html lang={language} dir={language === 'fa' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={currentLang.siteName} />
      <meta property="og:locale" content={currentLang.locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Article-specific structured data */}
      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": fullDescription,
            "image": image,
            "datePublished": article.published_at || article.created_at,
            "dateModified": article.updated_at,
            "author": {
              "@type": "Organization",
              "name": "Iran Observatory"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Iran Observatory",
              "logo": {
                "@type": "ImageObject",
                "url": DEFAULT_IMAGE
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": fullUrl
            }
          })}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
