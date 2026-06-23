// Centralized i18n constants — kept simple, no external lib needed for this
// scope (3 languages, mostly static strings + a few UI labels).

export const LANGUAGES = ["fr", "en", "fa"];
export const DEFAULT_LANG = "fr";

export const LANG_META = {
  fr: { label: "Français", dir: "ltr", htmlLang: "fr-FR" },
  en: { label: "English", dir: "ltr", htmlLang: "en-US" },
  fa: { label: "فارسی", dir: "rtl", htmlLang: "fa-IR" },
};

export function isValidLang(lang) {
  return LANGUAGES.includes(lang);
}

// Centralized translations for UI chrome. Article content itself comes from
// the backend (already multilingual).
export const T = {
  fr: {
    siteName: "Iran Observatory",
    siteNameLong: "Iran Observatory · Decrypt & Intel",
    tagline: "Intelligence et décryptage de l'Iran — analyse indépendante, OSINT vérifié, prospective pour décideurs",
    motto: "Iran's future matters, far beyond its borders.",
    latestNews: "Dernières Actualités",
    breakingNews: "À la Une",
    readMore: "Lire la suite",
    articles: "Articles",
    studies: "Decrypt",
    monitor: "Iran Monitor",
    about: "À propos",
    methodology: "Méthodologie",
    manifesto: "Manifeste",
    contact: "Contact",
    publishedOn: "Publié le",
    independent: "Independent Intelligence on Iran",
    factBased: "Décryptage indépendant et fact-based — sans drapeau",
    liveFeed: "Fil d'Actualités en Direct",
    feedDesc: "Posts agrégés depuis X, Instagram et LinkedIn",
    seo: {
      home: {
        title: "Iran Observatory · Decrypt & Intel — Analyse stratégique de l'Iran",
        description: "Iran Observatory · Decrypt & Intel : plateforme de décryptage indépendant et d'intelligence stratégique sur l'Iran. OSINT vérifié, analyses signées, anticipations long terme pour chancelleries, rédactions et fondations européennes.",
      },
      articles: {
        title: "Décryptage de l'Iran — Articles & Analyses | Iran Observatory",
        description: "Toutes les analyses Iran Observatory · Decrypt & Intel : politique, économie, sanctions, IRGC, droits humains, géopolitique iranienne.",
      },
    },
  },
  en: {
    siteName: "Iran Observatory",
    siteNameLong: "Iran Observatory · Decrypt & Intel",
    tagline: "Intelligence and decryption of Iran — independent analysis, verified OSINT, forecasts for decision-makers",
    motto: "Iran's future matters, far beyond its borders.",
    latestNews: "Latest News",
    breakingNews: "Top Stories",
    readMore: "Read more",
    articles: "Articles",
    studies: "Decrypt",
    monitor: "Iran Monitor",
    about: "About",
    methodology: "Methodology",
    manifesto: "Manifesto",
    contact: "Contact",
    publishedOn: "Published",
    independent: "Independent Intelligence on Iran",
    factBased: "Independent, fact-based decryption. No flag.",
    liveFeed: "Live News Feed",
    feedDesc: "Aggregated posts from X, Instagram and LinkedIn",
    seo: {
      home: {
        title: "Iran Observatory · Decrypt & Intel",
        description: "Iran's future matters, far beyond its borders. Independent OSINT-verified analysis, decryption and forecasts on Iran for European decision-makers.",
      },
      articles: {
        title: "Iran Decryption & Analysis — Articles | Iran Observatory",
        description: "All Iran Observatory · Decrypt & Intel analyses: Iranian politics, economy, sanctions, IRGC, human rights, geopolitics.",
      },
    },
  },
  fa: {
    siteName: "رصدخانه ایران",
    siteNameLong: "رصدخانه ایران · رمزگشایی و اطلاعات",
    tagline: "رمزگشایی ایران — تحلیل مستقل، داده‌های منبع‌بازِ راستی‌آزمایی‌شده، بینش راهبردی برای تصمیم‌گیران",
    motto: "آیندهٔ ایران، فراتر از مرزهایش اهمیت دارد.",
    latestNews: "آخرین اخبار",
    breakingNews: "مهم‌ترین خبرها",
    readMore: "ادامه مطلب",
    articles: "مقالات",
    studies: "رمزگشایی",
    monitor: "رصد ایران",
    about: "درباره ما",
    methodology: "روش‌شناسی",
    manifesto: "بیانیه",
    contact: "تماس",
    publishedOn: "منتشر شده",
    independent: "اطلاعات مستقل از ایران",
    factBased: "رمزگشایی مستقل مبتنی بر واقعیت. بدون پرچم.",
    liveFeed: "فید اخبار زنده",
    feedDesc: "پست‌های جمع‌آوری‌شده از X، اینستاگرام و لینکدین",
    seo: {
      home: {
        title: "رصدخانه ایران · رمزگشایی و اطلاعات — تحلیل استراتژیک ایران",
        description: "رصدخانه ایران · رمزگشایی و اطلاعات: پلتفرم مستقل تحلیل و رصد استراتژیک ایران.",
      },
      articles: {
        title: "مقالات — رصدخانه ایران",
        description: "تحلیل‌های رصدخانه ایران درباره سیاست، اقتصاد و حقوق بشر ایران.",
      },
    },
  },
};

export function t(lang, key) {
  const dict = T[lang] || T[DEFAULT_LANG];
  // dot-path lookup
  return key.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), dict) || "";
}
