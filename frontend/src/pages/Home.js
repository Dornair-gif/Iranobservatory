import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ExternalLink, BookOpen, FileText, Radio } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/tkhn3g6l_Iran%20Observatory%20Logo%20transparent%20%281%29.png";

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch all published articles
        const articlesRes = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const allArticles = articlesRes.data;
        
        // Separate news from studies/analyses
        const newsArticles = allArticles.filter(a => !a.content_type || a.content_type === 'news');
        const studiesAndAnalyses = allArticles.filter(a => a.content_type === 'study' || a.content_type === 'analysis');
        
        setArticles(newsArticles);
        setStudies(studiesAndAnalyses);
      } catch (e) {
        console.error('Failed to fetch content:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [language]);

  // Include all articles for the main grid
  const allArticles = [...articles];
  const featuredArticle = allArticles[0];
  const sideArticles = allArticles.slice(1, 3);
  const gridArticles = allArticles.slice(3, 9);

  const seoDescriptions = {
    en: "Independent platform offering fact-based insights into Iran's political, economic and social dynamics. Iran's future matters, far beyond its borders.",
    fr: "Plateforme indépendante offrant des analyses factuelles sur les dynamiques politiques, économiques et sociales de l'Iran.",
    fa: "پلتفرم مستقل ارائه‌دهنده تحلیل‌های مبتنی بر واقعیت درباره پویایی‌های سیاسی، اقتصادی و اجتماعی ایران."
  };

  return (
    <div className="min-h-screen bg-white" data-testid="home-page">
      <SEO 
        title={null}
        description={seoDescriptions[language] || seoDescriptions.en}
        url="/"
        language={language}
      />
      {/* Hero Section - Iran Observatory Brand Colors */}
      <section className="relative bg-[#0a1628] text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-top"
          style={{ 
            backgroundImage: `url('/hero-tehran-milad-night.jpg')`
          }}
        />
        <div className="absolute inset-0 bg-[#1E3A5F]/75" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 animate-fade-up">
              <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse-live" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#3DB883]">
                {t('live')} • {t('independent')}
              </span>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none mb-4 animate-fade-up-delay-1">
              {t('siteName')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-200 mb-4 animate-fade-up-delay-2">
              {t('tagline')}
            </p>
            <p className="text-base text-[#3DB883] font-medium mb-8 animate-fade-up-delay-2 italic">
              "{t('motto')}"
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a 
                href="#latest" 
                className="bg-[#3DB883] text-white uppercase tracking-widest text-xs font-bold px-6 py-3 hover:bg-[#2D9E6E] transition-colors inline-flex items-center gap-2"
                data-testid="explore-news-btn"
              >
                {t('latestNews')}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
        {/* Decorative green line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3DB883]" />
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="latest">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-4">
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter text-[#1E3A5F]">
            {t('latestNews')}
          </h2>
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            {articles.length} {t('articles')}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ArticleCardSkeleton featured />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 border border-zinc-200 bg-zinc-50">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {t('noArticles')}
            </p>
          </div>
        ) : (
          <>
            {/* Featured + Side Articles (Tetris Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
              {/* Featured Article - 8 columns */}
              {featuredArticle && (
                <div className="lg:col-span-8 animate-fade-up">
                  <ArticleCard article={featuredArticle} featured />
                </div>
              )}
              
              {/* Side Articles - 4 columns */}
              <div className="lg:col-span-4 space-y-6">
                {sideArticles.map((article, index) => (
                  <div 
                    key={article.id} 
                    className={`animate-fade-up-delay-${index + 1}`}
                  >
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Articles */}
            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArticles.map((article, index) => (
                  <div 
                    key={article.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            )}

            {/* View All Articles Link */}
            {allArticles.length > 6 && (
              <div className="text-center mt-8">
                <Link 
                  to="/articles" 
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#1E3A5F] text-[#1E3A5F] font-mono text-xs uppercase tracking-wider hover:bg-[#1E3A5F] hover:text-white transition-colors"
                >
                  {language === 'fr' ? 'Voir tous les articles' : language === 'fa' ? 'مشاهده همه مقالات' : 'View All Articles'}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {/* Live News Feed - Extended */}
      <section className="bg-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Radio className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
              <div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter text-white">
                  {language === 'fr' ? 'Fil d\'Actualités en Direct' : language === 'fa' ? 'اخبار زنده' : 'Live News Feed'}
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {language === 'fr' ? 'Suivez nos dernières publications sur les réseaux sociaux' : 
                   language === 'fa' ? 'آخرین پست‌های ما در شبکه‌های اجتماعی' : 
                   'Follow our latest posts from social media'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#3DB883] rounded-full animate-pulse-live" />
              <span className="font-mono text-sm uppercase tracking-widest text-[#3DB883]">
                {t('live')}
              </span>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur border border-white/10 p-6 sm:p-8">
            <iframe 
              src="https://rss.app/embed/v1/wall/cPvRWpMkf81Tx8nr"
              style={{ width: '100%', height: '900px', border: 'none' }}
              title="Iran Observatory Live News Feed"
              data-testid="rss-widget"
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              {language === 'fr' ? 'Contenu agrégé depuis X, Instagram et LinkedIn' : 
               language === 'fa' ? 'محتوا از X، اینستاگرام و لینکدین جمع‌آوری شده است' : 
               'Content aggregated from X, Instagram, and LinkedIn'}
            </p>
          </div>
        </div>
      </section>

      {/* Studies & Analysis Carousel Section */}
      {studies.length > 0 && (
        <section className="bg-[#f8fafc] border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#1E3A5F]" strokeWidth={1.5} />
                <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter text-[#1E3A5F]">
                  {language === 'fr' ? 'Études & Analyses' : language === 'fa' ? 'مطالعات و تحلیل‌ها' : 'Studies & Analysis'}
                </h2>
              </div>
              <Link 
                to="/studies" 
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 text-xs font-mono uppercase tracking-wider hover:bg-purple-200 transition-colors"
              >
                {language === 'fr' ? 'Voir tout' : language === 'fa' ? 'مشاهده همه' : 'View All'}
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            </div>
            
            {/* Carousel */}
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {studies.map((study, index) => (
                  <Link 
                    key={study.id}
                    to={`/article/${study.id}`}
                    className="flex-shrink-0 w-80 sm:w-96 bg-white border border-zinc-200 p-6 hover:shadow-lg transition-shadow group snap-start"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-mono uppercase tracking-wider ${
                        study.content_type === 'study' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {study.content_type === 'study' 
                          ? (language === 'fr' ? 'Étude' : language === 'fa' ? 'مطالعه' : 'Study')
                          : (language === 'fr' ? 'Analyse' : language === 'fa' ? 'تحلیل' : 'Analysis')
                        }
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {new Date(study.published_at || study.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
                      {study[`title_${language}`] || study.title_en || study.title_fr}
                    </h3>
                    <p className="text-sm text-zinc-600 line-clamp-3">
                      {study[`summary_${language}`] || study.summary_en || study.summary_fr}
                    </p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-mono uppercase tracking-wider text-[#3DB883]">
                      {t('readMore')}
                      <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                    </div>
                  </Link>
                ))}
              </div>
              {/* Scroll hint gradient */}
              <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-[#f8fafc] to-transparent pointer-events-none" />
            </div>
            
            <p className="text-center text-zinc-500 text-sm mt-4">
              {language === 'fr' ? '← Glissez pour voir plus →' : language === 'fa' ? '← برای دیدن بیشتر بکشید →' : '← Swipe to see more →'}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                <img 
                  src={LOGO_URL} 
                  alt="Iran Observatory"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-zinc-300 mb-2">
                {t('tagline')}
              </p>
              <p className="text-xs text-[#3DB883] italic">
                {t('motto')}
              </p>
            </div>
            
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#3DB883] mb-4">
                {t('language')}
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={() => setLanguage('en')} 
                  className={`block text-sm transition-colors ${language === 'en' ? 'text-[#3DB883]' : 'text-zinc-300 hover:text-white'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('fr')} 
                  className={`block text-sm transition-colors ${language === 'fr' ? 'text-[#3DB883]' : 'text-zinc-300 hover:text-white'}`}
                >
                  Français
                </button>
                <button 
                  onClick={() => setLanguage('fa')} 
                  className={`block text-sm transition-colors ${language === 'fa' ? 'text-[#3DB883]' : 'text-zinc-300 hover:text-white'}`}
                >
                  فارسی
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#3DB883] mb-4">
                {t('independent')}
              </h4>
              <p className="text-sm text-zinc-300">
                {t('factBased')}
              </p>
            </div>
          </div>
          
          <div className="border-t border-[#2A4A73] mt-8 pt-8 text-center">
            <p className="text-xs text-zinc-400 font-mono">
              © {new Date().getFullYear()} {t('siteName')}. {t('allRights')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
