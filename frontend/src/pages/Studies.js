import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Studies() {
  const { t, language } = useLanguage();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await axios.get(`${API}/articles?status=published&lang=${language}`);
        // Filter to only studies and analyses
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

  const seoTitles = {
    en: 'Studies & Analysis',
    fr: 'Études & Analyses',
    fa: 'مطالعات و تحلیل‌ها'
  };

  const seoDescriptions = {
    en: 'In-depth studies and analyses on Iran from Iran Observatory. Independent research on Iran\'s political, economic and social dynamics.',
    fr: 'Études et analyses approfondies sur l\'Iran. Recherche indépendante sur les dynamiques politiques, économiques et sociales de l\'Iran.',
    fa: 'مطالعات و تحلیل‌های عمیق درباره ایران از رصدخانه ایران. پژوهش مستقل درباره پویایی‌های سیاسی، اقتصادی و اجتماعی ایران.'
  };

  return (
    <div className="min-h-screen bg-white" data-testid="studies-page">
      <SEO 
        title={seoTitles[language] || seoTitles.en}
        description={seoDescriptions[language] || seoDescriptions.en}
        url="/studies"
        language={language}
      />
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
            <BookOpen className="w-10 h-10 text-[#3DB883]" strokeWidth={1.5} />
            <div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter">
                {language === 'fr' ? 'Études & Analyses' : language === 'fa' ? 'مطالعات و تحلیل‌ها' : 'Studies & Analysis'}
              </h1>
              <p className="text-zinc-400 mt-1">
                {studies.length} {language === 'fr' ? 'publications' : language === 'fa' ? 'انتشارات' : 'publications'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-100 animate-pulse h-48" />
            ))}
          </div>
        ) : studies.length === 0 ? (
          <div className="text-center py-16 border border-zinc-200 bg-zinc-50">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" strokeWidth={1} />
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
              {language === 'fr' ? 'Aucune étude pour le moment' : language === 'fa' ? 'هنوز مطالعه‌ای وجود ندارد' : 'No studies yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {studies.map((study) => (
              <Link 
                key={study.id}
                to={`/article/${study.id}`}
                className="bg-white border border-zinc-200 p-8 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${
                    study.content_type === 'study' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {study.content_type === 'study' 
                      ? (language === 'fr' ? 'Étude' : language === 'fa' ? 'مطالعه' : 'Study')
                      : (language === 'fr' ? 'Analyse' : language === 'fa' ? 'تحلیل' : 'Analysis')
                    }
                  </span>
                  <span className="text-sm text-zinc-400 font-mono">
                    {new Date(study.published_at || study.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 className="font-heading font-bold text-xl sm:text-2xl mb-3 group-hover:text-[#1E3A5F] transition-colors">
                  {study[`title_${language}`] || study.title_en || study.title_fr}
                </h2>
                
                <p className="text-zinc-600 mb-4 line-clamp-3">
                  {study[`summary_${language}`] || study.summary_en || study.summary_fr}
                </p>
                
                {study.tags && study.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {study.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-[#3DB883] font-mono text-sm uppercase tracking-wider">
                  {t('readMore')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
