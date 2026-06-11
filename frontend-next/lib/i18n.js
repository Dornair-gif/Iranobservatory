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
    tagline: "Analyse indépendante des dynamiques politiques, économiques et sociales iraniennes",
    motto: "L'avenir de l'Iran compte bien au-delà de ses frontières",
    latestNews: "Dernières Actualités",
    breakingNews: "À la Une",
    readMore: "Lire la suite",
    articles: "Articles",
    studies: "Études & Briefs",
    monitor: "Iran Monitor",
    about: "À propos",
    methodology: "Méthodologie",
    manifesto: "Manifeste",
    contact: "Contact",
    publishedOn: "Publié le",
    independent: "Indépendant",
    factBased: "Analyses indépendantes, basées sur des faits — sans drapeau",
    liveFeed: "Fil d'Actualités en Direct",
    feedDesc: "Posts agrégés depuis X, Instagram et LinkedIn",
    seo: {
      home: {
        title: "Iran Observatory — Analyse indépendante de l'Iran",
        description: "Plateforme indépendante d'analyse stratégique sur l'Iran : veille vérifiée, décryptages structurels, anticipations longues. Pour les chancelleries, rédactions et fondations européennes.",
      },
      articles: {
        title: "Articles — Iran Observatory",
        description: "Toutes les analyses d'Iran Observatory sur la politique, l'économie, les droits humains et la géopolitique iranienne.",
      },
    },
  },
  en: {
    siteName: "Iran Observatory",
    tagline: "Independent insights into Iran's political, economic and social dynamics",
    motto: "Iran's future matters, far beyond its borders",
    latestNews: "Latest News",
    breakingNews: "Top Stories",
    readMore: "Read more",
    articles: "Articles",
    studies: "Studies & Briefs",
    monitor: "Iran Monitor",
    about: "About",
    methodology: "Methodology",
    manifesto: "Manifesto",
    contact: "Contact",
    publishedOn: "Published",
    independent: "Independent",
    factBased: "Fact-based analysis. No flag.",
    liveFeed: "Live News Feed",
    feedDesc: "Aggregated posts from X, Instagram and LinkedIn",
    seo: {
      home: {
        title: "Iran Observatory — Independent analysis of Iran",
        description: "An independent strategic intelligence platform on Iran: verified monitoring, structural analysis, long-horizon forecasting. Built for European chancelleries, newsrooms and foundations.",
      },
      articles: {
        title: "Articles — Iran Observatory",
        description: "All Iran Observatory analyses on Iranian politics, economy, human rights and geopolitics.",
      },
    },
  },
  fa: {
    siteName: "رصدخانه ایران",
    tagline: "تحلیل مستقل پویایی‌های سیاسی، اقتصادی و اجتماعی ایران",
    motto: "آینده ایران فراتر از مرزهایش اهمیت دارد",
    latestNews: "آخرین اخبار",
    breakingNews: "مهم‌ترین خبرها",
    readMore: "ادامه مطلب",
    articles: "مقالات",
    studies: "مطالعات و گزارش‌ها",
    monitor: "رصد ایران",
    about: "درباره ما",
    methodology: "روش‌شناسی",
    manifesto: "بیانیه",
    contact: "تماس",
    publishedOn: "منتشر شده",
    independent: "مستقل",
    factBased: "تحلیل مبتنی بر واقعیت. بدون پرچم.",
    liveFeed: "فید اخبار زنده",
    feedDesc: "پست‌های جمع‌آوری‌شده از X، اینستاگرام و لینکدین",
    seo: {
      home: {
        title: "رصدخانه ایران — تحلیل مستقل ایران",
        description: "پلتفرم مستقل تحلیل و رصد استراتژیک ایران.",
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
