import Link from "next/link";
import { LANGUAGES, T } from "@/lib/i18n";

// Minimal header — logo + main nav + language switcher.
// Editorial pages (About / Methodology / Manifesto) live ONLY in footer,
// per founder's explicit instruction.

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png";

export function Header({ lang }) {
  const t = T[lang] || T.fr;

  return (
    <header className="bg-[#1E3A5F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
        <Link href={`/${lang}`} className="flex items-center gap-3 group" aria-label="Iran Observatory home">
          <img src={LOGO_URL} alt="Iran Observatory" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider">
          <Link href={`/${lang}/monitor`} className="text-zinc-200 hover:text-[#3DB883]">{t.monitor}</Link>
          <Link href={`/${lang}/articles`} className="text-zinc-200 hover:text-[#3DB883]">{t.articles}</Link>
          <Link href={`/${lang}/studies`} className="text-zinc-200 hover:text-[#3DB883]">{t.studies}</Link>
        </nav>

        <div className="flex items-center gap-1.5">
          {LANGUAGES.map((code) => (
            <Link
              key={code}
              href={`/${code}`}
              className={`px-2 py-1 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                lang === code
                  ? "bg-[#3DB883] border-[#3DB883] text-[#1E3A5F]"
                  : "border-white/20 text-white/70 hover:border-[#3DB883]"
              }`}
            >
              {code}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
