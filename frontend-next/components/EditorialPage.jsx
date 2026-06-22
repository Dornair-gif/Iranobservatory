import { Header } from "./Header";
import { Footer } from "./Footer";

// Long-form editorial layout — used by /a-propos, /methodologie, /manifeste.
// Mirrors the React SPA EditorialPage typographically so the brand voice is
// preserved across the migration. The `voice="personal"` variant turns body
// type italic for the founder-signed Manifesto.
export function EditorialPage({
  lang,
  label,
  title,
  subtitle,
  children,
  lastRevised,
  signature,
  breadcrumbs = [],
  jsonLd,
  voice = "institutional",
}) {
  const isRtl = lang === "fa";

  // BreadcrumbList structured data for Google rich results
  const crumbLd = breadcrumbs.length
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: `https://iranobservatory.org${b.path}`,
        })),
      }
    : null;

  return (
    <div
      className={`min-h-screen bg-[#fbfaf7] ${isRtl ? "text-right" : "text-left"}`}
      data-testid="editorial-page"
    >
      <Header lang={lang} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {crumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }}
        />
      )}

      {/* Label rule */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883]">
            {label}
          </p>
        </div>
      </div>

      {/* Hero */}
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
              voice === "personal" ? "italic" : ""
            }`}
          >
            {subtitle}
          </p>
        )}
      </header>

      {/* Body */}
      <article
        className={`max-w-3xl mx-auto px-6 sm:px-10 pb-16 prose-editorial ${
          voice === "personal" ? "voice-personal" : ""
        }`}
        data-testid="editorial-body"
      >
        {children}
      </article>

      {/* Signature + meta */}
      {(signature || lastRevised) && (
        <div className="border-t border-zinc-200 bg-white">
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

      <Footer lang={lang} />

      {/* Editorial typography — scoped locally so global Tailwind prose isn't fought */}
      <style>{`
        .prose-editorial p { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.95rem; line-height: 1.7; color: #2a2a2a; margin: 0 0 1.15rem; }
        .prose-editorial h2 { font-family: 'Cabinet Grotesk', 'IBM Plex Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: #0f1e2e; margin: 2.5rem 0 0.85rem; letter-spacing: -0.01em; }
        .prose-editorial h3 { font-family: 'Cabinet Grotesk', 'IBM Plex Sans', sans-serif; font-size: 1.05rem; font-weight: 700; color: #1E3A5F; margin: 1.75rem 0 0.5rem; }
        .prose-editorial ul { list-style: none; padding: 0; margin: 0 0 1.15rem; }
        .prose-editorial ul li { font-size: 0.95rem; line-height: 1.7; color: #2a2a2a; padding-left: 1.4rem; position: relative; margin-bottom: 0.65rem; font-family: 'IBM Plex Sans', sans-serif; }
        .prose-editorial ul li::before { content: '·'; position: absolute; left: 0.4rem; top: -0.25rem; color: #3DB883; font-weight: 700; font-size: 1.4rem; }
        [dir="rtl"] .prose-editorial ul li { padding-left: 0; padding-right: 1.4rem; }
        [dir="rtl"] .prose-editorial ul li::before { left: auto; right: 0.4rem; }
        .prose-editorial strong { color: #0f1e2e; font-weight: 700; }
        .prose-editorial em { font-style: italic; color: #1E3A5F; }
        .prose-editorial a { color: #1E3A5F; text-decoration: underline; text-decoration-color: #3DB883; text-decoration-thickness: 2px; text-underline-offset: 4px; }
        .prose-editorial a:hover { color: #0f1e2e; }
        .prose-editorial blockquote { border-left: 3px solid #3DB883; padding-left: 1.15rem; margin: 1.75rem 0; font-style: italic; color: #1E3A5F; font-size: 1.05rem; line-height: 1.65; font-family: 'IBM Plex Sans', sans-serif; }
        [dir="rtl"] .prose-editorial blockquote { border-left: none; border-right: 3px solid #3DB883; padding-left: 0; padding-right: 1.15rem; }
        .prose-editorial .lede { font-size: 1.05rem; line-height: 1.6; color: #1E3A5F; }
        /* Founder voice */
        .voice-personal,
        .prose-editorial.voice-personal p,
        .prose-editorial.voice-personal .lede,
        .prose-editorial.voice-personal blockquote { font-style: italic; }
        .prose-editorial.voice-personal strong { font-style: normal; color: #0f1e2e; }
        [dir="rtl"] .prose-editorial.voice-personal p,
        [dir="rtl"] .prose-editorial.voice-personal .lede,
        [dir="rtl"] .prose-editorial.voice-personal blockquote { font-style: normal; }
      `}</style>
    </div>
  );
}

export default EditorialPage;
