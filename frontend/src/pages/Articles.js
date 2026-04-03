import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Articles() {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        // Filter to only news articles
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

  return (
    <div className="min-h-screen bg-white" data-testid="articles-page">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 font-mono text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {language === 'fr' ? 'Retour' : language === 'fa' ? 'بازگشت' : 'Back'}
          </Link>
          <div className="flex items-center gap-4">
            <FileText className="w-10 h-10 text-[#3DB883]" strokeWidth={1.5} />
            <div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter">
                {language === 'fr' ? 'Tous les Articles' : language === 'fa' ? 'همه مقالات' : 'All Articles'}
              </h1>
              <p className="text-zinc-400 mt-1">
                {articles.length} {language === 'fr' ? 'articles' : language === 'fa' ? 'مقاله' : 'articles'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 border border-zinc-200 bg-zinc-50">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {t('noArticles')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
