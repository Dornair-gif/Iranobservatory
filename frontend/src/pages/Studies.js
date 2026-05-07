import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpen, Calendar, FileText, FileDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';

function extractCoverImage(article, language) {
  if (article.image_url) return article.image_url;
  const content = article[`content_${language}`] || article.content_en || article.content_fr || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export default function Studies() {
  const { t, language, getArticleField } = useLanguage();
  const [studies, setStudies] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const all = response.data;
        setStudies(all.filter(a => a.content_type === 'study' || a.content_type === 'analysis'));
        setBriefs(all.filter(a => a.content_type === 'brief'));
      } catch (e) {
        console.error('Failed to fetch:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [language]);

  const locales = { en: enUS, fr: frLocale, fa: enUS };
  const formatDate = (date) => {
    if (!date) return '';
    try { return format(new Date(date), 'dd MMM yyyy', { locale: locales[language] || enUS }); } catch { return ''; }
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
              <p className="text-zinc-400 mt-2 text-base max-w-xl">
                {language === 'fr' 
                  ? 'Recherches approfondies, analyses stratégiques et briefs hebdomadaires sur l\'Iran'
                  : 'In-depth research, strategic analyses and weekly intelligence briefs on Iran'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 animate-pulse h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* ============ WEEKLY BRIEFS SECTION ============ */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-7 h-7 text-amber-600" strokeWidth={1.5} />
                <h2 className="font-heading font-black text-3xl tracking-tighter text-[#1E3A5F]">
                  {language === 'fr' ? 'Briefs Hebdomadaires' : 'Weekly Briefs'}
                </h2>
              </div>

              {briefs.length === 0 ? (
                <div className="text-center py-12 border border-amber-200 bg-amber-50 rounded-xl">
                  <FileText className="w-10 h-10 text-amber-300 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
                    {language === 'fr' ? 'Premier brief lundi prochain' : 'First brief next Monday'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {briefs.map((brief) => (
                    <Link
                      key={brief.id}
                      to={`/article/${brief.id}`}
                      className="group bg-white border border-amber-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all"
                      data-testid={`brief-card-${brief.id}`}
                    >
                      <div className="h-2 bg-amber-500" />
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded bg-amber-100 text-amber-700">
                            {language === 'fr' ? 'Brief Hebdo' : 'Weekly Brief'}
                          </span>
                          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            {formatDate(brief.published_at || brief.created_at)}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg tracking-tight leading-snug mb-2 group-hover:text-[#1E3A5F] transition-colors">
                          {getArticleField(brief, 'title')}
                        </h3>
                        <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                          {getArticleField(brief, 'summary')}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <span className="flex items-center gap-1 text-amber-600 font-mono text-xs uppercase tracking-wider">
                            {t('readMore')}
                            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                          </span>
                          <a 
                            href={`${API}/articles/${brief.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#1E3A5F] font-mono text-xs uppercase tracking-wider hover:text-[#3DB883] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`brief-pdf-${brief.id}`}
                          >
                            <FileDown className="w-3 h-3" strokeWidth={1.5} />
                            PDF
                          </a>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ============ STUDIES & ANALYSIS SECTION ============ */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-7 h-7 text-[#1E3A5F]" strokeWidth={1.5} />
                <h2 className="font-heading font-black text-3xl tracking-tighter text-[#1E3A5F]">
                  {language === 'fr' ? 'Etudes & Analyses' : 'Studies & Analysis'}
                </h2>
              </div>

              {studies.length === 0 ? (
                <div className="text-center py-12 border border-zinc-200 bg-white rounded-xl">
                  <BookOpen className="w-10 h-10 text-zinc-200 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
                    {language === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Featured Study */}
                  {studies[0] && (
                    <Link
                      to={`/article/${studies[0].id}`}
                      className="group block bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                      data-testid="featured-study"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-5">
                        {extractCoverImage(studies[0], language) ? (
                          <div className="lg:col-span-2 aspect-[4/3] lg:aspect-auto overflow-hidden">
                            <img
                              src={extractCoverImage(studies[0], language)}
                              alt={getArticleField(studies[0], 'title')}
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
                            <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded bg-purple-100 text-purple-700">
                              {studies[0].content_type === 'study' ? (language === 'fr' ? 'Etude' : 'Study') : (language === 'fr' ? 'Analyse' : 'Analysis')}
                            </span>
                            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" strokeWidth={1.5} />
                              {formatDate(studies[0].published_at || studies[0].created_at)}
                            </span>
                          </div>
                          <h2 className="font-heading font-black text-2xl lg:text-3xl tracking-tighter leading-tight mb-3 group-hover:text-[#1E3A5F] transition-colors">
                            {getArticleField(studies[0], 'title')}
                          </h2>
                          <p className="text-zinc-600 line-clamp-4 mb-6 leading-relaxed text-base">
                            {getArticleField(studies[0], 'summary')}
                          </p>
                          <div className="flex items-center gap-2 text-[#3DB883] font-mono text-xs uppercase tracking-wider">
                            {t('readMore')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* More Studies Grid */}
                  {studies.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {studies.slice(1).map((study) => (
                        <Link
                          key={study.id}
                          to={`/article/${study.id}`}
                          className="group bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                          data-testid={`study-card-${study.id}`}
                        >
                          {extractCoverImage(study, language) ? (
                            <div className="aspect-[16/9] overflow-hidden">
                              <img src={extractCoverImage(study, language)} alt={getArticleField(study, 'title')} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                          ) : (
                            <div className="aspect-[16/9] bg-gradient-to-br from-[#1E3A5F] to-[#2a4d75] flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-[#3DB883]/30" strokeWidth={1} />
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold rounded bg-purple-100 text-purple-700">
                                {study.content_type === 'study' ? (language === 'fr' ? 'Etude' : 'Study') : (language === 'fr' ? 'Analyse' : 'Analysis')}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400">{formatDate(study.published_at || study.created_at)}</span>
                            </div>
                            <h3 className="font-heading font-bold text-lg tracking-tight leading-snug mb-2 group-hover:text-[#1E3A5F] transition-colors">{getArticleField(study, 'title')}</h3>
                            <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed flex-1">{getArticleField(study, 'summary')}</p>
                            <div className="flex items-center gap-1 text-[#3DB883] font-mono text-xs uppercase tracking-wider mt-4">
                              {t('readMore')}<ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
