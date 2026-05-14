import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ExternalLink, BookOpen, FileText, Radio, Eye, Activity, Heart, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArticleCard, ArticleCardSkeleton } from '../components/ArticleCard';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { normalizeFileUrl } from '../lib/imageUrl';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/tkhn3g6l_Iran%20Observatory%20Logo%20transparent%20%281%29.png";

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [studies, setStudies] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const articlesRes = await axios.get(`${API}/articles?status=published&lang=${language}`);
        const allArticles = articlesRes.data;
        const newsArticles = allArticles.filter(a => !a.content_type || a.content_type === 'news');
        const studiesAndAnalyses = allArticles.filter(a => a.content_type === 'study' || a.content_type === 'analysis' || a.content_type === 'brief');
        setArticles(newsArticles);
        setStudies(studiesAndAnalyses);
      } catch (e) {
        console.error('Failed to fetch content:', e);
      }
      // Fetch dashboard briefing
      try {
        const dashRes = await axios.get(`${API}/dashboard/indexes`);
        if (dashRes.data?.situation_summary) {
          setBriefing(dashRes.data);
        }
      } catch (e) {}
      setLoading(false);
    };
    fetchContent();
  }, [language]);

  // Homepage: 1 featured + 3 side only
  const allArticles = [...articles];
  const featuredArticle = allArticles[0];
  const sideArticles = allArticles.slice(1, 4);

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
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/hero-tehran-milad-night.jpg')`
          }}
        />
        <div className="absolute inset-0 bg-[#1E3A5F]/70" />
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
            <p className="text-xl sm:text-2xl lg:text-3xl text-white font-heading font-bold mb-4 animate-fade-up-delay-2 tracking-tight leading-snug">
              {t('tagline')}
            </p>
            <p className="text-lg sm:text-xl text-[#3DB883] font-bold mb-8 animate-fade-up-delay-2">
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

      {/* Main Content — Articles + Briefing Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="latest">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left: Articles (2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-[#1E3A5F]">
                {t('latestNews')}
              </h2>
              <Link 
                to="/articles" 
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#1E3A5F] hover:text-[#3DB883] transition-colors"
                data-testid="view-all-articles-link"
              >
                {language === 'fr' ? 'Tous les articles' : 'All Articles'}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                <ArticleCardSkeleton featured />
                <ArticleCardSkeleton />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 border border-zinc-200 bg-zinc-50 rounded-xl">
                <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">
                  {t('noArticles')}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Featured Article */}
                {featuredArticle && (
                  <div className="animate-fade-up">
                    <ArticleCard article={featuredArticle} featured />
                  </div>
                )}
                
                {/* Side Articles */}
                {sideArticles.map((article, index) => (
                  <Link 
                    key={article.id} 
                    to={`/article/${article.id}`}
                    className={`group flex gap-4 items-start bg-white border border-zinc-100 rounded-lg p-4 hover:shadow-md hover:border-zinc-200 transition-all animate-fade-up`}
                    style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                    data-testid={`side-article-${article.id}`}
                  >
                    {article.image_url && (
                      <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={normalizeFileUrl(article.image_url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#3DB883] font-bold">{article.category || 'News'}</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-lg leading-snug mb-1.5 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
                        {article[`title_${language}`] || article.title_en || article.title_fr}
                      </h3>
                      <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                        {article[`summary_${language}`] || article.summary_en || article.summary_fr}
                      </p>
                    </div>
                  </Link>
                ))}

                <Link 
                  to="/articles" 
                  className="flex items-center justify-center gap-2 py-3 border border-[#1E3A5F] text-[#1E3A5F] font-mono text-xs uppercase tracking-wider hover:bg-[#1E3A5F] hover:text-white transition-colors rounded-lg"
                >
                  {language === 'fr' ? `Voir les ${articles.length} articles` : `View all ${articles.length} articles`}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>

          {/* Right: Situation Briefing Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Situation Briefing */}
            {briefing?.situation_summary && (
              <div className="bg-[#1E3A5F] text-white rounded-xl p-6 sticky top-4" data-testid="home-briefing">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-[#3DB883]" strokeWidth={1.5} />
                  <h3 className="font-heading font-black text-xl tracking-tight">
                    {language === 'fr' ? 'Situation' : 'Briefing'}
                  </h3>
                  <Activity className="w-3 h-3 text-[#3DB883] animate-pulse ml-auto" />
                </div>
                <ul className="space-y-3 mb-5">
                  {(Array.isArray(briefing.situation_summary) ? briefing.situation_summary : [briefing.situation_summary]).slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-200 leading-relaxed">
                      <span className="text-[#3DB883] mt-0.5 flex-shrink-0 font-bold">&#8226;</span>
                      <span className="line-clamp-3">{b}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/monitor" 
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#3DB883] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded"
                  data-testid="home-monitor-link"
                >
                  {language === 'fr' ? 'Iran Monitor' : 'Iran Monitor'}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            )}

            {/* Weekly Briefs Link */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-lg text-[#1E3A5F]">
                  {language === 'fr' ? 'Briefs Hebdo' : 'Weekly Briefs'}
                </h3>
              </div>
              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                {language === 'fr' 
                  ? 'Chaque lundi, un résumé analytique de la semaine sur l\'Iran.'
                  : 'Every Monday, an analytical summary of the week on Iran.'}
              </p>
              <Link 
                to="/studies" 
                className="flex items-center gap-2 text-amber-700 font-mono text-xs uppercase tracking-wider hover:text-amber-900 transition-colors"
              >
                {language === 'fr' ? 'Voir les briefs' : 'View Briefs'}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Live News Feed - Extended */}
      <section className="bg-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Radio className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
              <div>
                <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-white">
                  {language === 'fr' ? 'Fil d\'Actualités en Direct' : language === 'fa' ? 'اخبار زنده' : 'Live News Feed'}
                </h2>
                <p className="text-zinc-400 text-base mt-1">
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
                <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-[#1E3A5F]">
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

      {/* Support Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] via-[#2a4d75] to-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3DB883]/20 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-[#3DB883]" strokeWidth={1.5} />
            </div>
            <p className="text-base text-white/90 font-medium">
              {language === 'fr' 
                ? 'Si ces analyses vous sont utiles, soutenez l\'indépendance de l\'Iran Observatory.'
                : 'If this work is useful to you, consider supporting Iran Observatory\'s independence.'}
            </p>
          </div>
          <a href="https://www.helloasso.com/associations/dorna/formulaires/2" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3DB883] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded-full flex-shrink-0 shadow-lg shadow-[#3DB883]/20">
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
            {language === 'fr' ? 'Soutenir' : 'Support us'}
          </a>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-[#f8f9fb] border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#1E3A5F]" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading font-black text-2xl text-[#1E3A5F] tracking-tight mb-2">
              {language === 'fr' ? 'Restez informé' : 'Stay Informed'}
            </h3>
            <p className="text-sm text-zinc-500 mb-5">
              {language === 'fr' 
                ? 'Recevez notre brief hebdomadaire et les articles clés directement dans votre boîte mail.'
                : 'Get our weekly intelligence brief and featured articles delivered to your inbox.'}
            </p>
            {nlStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 py-3 text-[#3DB883] font-mono text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                {language === 'fr' ? 'Inscription confirmée !' : 'You\'re subscribed!'}
              </div>
            ) : (
              <form 
                className="max-w-md mx-auto space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!nlEmail || !nlEmail.includes('@')) return;
                  try {
                    await axios.post(`${API}/subscribers`, { email: nlEmail, newsletter: true, language });
                    setNlStatus('success');
                    setNlEmail('');
                  } catch (err) {
                    if (err.response?.status === 409) {
                      setNlStatus('success');
                    } else {
                      setNlStatus('error');
                    }
                  }
                }}
                data-testid="newsletter-signup"
              >
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    placeholder={language === 'fr' ? 'Votre email' : language === 'fa' ? 'ایمیل شما' : 'Your email address'}
                    className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                    required
                    data-testid="newsletter-email-input"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2a4d75] transition-colors rounded-lg flex-shrink-0"
                    data-testid="newsletter-submit-btn"
                  >
                    {language === 'fr' ? 'S\'inscrire' : language === 'fa' ? 'عضویت' : 'Subscribe'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 text-center">
                  {language === 'fr' ? 'Vous recevrez la newsletter en français.' : language === 'fa' ? 'شما خبرنامه را به فارسی دریافت خواهید کرد.' : 'You\'ll receive the newsletter in English.'}
                  {' '}
                  <span className="text-zinc-400">
                    {language === 'fr' ? '(Changez la langue en haut à droite)' : language === 'fa' ? '(زبان را از بالا سمت چپ تغییر دهید)' : '(Change language top-right)'}
                  </span>
                </p>
              </form>
            )}
            {nlStatus === 'error' && (
              <p className="text-red-500 text-xs mt-2">{language === 'fr' ? 'Erreur, veuillez réessayer.' : 'Error, please try again.'}</p>
            )}
            <p className="text-[10px] text-zinc-400 mt-3">
              {language === 'fr' ? 'Pas de spam. Désinscription à tout moment.' : 'No spam. Unsubscribe anytime.'}
            </p>
          </div>
        </div>
      </div>

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
