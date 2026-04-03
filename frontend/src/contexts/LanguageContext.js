import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    siteName: "Iran Observatory",
    tagline: "Independent insights into Iran's political, economic and social dynamics",
    motto: "Iran's future matters, far beyond its borders",
    latestNews: "Latest News",
    breakingNews: "Breaking News",
    live: "LIVE",
    readMore: "Read More",
    source: "Source",
    published: "Published",
    admin: "Admin",
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    dashboard: "Dashboard",
    articles: "Articles",
    drafts: "Drafts",
    published_status: "Published",
    rssFeeds: "RSS Feeds",
    aiGenerate: "AI Generate",
    translate: "Translate",
    publish: "Publish",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    title: "Title",
    content: "Content",
    summary: "Summary",
    category: "Category",
    tags: "Tags",
    fetchFeed: "Fetch Feed",
    addFeed: "Add Feed",
    generateArticle: "Generate Article",
    pendingItems: "Pending Items",
    totalArticles: "Total Articles",
    activeFeeds: "Active Feeds",
    selectItem: "Select an RSS item to generate an article",
    noArticles: "No articles yet",
    allRights: "All rights reserved",
    language: "Language",
    independent: "Independent Platform",
    factBased: "Fact-Based Insights"
  },
  fr: {
    siteName: "Observatoire de l'Iran",
    tagline: "Analyses indépendantes des dynamiques politiques, économiques et sociales de l'Iran",
    motto: "L'avenir de l'Iran compte, bien au-delà de ses frontières",
    latestNews: "Dernières Actualités",
    breakingNews: "Info Flash",
    live: "EN DIRECT",
    readMore: "Lire la suite",
    source: "Source",
    published: "Publié",
    admin: "Admin",
    login: "Connexion",
    logout: "Déconnexion",
    email: "Email",
    password: "Mot de passe",
    dashboard: "Tableau de bord",
    articles: "Articles",
    drafts: "Brouillons",
    published_status: "Publiés",
    rssFeeds: "Flux RSS",
    aiGenerate: "Génération IA",
    translate: "Traduire",
    publish: "Publier",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    title: "Titre",
    content: "Contenu",
    summary: "Résumé",
    category: "Catégorie",
    tags: "Tags",
    fetchFeed: "Récupérer le flux",
    addFeed: "Ajouter un flux",
    generateArticle: "Générer un article",
    pendingItems: "Éléments en attente",
    totalArticles: "Total des articles",
    activeFeeds: "Flux actifs",
    selectItem: "Sélectionnez un élément RSS pour générer un article",
    noArticles: "Aucun article pour le moment",
    allRights: "Tous droits réservés",
    language: "Langue",
    independent: "Plateforme Indépendante",
    factBased: "Analyses Factuelles"
  },
  fa: {
    siteName: "رصدخانه ایران",
    tagline: "تحلیل‌های مستقل از پویایی‌های سیاسی، اقتصادی و اجتماعی ایران",
    motto: "آینده ایران اهمیت دارد، فراتر از مرزهایش",
    latestNews: "آخرین اخبار",
    breakingNews: "خبر فوری",
    live: "زنده",
    readMore: "ادامه مطلب",
    source: "منبع",
    published: "منتشر شده",
    admin: "مدیریت",
    login: "ورود",
    logout: "خروج",
    email: "ایمیل",
    password: "رمز عبور",
    dashboard: "داشبورد",
    articles: "مقالات",
    drafts: "پیش‌نویس‌ها",
    published_status: "منتشر شده",
    rssFeeds: "فیدهای RSS",
    aiGenerate: "تولید با هوش مصنوعی",
    translate: "ترجمه",
    publish: "انتشار",
    edit: "ویرایش",
    delete: "حذف",
    save: "ذخیره",
    cancel: "انصراف",
    title: "عنوان",
    content: "محتوا",
    summary: "خلاصه",
    category: "دسته‌بندی",
    tags: "برچسب‌ها",
    fetchFeed: "دریافت فید",
    addFeed: "افزودن فید",
    generateArticle: "تولید مقاله",
    pendingItems: "موارد در انتظار",
    totalArticles: "کل مقالات",
    activeFeeds: "فیدهای فعال",
    selectItem: "یک مورد RSS را برای تولید مقاله انتخاب کنید",
    noArticles: "هنوز مقاله‌ای وجود ندارد",
    allRights: "تمامی حقوق محفوظ است",
    language: "زبان",
    independent: "پلتفرم مستقل",
    factBased: "تحلیل‌های مبتنی بر واقعیت"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('iran-obs-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('iran-obs-lang', language);
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const getArticleField = (article, field) => {
    return article?.[`${field}_${language}`] || article?.[`${field}_en`] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getArticleField }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
