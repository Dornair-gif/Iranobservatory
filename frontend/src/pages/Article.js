import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ExternalLink, Calendar, Tag, Share2, FileDown, Mail, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import SEO from '../components/SEO';
import { API } from '../config/api';
import { normalizeFileUrl } from '../lib/imageUrl';
import { renderHtml } from '../lib/sanitize';

export default function Article() {
  const { id } = useParams();
  const { language, t, getArticleField } = useLanguage();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadEmail, setDownloadEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [downloadGranted, setDownloadGranted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/articles/${id}`);
        setArticle(response.data);
        // If we landed via legacy ObjectId but a slug exists, redirect to the
        // slug URL for SEO (canonicalisation, 301-equivalent in SPA).
        if (response.data?.slug && response.data.slug !== id && /^[a-f0-9]{24}$/i.test(id)) {
          navigate(`/article/${response.data.slug}`, { replace: true });
          return;
        }
        // Fetch related articles
        axios.get(`${API}/articles/${response.data.id}/related?limit=4`)
          .then(r => setRelated(r.data || []))
          .catch(() => setRelated([]));
      } catch (e) {
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate]);

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
  const isStudy = article.content_type === 'analysis' || article.content_type === 'study';
  const isHtml = content && content.includes('<') && (content.includes('</') || content.includes('/>'));

  // SEO: prefer AI-generated SEO meta if available, fall back to title/summary
  const seoField = (base) => article?.[`${base}_${language}`] || article?.[`${base}_en`] || article?.[`${base}_fr`] || '';
  const seoTitle = seoField('seo_title') || title;
  const seoDescription = seoField('meta_description') || summary;
  const seoKeywords = article?.focus_keywords || article?.tags || [];

  // Reading time (avg 200 wpm)
  const wordCount = (content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingMin = Math.max(1, Math.round(wordCount / 200));

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

  const breadcrumbs = [
    { name: language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home', path: '/' },
    {
      name: isStudy
        ? (language === 'fr' ? 'Études' : language === 'fa' ? 'مطالعات' : 'Studies')
        : (language === 'fr' ? 'Articles' : language === 'fa' ? 'مقالات' : 'Articles'),
      path: isStudy ? '/studies' : '/articles'
    },
    { name: title, path: `/article/${article.slug || article.id}` }
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="article-page">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        image={article.image_url}
        url={`/article/${article.slug || article.id}`}
        type="article"
        article={article}
        keywords={seoKeywords}
        breadcrumbs={breadcrumbs}
        language={language}
      />
      
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
      <article className={`${isStudy ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12`}>
        {/* Breadcrumbs */}
        <nav className="text-xs font-mono text-zinc-400 mb-4" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.path}>
              {i > 0 && <span className="mx-2">/</span>}
              {i < breadcrumbs.length - 1 ? (
                <Link to={b.path} className="hover:text-[#1E3A5F]">{b.name}</Link>
              ) : (
                <span className="text-zinc-500 truncate" style={{maxWidth:'40ch',display:'inline-block',verticalAlign:'middle'}}>{b.name}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link
            to={`/articles/category/${article.category || 'news'}`}
            className="px-3 py-1 bg-[#3DB883] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#2d9e6e] transition-colors"
            data-testid="article-category-link"
          >
            {article.category || 'News'}
          </Link>
          <span className="font-mono text-xs text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={1.5} />
            {formattedDate} • {timeAgo}
          </span>
          <span className="font-mono text-xs text-zinc-400">
            • {readingMin} {language === 'fr' ? 'min de lecture' : language === 'fa' ? 'دقیقه مطالعه' : 'min read'}
          </span>
        </div>

        {/* Title */}
        <h1 
          className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter leading-tight mb-6 text-[#1E3A5F]"
          data-testid="article-title"
        >
          {title}
        </h1>

        {/* Summary */}
        <p className="text-lg sm:text-xl text-zinc-600 mb-8 leading-relaxed">
          {summary}
        </p>

        {/* Featured Image */}
        {article.image_url && !coverFailed && (
          <div className="relative aspect-[16/9] mb-8 overflow-hidden border border-zinc-200 rounded-lg">
            <img
              src={normalizeFileUrl(article.image_url)}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setCoverFailed(true)}
              data-testid="article-image"
            />
          </div>
        )}

        {/* Content */}
        {isStudy && isHtml ? (
          /* Study/Analysis with HTML — render raw without prose constraints */
          <div 
            className="study-content w-full"
            data-testid="article-content"
            dangerouslySetInnerHTML={renderHtml(content)}
          />
        ) : (
          <div 
            className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-[#1E3A5F] prose-p:text-zinc-700 prose-p:leading-relaxed prose-a:text-[#1E3A5F] prose-a:underline prose-img:rounded-lg prose-table:border-collapse prose-td:border prose-td:border-zinc-200 prose-td:p-3 prose-th:border prose-th:border-zinc-200 prose-th:p-3 prose-th:bg-zinc-50"
            data-testid="article-content"
          >
            {isHtml ? (
              <div dangerouslySetInnerHTML={renderHtml(content)} />
            ) : (
              content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            )}
          </div>
        )}

        {/* Brief PDF Download — auto-generated */}
        {article.content_type === 'brief' && !article.pdf_url && (
          <div className="mt-10 p-6 sm:p-8 bg-amber-50 border border-amber-200 rounded-xl" data-testid="brief-pdf-download">
            <div className="flex items-start gap-4">
              <FileDown className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-[#1E3A5F] mb-1">
                  {language === 'fr' ? 'Télécharger le brief en PDF' : 'Download Brief as PDF'}
                </h3>
                <p className="text-sm text-zinc-500 mb-3">
                  {language === 'fr' ? 'Version PDF formatée pour impression et partage' : 'Formatted PDF version for print and sharing'}
                </p>
                <a
                  href={`${API}/articles/${id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white text-sm font-mono uppercase tracking-wider hover:bg-[#2a4d75] transition-colors rounded"
                  data-testid="brief-pdf-btn"
                >
                  <FileDown className="w-4 h-4" strokeWidth={1.5} />
                  {language === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PDF Download Section */}
        {article.pdf_url && (
          <div className="mt-10 p-6 sm:p-8 bg-[#f0f5fa] border border-[#1E3A5F]/10" data-testid="pdf-download-section">
            <div className="flex items-start gap-4">
              <FileDown className="w-8 h-8 text-[#1E3A5F] flex-shrink-0 mt-1" strokeWidth={1.5} />
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-[#1E3A5F] mb-1">
                  {language === 'fr' ? 'Télécharger le document PDF' : language === 'fa' ? 'دانلود فایل PDF' : 'Download PDF Document'}
                </h3>
                <p className="text-sm text-zinc-600 mb-4">
                  {language === 'fr' 
                    ? 'Entrez votre email pour accéder au document complet'
                    : language === 'fa' ? 'برای دسترسی به سند کامل، ایمیل خود را وارد کنید'
                    : 'Enter your email to access the full document'}
                </p>
                {downloadGranted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {language === 'fr' ? 'Accès accordé !' : 'Access granted!'}
                      </span>
                    </div>
                    <a
                      href={article.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2A4A73] transition-colors"
                      data-testid="pdf-download-link"
                    >
                      <FileDown className="w-4 h-4" strokeWidth={1.5} />
                      {language === 'fr' ? 'Télécharger le PDF' : language === 'fa' ? 'دانلود PDF' : 'Download PDF'}
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="email"
                          value={downloadEmail}
                          onChange={(e) => { setDownloadEmail(e.target.value); setEmailError(''); }}
                          placeholder={language === 'fr' ? 'votre@email.com' : 'your@email.com'}
                          className="rounded-none"
                          data-testid="pdf-email-input"
                        />
                        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                      </div>
                      <Button
                        className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none px-6"
                        onClick={async () => {
                          if (!downloadEmail || !downloadEmail.includes('@')) {
                            setEmailError(language === 'fr' ? 'Email invalide' : 'Invalid email');
                            return;
                          }
                          try {
                            await axios.post(`${API}/subscribers`, {
                              email: downloadEmail,
                              newsletter,
                              article_id: article.id
                            });
                            setDownloadGranted(true);
                          } catch (err) {
                            setEmailError(language === 'fr' ? 'Une erreur est survenue' : 'Something went wrong');
                          }
                        }}
                        data-testid="pdf-submit-email"
                      >
                        <Mail className="w-4 h-4 me-2" strokeWidth={1.5} />
                        {language === 'fr' ? 'Accéder' : 'Access'}
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newsletter}
                        onChange={(e) => setNewsletter(e.target.checked)}
                        className="rounded border-zinc-300"
                        data-testid="newsletter-checkbox"
                      />
                      <span className="text-xs text-zinc-500">
                        {language === 'fr' 
                          ? 'Recevoir nos derniers articles et analyses par email'
                          : language === 'fa' ? 'دریافت آخرین مقالات و تحلیل‌ها از طریق ایمیل'
                          : 'Receive our latest articles and analyses by email'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Tags */}
        {(article.tags || []).length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100" data-testid="article-tags">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
              {language === 'fr' ? 'Sujets' : language === 'fa' ? 'موضوعات' : 'Topics'}
            </p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => {
                const slug = String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (!slug) return null;
                return (
                  <Link
                    key={tag}
                    to={`/articles/tag/${slug}`}
                    className="px-3 py-1 bg-zinc-100 hover:bg-[#1E3A5F] hover:text-white text-xs font-mono text-zinc-700 transition-colors rounded-full"
                  >
                    #{tag}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-zinc-200" data-testid="related-articles">
            <h2 className="font-heading font-bold text-2xl text-[#1E3A5F] mb-6">
              {language === 'fr' ? 'À lire aussi' : language === 'fa' ? 'بیشتر بخوانید' : 'Continue reading'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(r => {
                const rTitle = r[`title_${language}`] || r.title_en || r.title_fr || '';
                const rSummary = (r[`summary_${language}`] || r.summary_en || r.summary_fr || '').slice(0, 110);
                const rImg = r.image_url ? normalizeFileUrl(r.image_url) : null;
                return (
                  <Link
                    key={r.id}
                    to={`/article/${r.slug || r.id}`}
                    className="group block bg-zinc-50 hover:bg-white border border-zinc-200 hover:shadow-md transition-all"
                  >
                    {rImg && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={rImg} alt={rTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => e.currentTarget.parentElement.style.display='none'} />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs font-mono text-zinc-400 uppercase mb-2">{r.category || 'news'}</p>
                      <p className="font-bold text-sm text-[#1E3A5F] leading-tight line-clamp-3 mb-2 group-hover:underline">{rTitle}</p>
                      <p className="text-xs text-zinc-500 line-clamp-2">{rSummary}...</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
