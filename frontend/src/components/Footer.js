import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png";

// Social profiles. X handle is language-aware (FR vs EN/FA).
// Edit these once if any URL changes — they're the single source of truth.
const SOCIAL_LINKS = {
  xFr: { url: "https://x.com/ObservatoireIR", handle: "@ObservatoireIR" },
  xEn: { url: "https://x.com/IrObservatory", handle: "@IrObservatory" },
  instagram: { url: "https://instagram.com/iranobservatory", handle: "@iranobservatory" },
  linkedin: { url: "https://www.linkedin.com/company/iran-observatory/", handle: "Iran Observatory" },
  substack: { url: "https://iranobservatory.substack.com", handle: "iranobservatory.substack.com" },
};

// Inline glyphs for platforms not covered by lucide-react (X, Substack).
function XIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SubstackIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812zM22.54 0H1.46v2.836h21.08z" />
    </svg>
  );
}

const FOOTER_COPY = {
  fr: {
    institutionLabel: "L'Observatoire",
    aboutLink: "À propos",
    methodologyLink: "Méthodologie",
    manifestoLink: "Manifeste",
    publicationsLabel: "Publications",
    monitor: "Iran Monitor",
    articles: "Articles",
    studies: "Études & Briefs",
    contactLabel: "Contact",
    contactEmail: "contact@iranobservatory.org",
    independenceNote:
      "Iran Observatory est strictement indépendant. Ses sources de financement sont publiées et auditables. Aucun État, parti ou organisation d'opposition ne dirige sa ligne éditoriale.",
    rights: "Tous droits réservés.",
  },
  en: {
    institutionLabel: "The Observatory",
    aboutLink: "About",
    methodologyLink: "Methodology",
    manifestoLink: "Manifesto",
    publicationsLabel: "Publications",
    monitor: "Iran Monitor",
    articles: "Articles",
    studies: "Studies & Briefs",
    contactLabel: "Contact",
    contactEmail: "contact@iranobservatory.org",
    independenceNote:
      "Iran Observatory is strictly independent. Its funding sources are published and auditable. No state, party or opposition organisation directs its editorial line.",
    rights: "All rights reserved.",
  },
  fa: {
    institutionLabel: "رصدخانه",
    aboutLink: "درباره ما",
    methodologyLink: "روش‌شناسی",
    manifestoLink: "بیانیه",
    publicationsLabel: "انتشارات",
    monitor: "رصد ایران",
    articles: "مقالات",
    studies: "مطالعات و گزارش‌ها",
    contactLabel: "تماس",
    contactEmail: "contact@iranobservatory.org",
    independenceNote:
      "رصدخانه ایران کاملاً مستقل است. منابع تأمین مالی آن منتشر و قابل بررسی است. هیچ دولت، حزب یا سازمان اپوزیسیونی خط مشی تحریریه آن را هدایت نمی‌کند.",
    rights: "تمامی حقوق محفوظ است.",
  },
};

export function Footer() {
  const { language, setLanguage, t } = useLanguage();
  const c = FOOTER_COPY[language] || FOOTER_COPY.en;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1E3A5F] text-white" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <img src={LOGO_URL} alt="Iran Observatory" className="h-14 w-auto mb-4" />
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">
              {t('tagline')}
            </p>
            <p className="text-xs text-[#3DB883] italic">{t('motto')}</p>
          </div>

          {/* Institution */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.institutionLabel}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/a-propos" className="text-zinc-300 hover:text-white transition-colors" data-testid="footer-link-about">
                  {c.aboutLink}
                </Link>
              </li>
              <li>
                <Link to="/methodologie" className="text-zinc-300 hover:text-white transition-colors" data-testid="footer-link-methodology">
                  {c.methodologyLink}
                </Link>
              </li>
              <li>
                <Link to="/manifeste" className="text-zinc-300 hover:text-white transition-colors" data-testid="footer-link-manifesto">
                  {c.manifestoLink}
                </Link>
              </li>
            </ul>
          </div>

          {/* Publications */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.publicationsLabel}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/monitor" className="text-zinc-300 hover:text-white transition-colors">
                  {c.monitor}
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-zinc-300 hover:text-white transition-colors">
                  {c.articles}
                </Link>
              </li>
              <li>
                <Link to="/studies" className="text-zinc-300 hover:text-white transition-colors">
                  {c.studies}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3DB883] mb-4">
              {c.contactLabel}
            </h4>
            <a
              href={`mailto:${c.contactEmail}`}
              className="text-zinc-300 hover:text-white transition-colors font-mono text-xs"
              data-testid="footer-email-contact"
            >
              {c.contactEmail}
            </a>

            {/* Social icons row */}
            <div className="mt-5 flex items-center gap-3" data-testid="footer-social-row">
              {(() => {
                const x = language === 'fr' ? SOCIAL_LINKS.xFr : SOCIAL_LINKS.xEn;
                const items = [
                  { key: 'x', href: x.url, label: `X — ${x.handle}`, icon: <XIcon className="w-4 h-4" /> },
                  { key: 'instagram', href: SOCIAL_LINKS.instagram.url, label: `Instagram — ${SOCIAL_LINKS.instagram.handle}`, icon: <Instagram className="w-4 h-4" strokeWidth={1.5} /> },
                  { key: 'linkedin', href: SOCIAL_LINKS.linkedin.url, label: `LinkedIn — ${SOCIAL_LINKS.linkedin.handle}`, icon: <Linkedin className="w-4 h-4" strokeWidth={1.5} /> },
                  { key: 'substack', href: SOCIAL_LINKS.substack.url, label: `Substack — ${SOCIAL_LINKS.substack.handle}`, icon: <SubstackIcon className="w-4 h-4" /> },
                ];
                return items.map((it) => (
                  <a
                    key={it.key}
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={it.label}
                    title={it.label}
                    className="w-9 h-9 inline-flex items-center justify-center border border-[#2A4A73] text-zinc-300 hover:text-[#3DB883] hover:border-[#3DB883] transition-colors"
                    data-testid={`footer-social-${it.key}`}
                  >
                    {it.icon}
                  </a>
                ));
              })()}
            </div>

            {/* Language switcher */}
            <div className="mt-4 flex gap-2">
              {[{ c: 'fr', l: 'FR' }, { c: 'en', l: 'EN' }, { c: 'fa', l: 'FA' }].map(({ c: code, l }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                    language === code
                      ? 'bg-[#3DB883] border-[#3DB883] text-[#1E3A5F]'
                      : 'border-[#2A4A73] text-zinc-300 hover:border-[#3DB883]'
                  }`}
                  data-testid={`footer-lang-${code}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Independence statement */}
        <div className="border-t border-[#2A4A73] mt-10 pt-6">
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-3xl">
            {c.independenceNote}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 flex flex-col md:flex-row gap-2 md:justify-between md:items-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            © {year} Iran Observatory. {c.rights}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            iranobservatory.org
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
