import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpen, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';

const ITEMS_PER_PAGE = 8;

function extractCoverImage(article, language) {
  if (article.image_url) return article.image_url;
  const content = article[`content_${language}`] || article.content_en || article.content_fr || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export default function Studies() {
  const { t, language, getArticleField } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const filtered = response.data.filter(a => 
          a.content_type === 'study' || a.content_type === 'analysis' || a.content_type === 'brief'
        );
        setItems(filtered);
      } catch (e) {
        console.error('Failed to fetch:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [language]);

  const filteredItems = activeTab === 'all' ? items 
    : activeTab === 'studies' ? items.filter(a => a.content_type === 'study' || a.content_type === 'analysis')
    : items.filter(a => a.content_type === 'brief');

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const featuredItem = currentPage === 1 ? paginatedItems[0] : null;
  const gridItems = currentPage === 1 ? paginatedItems.slice(1) : paginatedItems;

  const locales = { en: enUS, fr: frLocale, fa: enUS };
  const formatDate = (date) => {
    if (!date) return '';
    try { return format(new Date(date), 'dd MMM yyyy', { locale: locales[language] || enUS }); } catch { return ''; }
  };

  const tabs = [
    { id: 'all', label: language === 'fr' ? 'Tout' : 'All' },
    { id: 'studies', label: language === 'fr' ? 'Etudes & Analyses' : 'Studies & Analysis' },
    { id: 'briefs', label: language === 'fr' ? 'Briefs Hebdo' : 'Weekly Briefs' }
  ];

  const typeLabel = (type) => {
    if (type === 'brief') return language === 'fr' ? 'Brief Hebdo' : 'Weekly Brief';
    if (type === 'study') return language === 'fr' ? 'Etude' : 'Study';
    return language === 'fr' ? 'Analyse' : 'Analysis';
  };
  const typeBadge = (type) => {
    if (type === 'brief') return 'bg-amber-100 text-amber-700';
    if (type === 'study') return 'bg-blue-100 text-blue-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="studies-page">
      <SEO 
        title={language === 'fr' ? 'Etudes & Briefs' : 'Studies & Briefs'}
        description={language === 'fr' ? 'Etudes, analyses et briefs hebdomadaires' : 'Studies, analyses and weekly intelligence briefs'}
        url="/studies" language={language}
      />

      {/* Header */}
      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/" className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors">
            {language === 'fr' ? 'Accueil' : 'Home'}
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <BookOpen className="w-10 h-10 text-[#3DB883]" strokeWidth={1.5} />
            <div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter">
                {language === 'fr' ? 'Etudes & Briefs' : 'Studies & Briefs'}
              </h1>
              <p className="text-zinc-400 mt-2 text-sm max-w-xl">
                {language === 'fr' 
                  ? 'Recherches approfondies, analyses stratégiques et briefs hebdomadaires sur l\'Iran'
                  : 'In-depth research, strategic analyses and weekly intelligence briefs on Iran'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-5 py-3 text-sm font-mono uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-[#1E3A5F] text-[#1E3A5F] font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 animate-pulse h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-zinc-200 bg-white rounded-lg">
            <BookOpen className="w-14 h-14 text-zinc-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {language === 'fr' ? 'Aucune publication pour le moment' : 'No publications yet'}
            </p>
            <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
              {activeTab === 'briefs'
                ? (language === 'fr' ? 'Le premier brief hebdomadaire sera publié lundi prochain' : 'The first weekly brief will be published next Monday')
                : (language === 'fr' ? 'Nos premières études seront bientôt disponibles' : 'Our first studies will be available soon')}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Item */}
            {featuredItem && (
              <Link
                to={`/article/${featuredItem.id}`}
                className="group block mb-8 bg-white border border-zinc-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                data-testid="featured-study"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  {extractCoverImage(featuredItem, language) ? (
                    <div className="lg:col-span-2 aspect-[4/3] lg:aspect-auto overflow-hidden">
                      <img
                        src={extractCoverImage(featuredItem, language)}
                        alt={getArticleField(featuredItem, 'title')}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#1E3A5F] to-[#2a4d75] flex items-center justify-center p-10">
                      {featuredItem.content_type === 'brief' 
                        ? <FileText className="w-20 h-20 text-amber-400/40" strokeWidth={1} />
                        : <BookOpen className="w-20 h-20 text-[#3DB883]/40" strokeWidth={1} />}
                    </div>
                  )}
                  <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded ${typeBadge(featuredItem.content_type)}`}>
                        {typeLabel(featuredItem.content_type)}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        {formatDate(featuredItem.published_at || featuredItem.created_at)}
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-2xl lg:text-3xl tracking-tighter leading-tight mb-3 group-hover:text-[#1E3A5F] transition-colors">
                      {getArticleField(featuredItem, 'title')}
                    </h2>
                    <p className="text-zinc-600 line-clamp-3 mb-6 leading-relaxed text-base">
                      {getArticleField(featuredItem, 'summary')}
                    </p>
                    <div className="flex items-center gap-2 text-[#3DB883] font-mono text-xs uppercase tracking-wider">
                      {t('readMore')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/article/${item.id}`}
                  className="group bg-white border border-zinc-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  data-testid={`study-card-${item.id}`}
                >
                  {extractCoverImage(item, language) ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={extractCoverImage(item, language)}
                        alt={getArticleField(item, 'title')}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-[#1E3A5F] to-[#2a4d75] flex items-center justify-center">
                      {item.content_type === 'brief' 
                        ? <FileText className="w-12 h-12 text-amber-400/30" strokeWidth={1} />
                        : <BookOpen className="w-12 h-12 text-[#3DB883]/30" strokeWidth={1} />}
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold rounded ${typeBadge(item.content_type)}`}>
                        {typeLabel(item.content_type)}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatDate(item.published_at || item.created_at)}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-lg tracking-tight leading-snug mb-2 group-hover:text-[#1E3A5F] transition-colors">
                      {getArticleField(item, 'title')}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed flex-1">
                      {getArticleField(item, 'summary')}
                    </p>
                    <div className="flex items-center gap-1 text-[#3DB883] font-mono text-xs uppercase tracking-wider mt-4">
                      {t('readMore')}
                      <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-zinc-200 rounded disabled:opacity-30 hover:bg-zinc-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 text-sm font-mono rounded ${currentPage === i + 1 ? 'bg-[#1E3A5F] text-white' : 'border border-zinc-200 hover:bg-zinc-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-zinc-200 rounded disabled:opacity-30 hover:bg-zinc-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
