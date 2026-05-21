import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { Footer } from '../components/Footer';

// Long-form editorial page wrapper used by /a-propos, /methodologie, /manifeste.
// Centers a single column of serif body text at a generous measure, with a
// monospace label-stamp at the top and a discreet meta footer (last revision
// date). Kept intentionally austere — the credibility cue is the layout.
export function EditorialPage({
  label,
  title,
  subtitle,
  children,
  lastRevised,
  signature,
  seoTitle,
  seoDescription,
  canonicalPath,
  breadcrumbs,
  extraJsonLd,
}) {
  const { language } = useLanguage();
  const isRtl = language === 'fa';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen bg-[#fbfaf7] ${isRtl ? 'text-right' : 'text-left'}`}>
      <SEO
        title={seoTitle || title}
        description={seoDescription || subtitle || ''}
        url={canonicalPath}
        language={language}
        breadcrumbs={breadcrumbs}
      />
      {extraJsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(extraJsonLd)}</script>
        </Helmet>
      )}

      {/* Top rule */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883]">
            {label}
          </p>
        </div>
      </div>

      {/* Hero title */}
      <header className="max-w-3xl mx-auto px-6 sm:px-10 pt-14 pb-10">
        <h1
          className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0f1e2e] leading-[1.05] tracking-tight"
          data-testid="editorial-title"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 leading-relaxed font-serif italic">
            {subtitle}
          </p>
        )}
      </header>

      {/* Body */}
      <article
        className="max-w-3xl mx-auto px-6 sm:px-10 pb-16 prose-editorial"
        data-testid="editorial-body"
      >
        {children}
      </article>

      {/* Signature + meta */}
      {(signature || lastRevised) && (
        <div className="border-t border-zinc-200">
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 space-y-4">
            {signature && (
              <div className="font-serif text-zinc-700">{signature}</div>
            )}
            {lastRevised && (
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {lastRevised}
              </p>
            )}
          </div>
        </div>
      )}

      <Footer />

      {/* Page-local typography refinements */}
      <style>{`
        .prose-editorial p { font-family: ui-serif, Georgia, 'Iowan Old Style', 'Apple Garamond', 'Times New Roman', serif; font-size: 1.0625rem; line-height: 1.75; color: #2a2a2a; margin: 0 0 1.35rem; }
        .prose-editorial p + p { margin-top: 0; }
        .prose-editorial h2 { font-family: ui-serif, Georgia, serif; font-size: 1.5rem; font-weight: 700; color: #0f1e2e; margin: 2.75rem 0 1rem; letter-spacing: -0.01em; }
        .prose-editorial h3 { font-family: ui-serif, Georgia, serif; font-size: 1.15rem; font-weight: 700; color: #1E3A5F; margin: 2rem 0 0.6rem; }
        .prose-editorial ul { list-style: none; padding: 0; margin: 0 0 1.35rem; }
        .prose-editorial ul li { font-family: ui-serif, Georgia, serif; font-size: 1.0625rem; line-height: 1.75; color: #2a2a2a; padding-left: 1.5rem; position: relative; margin-bottom: 0.75rem; }
        .prose-editorial ul li::before { content: '·'; position: absolute; left: 0.4rem; top: -0.2rem; color: #3DB883; font-weight: 700; font-size: 1.4rem; }
        [dir="rtl"] .prose-editorial ul li { padding-left: 0; padding-right: 1.5rem; }
        [dir="rtl"] .prose-editorial ul li::before { left: auto; right: 0.4rem; }
        .prose-editorial strong { color: #0f1e2e; font-weight: 700; }
        .prose-editorial em { font-style: italic; color: #1E3A5F; }
        .prose-editorial blockquote { border-left: 3px solid #3DB883; padding-left: 1.25rem; margin: 2rem 0; font-style: italic; color: #1E3A5F; font-size: 1.15rem; line-height: 1.7; }
        [dir="rtl"] .prose-editorial blockquote { border-left: none; border-right: 3px solid #3DB883; padding-left: 0; padding-right: 1.25rem; }
        .prose-editorial hr { border: 0; border-top: 1px solid #e5e5e5; margin: 2.5rem 0; }
        .prose-editorial .lede { font-size: 1.25rem; line-height: 1.65; color: #1E3A5F; font-family: ui-serif, Georgia, serif; font-style: italic; }
      `}</style>
    </div>
  );
}

export default EditorialPage;
