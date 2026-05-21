import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { Footer } from '../components/Footer';

const TITLES = {
  fr: (slug) => `Articles : ${slug.replace(/-/g, ' ')}`,
  en: (slug) => `Articles tagged: ${slug.replace(/-/g, ' ')}`,
  fa: (slug) => `مقالات: ${slug.replace(/-/g, ' ')}`
};

export default function ArticlesByTag() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [aRes, tRes] = await Promise.all([
          axios.get(`${API}/articles/by-tag/${slug}`),
          axios.get(`${API}/tags`)
        ]);
        setArticles(aRes.data);
        const match = (tRes.data || []).find(t => t.slug === slug);
        setTagName(match?.name || slug.replace(/-/g, ' '));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const heading = tagName || slug.replace(/-/g, ' ');
  const seoTitle = (TITLES[language] || TITLES.fr)(heading);
  const seoDescription = language === 'fr'
    ? `Tous les articles d'Iran Observatory sur ${heading}. Analyses indépendantes et factuelles.`
    : language === 'fa'
      ? `همه مقالات رصدخانه ایران درباره ${heading}.`
      : `All Iran Observatory articles tagged "${heading}". Independent, fact-based reporting.`;

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="articles-by-tag">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`/articles/tag/${slug}`}
        language={language}
        keywords={[heading, 'Iran', 'analyse']}
        breadcrumbs={[
          { name: language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: language === 'fr' ? 'Articles' : language === 'fa' ? 'مقالات' : 'Articles', path: '/articles' },
          { name: `#${heading}`, path: `/articles/tag/${slug}` }
        ]}
      />

      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/articles" className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider">
            ← {language === 'fr' ? 'Tous les articles' : language === 'fa' ? 'همه مقالات' : 'All articles'}
          </Link>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mt-2" data-testid="tag-heading">
            #{heading}
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
            {language === 'fr' ? 'Aucun article pour ce tag.' : language === 'fa' ? 'مقاله‌ای یافت نشد.' : 'No articles found.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
