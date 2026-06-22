import Link from "next/link";
import { LANGUAGES, T } from "@/lib/i18n";

// Sticky glass header — restored to match the original SPA design.
// Logo is intentionally large (h-36 / h-40) so the brand reads from a distance.

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/tkhn3g6l_Iran%20Observatory%20Logo%20transparent%20%281%29.png";

const DONATE_URL = "https://www.helloasso.com/associations/dorna/formulaires/2";

export function Header({ lang }) {
  const t = T[lang] || T.fr;

  const supportLabel =
    lang === "fr" ? "Soutenir" : lang === "fa" ? "حمایت" : "Support";

  return (
    <header
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-zinc-200/60"
      data-testid="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo — back to big size */}
          <Link
            href={`/${lang}`}
            className="flex items-center gap-3 group -my-4"
            data-testid="logo-link"
          >
            <img
              src={LOGO_URL}
              alt="Iran Observatory"
              className="h-28 sm:h-32 lg:h-36 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${lang}/monitor`}
              className="font-mono text-xs uppercase tracking-wider text-zinc-700 hover:text-[#1E3A5F] transition-colors"
              data-testid="nav-monitor"
            >
              {t.monitor}
            </Link>
            <Link
              href={`/${lang}/articles`}
              className="font-mono text-xs uppercase tracking-wider text-zinc-700 hover:text-[#1E3A5F] transition-colors"
              data-testid="nav-articles"
            >
              {t.articles}
            </Link>
            <Link
              href={`/${lang}/studies`}
              className="font-mono text-xs uppercase tracking-wider text-zinc-700 hover:text-[#1E3A5F] transition-colors"
              data-testid="nav-studies"
            >
              {t.studies}
            </Link>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#3DB883]">
                {lang === "fr" ? "Live" : lang === "fa" ? "زنده" : "Live"}
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1">
              {LANGUAGES.map((code) => (
                <Link
                  key={code}
                  href={`/${code}`}
                  className={`px-2 py-1 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                    lang === code
                      ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                      : "border-zinc-300 text-zinc-600 hover:border-[#1E3A5F] hover:text-[#1E3A5F]"
                  }`}
                  data-testid={`lang-switch-${code}`}
                >
                  {code}
                </Link>
              ))}
            </div>

            {/* Donate button */}
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="donate-btn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3DB883] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded-sm"
            >
              ♥ {supportLabel}
            </a>
          </nav>

          {/* Mobile nav — language + donate only (full menu lives in footer) */}
          <div className="md:hidden flex items-center gap-2">
            {LANGUAGES.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                className={`px-2 py-1 font-mono text-[10px] uppercase tracking-widest border ${
                  lang === code
                    ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                    : "border-zinc-300 text-zinc-600"
                }`}
              >
                {code}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile sub-nav */}
        <nav className="md:hidden flex items-center justify-around gap-2 py-3 border-t border-zinc-200">
          <Link
            href={`/${lang}/monitor`}
            className="font-mono text-[10px] uppercase tracking-wider text-zinc-700"
          >
            {t.monitor}
          </Link>
          <Link
            href={`/${lang}/articles`}
            className="font-mono text-[10px] uppercase tracking-wider text-zinc-700"
          >
            {t.articles}
          </Link>
          <Link
            href={`/${lang}/studies`}
            className="font-mono text-[10px] uppercase tracking-wider text-zinc-700"
          >
            {t.studies}
          </Link>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-wider text-[#3DB883] font-bold"
          >
            ♥ {supportLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
