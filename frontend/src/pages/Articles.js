import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';

const ARTICLES_PER_PAGE = 9;

export default function Articles() {
  const { t, language, getArticleField } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const newsArticles = response.data.filter(a => !a.content_type || a.content_type === 'news');
        setArticles(newsArticles);
      } catch (e) {
        console.error('Failed to fetch articles:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [language]);

  const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))];
  const filtered = selectedCategory === 'all' ? articles : articles.filter(a => a.category === selectedCategory);
  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filtered.slice((currentPage - 1) * ARTICLES_PER_PAGE, currentPage * ARTICLES_PER_PAGE);
  const featuredArticle = currentPage === 1 ? paginatedArticles[0] : null;
  const gridArticles = currentPage === 1 ? paginatedArticles.slice(1) : paginatedArticles;

  const locales = { en: enUS, fr: frLocale, fa: enUS };
  const timeAgo = (date) => date ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: locales[language] || enUS }) : '';

  const categoryLabels = {
    all: { en: 'All', fr: 'Tout', fa: 'همه' },
    politics: { en: 'Politics', fr: 'Politique', fa: 'سیاست' },
    economy: { en: 'Economy', fr: 'Économie', fa: 'اقتصاد' },
    society: { en: 'Society', fr: 'Société', fa: 'جامعه' },
    military: { en: 'Military', fr: 'Militaire', fa: 'نظامی' },
    diplomacy: { en: 'Diplomacy', fr: 'Diplomatie', fa: 'دیپلماسی' },
  };

  const seoTitles = { en: 'All Articles', fr: 'Tous les Articles', fa: 'همه مقالات' };
  const seoDescriptions = {
    en: 'Browse all news articles from Iran Observatory. Independent insights into Iran\'s political, economic and social dynamics.',
    fr: 'Parcourez tous les articles d\'actualité de l\'Observatoire de l\'Iran.',
    fa: 'مرور تمام مقالات خبری از رصدخانه ایران.'
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="articles-page">
      <SEO 
        title={seoTitles[language] || seoTitles.en}
        description={seoDescriptions[language] || seoDescriptions.en}
        url="/articles"
        language={language}
      />

      {/* Magazine Header */}
      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-end justify-between">
            <div>
              <Link to="/" className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors">
                {language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home'}
              </Link>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mt-2">
                {language === 'fr' ? 'Articles' : language === 'fa' ? 'مقالات' : 'Articles'}
              </h1>
              <p className="text-zinc-400 mt-2 text-sm max-w-xl">
                {language === 'fr' 
                  ? 'Analyses et reportages indépendants sur les dynamiques politiques, économiques et sociales de l\'Iran'
                  : language === 'fa' ? 'تحلیل‌ها و گزارش‌های مستقل درباره پویایی‌های سیاسی، اقتصادی و اجتماعی ایران'
                  : 'Independent reporting and analysis on Iran\'s political, economic and social dynamics'}
              </p>
            </div>
            <span className="hidden sm:block font-mono text-xs text-zinc-500 uppercase tracking-wider">
              {filtered.length} {language === 'fr' ? 'articles' : 'articles'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {categories.map(cat => {
              const label = categoryLabels[cat]?.[language] || cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`px-5 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                    selectedCategory === cat
                      ? 'border-[#3DB883] text-[#1E3A5F] font-bold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
                  }`}
                  data-testid={`filter-${cat}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-zinc-200 bg-white">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {language === 'fr' ? 'Aucun article dans cette catégorie' : language === 'fa' ? 'مقاله‌ای یافت نشد' : 'No articles in this category'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Article (page 1 only) */}
            {featuredArticle && (
              <Link
                to={`/article/${featuredArticle.id}`}
                className="group block mb-10 bg-white border border-zinc-200 overflow-hidden"
                data-testid="featured-article"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="aspect-[16/10] lg:aspect-auto overflow-hidden">
                    <img
                      src={featuredArticle.image_url || '/hero-tehran-milad-night.jpg'}
                      alt={getArticleField(featuredArticle, 'title')}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#3DB883] text-white text-xs font-mono uppercase tracking-wider">
                        {featuredArticle.category || 'News'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        {timeAgo(featuredArticle.published_at || featuredArticle.created_at)}
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter leading-tight mb-4 group-hover:text-[#1E3A5F] transition-colors">
                      {getArticleField(featuredArticle, 'title')}
                    </h2>
                    <p className="text-zinc-600 line-clamp-3 mb-6">
                      {getArticleField(featuredArticle, 'summary')}
                    </p>
                    <div className="flex items-center gap-2 text-[#3DB883] font-mono text-xs uppercase tracking-wider">
                      {t('readMore')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid="pagination-prev"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 font-mono text-sm border transition-colors ${
                      currentPage === i + 1
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'border-zinc-200 hover:bg-zinc-100'
                    }`}
                    data-testid={`pagination-${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid="pagination-next"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
