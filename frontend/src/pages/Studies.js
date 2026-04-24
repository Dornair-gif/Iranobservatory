import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpen, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';

const STUDIES_PER_PAGE = 8;

// Extract first <img> src from HTML content
function extractCoverImage(article, language) {
  if (article.image_url) return article.image_url;
  const content = article[`content_${language}`] || article.content_en || article.content_fr || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export default function Studies() {
  const { t, language, getArticleField } = useLanguage();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const studiesAndAnalyses = response.data.filter(a => a.content_type === 'study' || a.content_type === 'analysis');
        setStudies(studiesAndAnalyses);
      } catch (e) {
        console.error('Failed to fetch studies:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, [language]);

  const totalPages = Math.ceil(studies.length / STUDIES_PER_PAGE);
  const paginatedStudies = studies.slice((currentPage - 1) * STUDIES_PER_PAGE, currentPage * STUDIES_PER_PAGE);
  const featuredStudy = currentPage === 1 ? paginatedStudies[0] : null;
  const gridStudies = currentPage === 1 ? paginatedStudies.slice(1) : paginatedStudies;

  const locales = { en: enUS, fr: frLocale, fa: enUS };
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: locales[language] || enUS });
    } catch { return ''; }
  };

  const seoTitles = { en: 'Studies & Analysis', fr: 'Etudes & Analyses', fa: 'مطالعات و تحلیل‌ها' };
  const seoDescriptions = {
    en: 'In-depth studies and analyses on Iran from Iran Observatory.',
    fr: 'Etudes et analyses approfondies sur l\'Iran par l\'Observatoire de l\'Iran.',
    fa: 'مطالعات و تحلیل‌های عمیق درباره ایران از رصدخانه ایران.'
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="studies-page">
      <SEO 
        title={seoTitles[language] || seoTitles.en}
        description={seoDescriptions[language] || seoDescriptions.en}
        url="/studies"
        language={language}
      />

      {/* Header */}
      <div className="bg-[#1E3A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/" className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors">
            {language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home'}
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <BookOpen className="w-10 h-10 text-[#3DB883]" strokeWidth={1.5} />
            <div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter">
                {language === 'fr' ? 'Etudes & Analyses' : language === 'fa' ? 'مطالعات و تحلیل‌ها' : 'Studies & Analysis'}
              </h1>
              <p className="text-zinc-400 mt-2 text-sm max-w-xl">
                {language === 'fr' 
                  ? 'Recherches approfondies et analyses détaillées sur les enjeux stratégiques liés à l\'Iran'
                  : language === 'fa' ? 'پژوهش‌های عمیق و تحلیل‌های جزئی درباره مسائل استراتژیک مرتبط با ایران'
                  : 'In-depth research and detailed analyses on strategic issues related to Iran'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 animate-pulse h-64" />
            ))}
          </div>
        ) : studies.length === 0 ? (
          <div className="text-center py-20 border border-zinc-200 bg-white">
            <BookOpen className="w-14 h-14 text-zinc-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {language === 'fr' ? 'Aucune publication pour le moment' : language === 'fa' ? 'هنوز مطالعه‌ای وجود ندارد' : 'No publications yet'}
            </p>
            <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
              {language === 'fr' 
                ? 'Nos premières études et analyses seront bientôt disponibles'
                : 'Our first studies and analyses will be available soon'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Study (page 1 only) */}
            {featuredStudy && (
              <Link
                to={`/article/${featuredStudy.id}`}
                className="group block mb-10 bg-white border border-zinc-200 overflow-hidden"
                data-testid="featured-study"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  {extractCoverImage(featuredStudy, language) ? (
                    <div className="lg:col-span-2 aspect-[4/3] lg:aspect-auto overflow-hidden">
                      <img
                        src={extractCoverImage(featuredStudy, language)}
                        alt={getArticleField(featuredStudy, 'title')}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#1E3A5F] to-[#2a4d75] flex items-center justify-center p-10">
                      <BookOpen className="w-20 h-20 text-[#3DB883]/40" strokeWidth={1} />
                    </div>
                  )}
                  <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${
                        featuredStudy.content_type === 'study'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {featuredStudy.content_type === 'study'
                          ? (language === 'fr' ? 'Etude' : 'Study')
                          : (language === 'fr' ? 'Analyse' : 'Analysis')}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        {formatDate(featuredStudy.published_at || featuredStudy.created_at)}
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter leading-tight mb-4 group-hover:text-[#1E3A5F] transition-colors">
                      {getArticleField(featuredStudy, 'title')}
                    </h2>
                    <p className="text-zinc-600 line-clamp-4 mb-6 leading-relaxed">
                      {getArticleField(featuredStudy, 'summary')}
                    </p>
                    {featuredStudy.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredStudy.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-mono">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#3DB883] font-mono text-xs uppercase tracking-wider">
                      {t('readMore')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Studies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gridStudies.map((study) => (
                <Link
                  key={study.id}
                  to={`/article/${study.id}`}
                  className="group bg-white border border-zinc-200 overflow-hidden flex flex-col sm:flex-row"
                  data-testid={`study-card-${study.id}`}
                >
                  {extractCoverImage(study, language) ? (
                    <div className="sm:w-48 aspect-[16/10] sm:aspect-auto overflow-hidden flex-shrink-0">
                      <img
                        src={extractCoverImage(study, language)}
                        alt={getArticleField(study, 'title')}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="sm:w-48 bg-gradient-to-br from-[#1E3A5F] to-[#2a4d75] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-10 h-10 text-[#3DB883]/30" strokeWidth={1} />
                    </div>
                  )}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          study.content_type === 'study'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {study.content_type === 'study'
                            ? (language === 'fr' ? 'Etude' : 'Study')
                            : (language === 'fr' ? 'Analyse' : 'Analysis')}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatDate(study.published_at || study.created_at)}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-base leading-tight mb-2 group-hover:text-[#1E3A5F] transition-colors">
                        {getArticleField(study, 'title')}
                      </h3>
                      <p className="text-zinc-500 text-sm line-clamp-2">
                        {getArticleField(study, 'summary')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-zinc-400 group-hover:text-[#3DB883] transition-colors mt-3">
                      {t('readMore')}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                  data-testid="studies-pagination-prev"
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
                    data-testid={`studies-pagination-${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                  data-testid="studies-pagination-next"
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
