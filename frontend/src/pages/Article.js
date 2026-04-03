import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ExternalLink, Calendar, Tag, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Article() {
  const { id } = useParams();
  const { language, t, getArticleField } = useLanguage();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`${API}/articles/${id}`);
        setArticle(response.data);
      } catch (e) {
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const locales = { en: enUS, fr: fr, fa: enUS };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-32 bg-zinc-100" />
            <div className="h-10 bg-zinc-100" />
            <div className="h-6 w-3/4 bg-zinc-100" />
            <div className="aspect-[16/9] bg-zinc-100" />
            <div className="space-y-3">
              <div className="h-4 bg-zinc-100" />
              <div className="h-4 bg-zinc-100" />
              <div className="h-4 w-2/3 bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading font-black text-2xl mb-4">Article Not Found</h1>
          <Link to="/" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const title = getArticleField(article, 'title');
  const content = getArticleField(article, 'content');
  const summary = getArticleField(article, 'summary');

  const publishedDate = article.published_at || article.created_at;
  const formattedDate = publishedDate 
    ? format(new Date(publishedDate), 'PPP', { locale: locales[language] || enUS })
    : '';
  const timeAgo = publishedDate
    ? formatDistanceToNow(new Date(publishedDate), { 
        addSuffix: true, 
        locale: locales[language] || enUS 
      })
    : '';

  return (
    <div className="min-h-screen bg-white" data-testid="article-page">
      {/* Back navigation */}
      <div className="border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
            data-testid="back-link"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {t('latestNews')}
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-red-700 text-white text-xs font-mono uppercase tracking-wider">
            {article.category || 'News'}
          </span>
          <span className="font-mono text-xs text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={1.5} />
            {formattedDate} • {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h1 
          className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter leading-tight mb-6"
          data-testid="article-title"
        >
          {title}
        </h1>

        {/* Summary */}
        <p className="text-lg sm:text-xl text-zinc-600 mb-8 leading-relaxed">
          {summary}
        </p>

        {/* Featured Image */}
        {article.image_url && (
          <div className="relative aspect-[16/9] mb-8 overflow-hidden border border-zinc-200">
            <img
              src={article.image_url}
              alt={title}
              className="w-full h-full object-cover"
              data-testid="article-image"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-p:text-zinc-700 prose-p:leading-relaxed"
          data-testid="article-content"
        >
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-zinc-100 text-xs font-mono uppercase tracking-wider text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        {article.source_url && (
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <a 
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-red-700 transition-colors"
              data-testid="source-link"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              {t('source')}
            </a>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 pt-8 border-t border-zinc-200 flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-none border-zinc-200 font-mono text-xs uppercase tracking-wider"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            data-testid="share-btn"
          >
            <Share2 className="w-4 h-4 me-2" strokeWidth={1.5} />
            Share
          </Button>
          
          <Link to="/" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {t('latestNews')}
          </Link>
        </div>
      </article>
    </div>
  );
}
