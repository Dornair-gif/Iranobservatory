import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Home() {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        setArticles(response.data);
      } catch (e) {
        console.error('Failed to fetch articles:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [language]);

  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1, 3);
  const gridArticles = articles.slice(3, 9);

  return (
    <div className="min-h-screen bg-white" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative bg-zinc-900 text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ 
            backgroundImage: `url('https://images.pexels.com/photos/31468386/pexels-photo-31468386.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')` 
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 animate-fade-up">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-live" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-red-400">
                {t('live')} • {t('breakingNews')}
              </span>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none mb-6 animate-fade-up-delay-1">
              {t('siteName')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-300 mb-8 animate-fade-up-delay-2">
              {t('tagline')}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a 
                href="#latest" 
                className="btn-primary inline-flex items-center gap-2"
                data-testid="explore-news-btn"
              >
                {t('latestNews')}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="latest">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-4">
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter">
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
          </>
        )}
      </main>

      {/* RSS Widget Preview */}
      <section className="bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-xl tracking-tight">
              Social Feed
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-live" />
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                {t('live')}
              </span>
            </div>
          </div>
          
          <div className="bg-white border border-zinc-200 p-4 sm:p-6">
            <iframe 
              src="https://rss.app/embed/v1/wall/cPvRWpMkf81Tx8nr"
              style={{ width: '100%', height: '400px', border: 'none' }}
              title="Iran Observatory Social Feed"
              data-testid="rss-widget"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-700 flex items-center justify-center">
                  <span className="text-white font-heading font-black text-lg">IO</span>
                </div>
                <h3 className="font-heading font-black text-lg tracking-tighter">
                  {t('siteName')}
                </h3>
              </div>
              <p className="text-sm text-zinc-400">
                {t('tagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4">
                {t('language')}
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={() => {}} 
                  className="block text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  English
                </button>
                <button 
                  onClick={() => {}} 
                  className="block text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Français
                </button>
                <button 
                  onClick={() => {}} 
                  className="block text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  فارسی
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4">
                Connect
              </h4>
              <div className="flex gap-4">
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center">
            <p className="text-xs text-zinc-500 font-mono">
              © {new Date().getFullYear()} {t('siteName')}. {t('allRights')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
