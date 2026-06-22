import Link from "next/link";
import { T, LANGUAGES } from "@/lib/i18n";

// Footer — ported from the React SPA, kept identical visually.
// All language links use the /:lang/... pattern so SEO-friendly.

const SOCIAL = {
  xFr: { url: "https://x.com/ObservatoireIR", handle: "@ObservatoireIR" },
  xEn: { url: "https://x.com/IrObservatory", handle: "@IrObservatory" },
  instagram: { url: "https://instagram.com/iranobservatory", handle: "@iranobservatory" },
  linkedin: { url: "https://www.linkedin.com/company/iran-observatory/", handle: "Iran Observatory" },
};

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const COPY = {
  fr: {
    observatory: "L'Observatoire",
    publications: "Publications",
    contactLabel: "Contact",
    independence:
      "Iran Observatory est strictement indépendant. Ses sources de financement sont publiées et auditables.",
    rights: "Tous droits réservés.",
  },
  en: {
    observatory: "The Observatory",
    publications: "Publications",
    contactLabel: "Contact",
    independence:
      "Iran Observatory is strictly independent. Its funding sources are published and auditable.",
    rights: "All rights reserved.",
  },
  fa: {
    observatory: "رصدخانه",
    publications: "انتشارات",
    contactLabel: "تماس",
    independence: "رصدخانه ایران کاملاً مستقل است.",
    rights: "تمامی حقوق محفوظ است.",
  },
};

export function Footer({ lang }) {
  const t = T[lang] || T.fr;
  const c = COPY[lang] || COPY.fr;
  const year = new Date().getFullYear();
  const xLink = lang === "fr" ? SOCIAL.xFr : SOCIAL.xEn;

  return (
    <footer className="bg-[#1E3A5F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <img src={LOGO_URL} alt="Iran Observatory" className="h-14 w-auto mb-4" />
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">{t.tagline}</p>
            <p className="text-xs text-[#3DB883] italic">{t.motto}</p>
          </div>

          {/* The Observatory */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.observatory}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${lang}/a-propos`} className="text-zinc-300 hover:text-white">{t.about}</Link></li>
              <li><Link href={`/${lang}/methodologie`} className="text-zinc-300 hover:text-white">{t.methodology}</Link></li>
              <li><Link href={`/${lang}/manifeste`} className="text-zinc-300 hover:text-white">{t.manifesto}</Link></li>
            </ul>
          </div>

          {/* Publications */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.publications}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${lang}/articles`} className="text-zinc-300 hover:text-white">{t.articles}</Link></li>
              <li><Link href={`/${lang}/studies`} className="text-zinc-300 hover:text-white">{t.studies}</Link></li>
              <li><Link href={`/${lang}/monitor`} className="text-zinc-300 hover:text-white">{t.monitor}</Link></li>
            </ul>
          </div>

          {/* Contact + social + langs */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.contactLabel}
            </h4>
            <a href="mailto:contact@iranobservatory.org" className="font-mono text-xs text-zinc-300 hover:text-white">
              contact@iranobservatory.org
            </a>

            <div className="mt-5 flex items-center gap-3">
              <a href={xLink.url} target="_blank" rel="noopener noreferrer" aria-label={`X ${xLink.handle}`}
                 className="w-9 h-9 inline-flex items-center justify-center border border-[#2A4A73] text-zinc-300 hover:text-[#3DB883] hover:border-[#3DB883] transition-colors">
                <XIcon />
              </a>
              <a href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                 className="w-9 h-9 inline-flex items-center justify-center border border-[#2A4A73] text-zinc-300 hover:text-[#3DB883] hover:border-[#3DB883]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
              <a href={SOCIAL.linkedin.url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                 className="w-9 h-9 inline-flex items-center justify-center border border-[#2A4A73] text-zinc-300 hover:text-[#3DB883] hover:border-[#3DB883]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM3.56 20.45h3.56V9H3.56v11.45zM21.78 0H2.22C1 0 0 .98 0 2.18v19.64C0 23.02 1 24 2.22 24h19.56C23 24 24 23.02 24 21.82V2.18C24 .98 23 0 21.78 0z" />
                </svg>
              </a>
            </div>

            {/* Lang switcher */}
            <div className="mt-4 flex gap-2">
              {LANGUAGES.map((code) => (
                <Link
                  key={code}
                  href={`/${code}`}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                    lang === code
                      ? "bg-[#3DB883] border-[#3DB883] text-[#1E3A5F]"
                      : "border-[#2A4A73] text-zinc-300 hover:border-[#3DB883]"
                  }`}
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A4A73] mt-10 pt-6 space-y-3">
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-3xl">{c.independence}</p>
          {/* Affiliation note — inherits authority from DORNA (advocacy) and
              manelimirkhan.com (founder's personal site that already ranks). */}
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-3xl">
            {lang === "fr" ? (
              <>
                Recherche affiliée à{" "}
                <a href="https://dorna.eu" target="_blank" rel="noopener noreferrer" className="text-[#3DB883] hover:text-white underline underline-offset-2">DORNA</a>.
              </>
            ) : lang === "fa" ? (
              <>
                پژوهش وابسته به{" "}
                <a href="https://dorna.eu" target="_blank" rel="noopener noreferrer" className="text-[#3DB883] hover:text-white underline underline-offset-2">دورنا</a>.
              </>
            ) : (
              <>
                Research affiliated with{" "}
                <a href="https://dorna.eu" target="_blank" rel="noopener noreferrer" className="text-[#3DB883] hover:text-white underline underline-offset-2">DORNA</a>.
              </>
            )}
          </p>
        </div>
        <div className="mt-6 flex flex-col md:flex-row gap-2 md:justify-between md:items-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            © {year} Iran Observatory. {c.rights}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">iranobservatory.org</p>
        </div>
      </div>
    </footer>
  );
}
