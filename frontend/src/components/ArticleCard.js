import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

export function ArticleCard({ article, featured = false }) {
  const { language, t, getArticleField } = useLanguage();
  
  const title = getArticleField(article, 'title');
  const summary = getArticleField(article, 'summary');
  
  const locales = { en: enUS, fr: fr, fa: enUS };
  
  const timeAgo = article.published_at || article.created_at 
    ? formatDistanceToNow(new Date(article.published_at || article.created_at), { 
        addSuffix: true,
        locale: locales[language] || enUS
      })
    : '';

  if (featured) {
    return (
      <Link 
        to={`/article/${article.id}`}
        className="article-card group block bg-white border border-zinc-200 overflow-hidden"
        data-testid={`featured-article-${article.id}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={article.image_url || 'https://images.unsplash.com/photo-1767208212251-7b9b0bde15db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHx0ZWhyYW4lMjBza3lsaW5lfGVufDB8fHx8MTc3NTIwMjc0NHww&ixlib=rb-4.1.0&q=85'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5F]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-[#3DB883] text-xs font-mono uppercase tracking-wider">
                {article.category || 'News'}
              </span>
              <span className="text-xs font-mono opacity-80">{timeAgo}</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tighter leading-tight mb-2">
              {title}
            </h2>
            <p className="text-sm opacity-90 line-clamp-2">
              {summary}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/article/${article.id}`}
      className="article-card group block bg-white border border-zinc-200 p-4 h-full flex flex-col"
      data-testid={`article-card-${article.id}`}
    >
      {article.image_url && (
        <div className="relative aspect-[16/10] overflow-hidden mb-4 -mx-4 -mt-4">
          <img
            src={article.image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#3DB883]">
          {article.category || 'News'}
        </span>
        <span className="text-xs font-mono text-zinc-400">{timeAgo}</span>
      </div>
      
      <h3 className="font-heading font-bold text-lg tracking-tight leading-tight mb-2 group-hover:text-[#1E3A5F] transition-colors flex-grow">
        {title}
      </h3>
      
      <p className="text-sm text-zinc-600 line-clamp-2 mb-3">
        {summary}
      </p>
      
      <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-zinc-500 group-hover:text-[#3DB883] transition-colors mt-auto">
        {t('readMore')}
        <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </div>
    </Link>
  );
}

export function ArticleCardSkeleton({ featured = false }) {
  if (featured) {
    return (
      <div className="bg-zinc-100 animate-pulse aspect-[16/9]" />
    );
  }
  
  return (
    <div className="bg-white border border-zinc-200 p-4 h-full">
      <div className="aspect-[16/10] bg-zinc-100 animate-pulse mb-4 -mx-4 -mt-4" />
      <div className="h-3 w-20 bg-zinc-100 animate-pulse mb-2" />
      <div className="h-5 bg-zinc-100 animate-pulse mb-2" />
      <div className="h-5 w-3/4 bg-zinc-100 animate-pulse mb-3" />
      <div className="h-3 bg-zinc-100 animate-pulse mb-1" />
      <div className="h-3 w-2/3 bg-zinc-100 animate-pulse" />
    </div>
  );
}
