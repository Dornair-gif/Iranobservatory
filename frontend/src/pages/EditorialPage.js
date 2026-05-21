import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { Footer } from '../components/Footer';

// Long-form editorial page wrapper used by /a-propos, /methodologie, /manifeste.
// Centers a single column of text at a generous measure, with a monospace
// label-stamp at the top and a discreet meta footer (last revision date).
// Brand typography: Cabinet Grotesk (headings) + IBM Plex Sans (body) — the
// global Iran Observatory stack. The `voice="personal"` variant (Manifesto,
// founder-signed) swaps the body to an editorial italic serif (Cormorant
// Garamond) to carry Maneli's personal voice.
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
  voice = 'institutional',
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
          <p
            className={`mt-6 text-lg sm:text-xl text-zinc-600 leading-relaxed ${
              voice === 'personal' ? 'voice-personal italic' : ''
            }`}
          >
            {subtitle}
          </p>
        )}
      </header>

      {/* Body */}
      <article
        className={`max-w-3xl mx-auto px-6 sm:px-10 pb-16 prose-editorial ${
          voice === 'personal' ? 'voice-personal' : ''
        }`}
        data-testid="editorial-body"
      >
        {children}
      </article>

      {/* Signature + meta */}
      {(signature || lastRevised) && (
        <div className="border-t border-zinc-200">
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 space-y-4">
            {signature && (
              <div className="voice-personal text-zinc-700">{signature}</div>
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

      {/* Page-local typography. Defaults use the global Iran Observatory
          stack (IBM Plex Sans body + Cabinet Grotesk headings). The
          `.voice-personal` modifier keeps the same font but italicises the
          body — used only on the Manifesto to carry Maneli's personal voice. */}
      <style>{`
        .prose-editorial p { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.95rem; line-height: 1.7; color: #2a2a2a; margin: 0 0 1.15rem; }
        .prose-editorial p + p { margin-top: 0; }
        .prose-editorial h2 { font-family: 'Cabinet Grotesk', 'IBM Plex Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: #0f1e2e; margin: 2.5rem 0 0.85rem; letter-spacing: -0.01em; }
        .prose-editorial h3 { font-family: 'Cabinet Grotesk', 'IBM Plex Sans', sans-serif; font-size: 1.05rem; font-weight: 700; color: #1E3A5F; margin: 1.75rem 0 0.5rem; }
        .prose-editorial ul { list-style: none; padding: 0; margin: 0 0 1.15rem; }
        .prose-editorial ul li { font-family: 'IBM Plex Sans', sans-serif; font-size: 0.95rem; line-height: 1.7; color: #2a2a2a; padding-left: 1.4rem; position: relative; margin-bottom: 0.65rem; }
        .prose-editorial ul li::before { content: '·'; position: absolute; left: 0.4rem; top: -0.25rem; color: #3DB883; font-weight: 700; font-size: 1.4rem; }
        [dir="rtl"] .prose-editorial ul li { padding-left: 0; padding-right: 1.4rem; }
        [dir="rtl"] .prose-editorial ul li::before { left: auto; right: 0.4rem; }
        .prose-editorial strong { color: #0f1e2e; font-weight: 700; }
        .prose-editorial em { font-style: italic; color: #1E3A5F; }
        .prose-editorial blockquote { border-left: 3px solid #3DB883; padding-left: 1.15rem; margin: 1.75rem 0; font-style: italic; color: #1E3A5F; font-size: 1.05rem; line-height: 1.65; font-family: 'IBM Plex Sans', sans-serif; }
        [dir="rtl"] .prose-editorial blockquote { border-left: none; border-right: 3px solid #3DB883; padding-left: 0; padding-right: 1.15rem; }
        .prose-editorial hr { border: 0; border-top: 1px solid #e5e5e5; margin: 2.25rem 0; }
        .prose-editorial .lede { font-size: 1.05rem; line-height: 1.6; color: #1E3A5F; font-family: 'IBM Plex Sans', sans-serif; }

        /* Persian: keep Vazirmatn body for readability, even on Manifesto */
        [dir="rtl"] .prose-editorial p,
        [dir="rtl"] .prose-editorial ul li,
        [dir="rtl"] .prose-editorial blockquote,
        [dir="rtl"] .prose-editorial .lede { font-family: 'Vazirmatn', 'IBM Plex Sans', sans-serif; }

        /* ----- Founder voice (Manifesto only): same stack, italic ----- */
        .voice-personal,
        .prose-editorial.voice-personal p,
        .prose-editorial.voice-personal .lede,
        .prose-editorial.voice-personal blockquote {
          font-style: italic;
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .prose-editorial.voice-personal .lede {
          font-size: 1.15rem;
          line-height: 1.6;
          color: #1E3A5F;
        }
        .prose-editorial.voice-personal strong {
          font-style: normal;
          color: #0f1e2e;
        }
        .prose-editorial.voice-personal em {
          font-style: italic;
          color: #1E3A5F;
        }
        /* Persian manifesto: stay upright (Vazirmatn italic looks awkward) */
        [dir="rtl"] .prose-editorial.voice-personal p,
        [dir="rtl"] .prose-editorial.voice-personal .lede,
        [dir="rtl"] .prose-editorial.voice-personal blockquote {
          font-style: normal;
        }
      `}</style>
    </div>
  );
}

export default EditorialPage;
