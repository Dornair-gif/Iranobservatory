import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';
import SEO from '../components/SEO';
import { API } from '../config/api';

const CATEGORY_LABELS = {
  news:      { fr: 'Actualités', en: 'News', fa: 'اخبار' },
  politics:  { fr: 'Politique', en: 'Politics', fa: 'سیاست' },
  economy:   { fr: 'Économie', en: 'Economy', fa: 'اقتصاد' },
  society:   { fr: 'Société', en: 'Society', fa: 'جامعه' },
  military:  { fr: 'Militaire', en: 'Military', fa: 'نظامی' },
  diplomacy: { fr: 'Diplomatie', en: 'Diplomacy', fa: 'دیپلماسی' },
  sanctions: { fr: 'Sanctions', en: 'Sanctions', fa: 'تحریم‌ها' },
  rights:    { fr: 'Droits humains', en: 'Human Rights', fa: 'حقوق بشر' },
  analysis:  { fr: 'Analyses', en: 'Analysis', fa: 'تحلیل' },
  study:     { fr: 'Études', en: 'Studies', fa: 'مطالعات' },
  brief:     { fr: 'Briefs', en: 'Briefs', fa: 'بریف‌ها' }
};

export default function ArticlesByCategory() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/articles/by-category/${slug}`);
        setArticles(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const labelObj = CATEGORY_LABELS[slug] || { fr: slug, en: slug, fa: slug };
  const heading = labelObj[language] || labelObj.fr;

  const seoTitle = language === 'fr'
    ? `${heading} sur l'Iran — analyses indépendantes`
    : language === 'fa'
      ? `${heading} ایران — تحلیل‌های مستقل`
      : `${heading} on Iran — independent analysis`;

  const seoDescription = language === 'fr'
    ? `Articles, analyses et études de l'Observatoire de l'Iran sur le thème "${heading}". Couverture multilingue, sources vérifiées.`
    : language === 'fa'
      ? `مقالات، تحلیل‌ها و مطالعات رصدخانه ایران درباره "${heading}". پوشش چندزبانه، منابع تأیید شده.`
      : `Articles, analysis and studies from Iran Observatory on "${heading}". Multilingual coverage, verified sources.`;

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="articles-by-category">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`/articles/category/${slug}`}
        language={language}
        keywords={[heading, 'Iran', labelObj.en]}
        breadcrumbs={[
          { name: language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: language === 'fr' ? 'Articles' : language === 'fa' ? 'مقالات' : 'Articles', path: '/articles' },
          { name: heading, path: `/articles/category/${slug}` }
        ]}
      />

      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/articles" className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider">
            ← {language === 'fr' ? 'Tous les articles' : language === 'fa' ? 'همه مقالات' : 'All articles'}
          </Link>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mt-2" data-testid="category-heading">
            {heading}
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            {articles.length} {language === 'fr' ? 'article(s)' : language === 'fa' ? 'مقاله' : 'article(s)'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-center text-zinc-500 py-20">
            {language === 'fr' ? 'Aucun article dans cette catégorie.' : language === 'fa' ? 'مقاله‌ای یافت نشد.' : 'No articles in this category.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
