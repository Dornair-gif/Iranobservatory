import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { renderHtml } from '../lib/sanitize';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  FileText, Rss, Sparkles, BarChart3, Plus, Trash2, RefreshCw, 
  Eye, Edit, Send, Loader2, Check, X, ExternalLink, BookOpen, PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import { API } from '../config/api';

const CONTENT_TYPES = [
  { value: 'news', label: 'News', labelFr: 'Actualités' },
  { value: 'analysis', label: 'Analysis', labelFr: 'Analyse' },
  { value: 'study', label: 'Study', labelFr: 'Étude' },
  { value: 'brief', label: 'Weekly Brief', labelFr: 'Brief Hebdo' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'fa', label: 'فارسی' }
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [rssItems, setRssItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [editArticle, setEditArticle] = useState(null);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [seoScore, setSeoScore] = useState(null);
  const [seoScoreLoading, setSeoScoreLoading] = useState(false);
  const [angles, setAngles] = useState(null);
  const [anglesLoading, setAnglesLoading] = useState(false);
  const [anglesTopic, setAnglesTopic] = useState('Iran actualités 2026');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [editFeed, setEditFeed] = useState(null);
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'general', language: 'en', is_regime_source: false });
  const [selectedRssItem, setSelectedRssItem] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [previewLang, setPreviewLang] = useState(null);
  const [newsletterPreview, setNewsletterPreview] = useState(null);
  const [newsletterPreviewLang, setNewsletterPreviewLang] = useState('fr');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [founder, setFounder] = useState({
    enabled: false, photo_url: '', signature_url: '',
    name_fr: '', name_en: '', name_fa: '',
    title_fr: '', title_en: '', title_fa: '',
    intro_text_fr: '', intro_text_en: '', intro_text_fa: ''
  });
  const [founderTab, setFounderTab] = useState('fr');
  const [savingFounder, setSavingFounder] = useState(false);
  const [uploadingFounderPhoto, setUploadingFounderPhoto] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title_en: '', title_fr: '', title_fa: '',
    content_en: '', content_fr: '', content_fa: '',
    summary_en: '', summary_fr: '', summary_fa: '',
    image_url: '', source_url: '', pdf_url: '', tags: [], category: 'politics', content_type: 'news'
  });

  const axiosConfig = { withCredentials: true };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchArticles();
      fetchFeeds();
      fetchRssItems();
      fetchSubscribers();
      fetchFounder();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, axiosConfig);
      setStats(response.data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles/admin`, axiosConfig);
      setArticles(response.data);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    }
  };

  const fetchFeeds = async () => {
    try {
      const response = await axios.get(`${API}/rss/feeds`, axiosConfig);
      setFeeds(response.data);
    } catch (e) {
      console.error('Failed to fetch feeds:', e);
    }
  };

  const fetchRssItems = async () => {
    try {
      const response = await axios.get(`${API}/rss/items?processed=false&status=suggested`, axiosConfig);
      setRssItems(response.data);
    } catch (e) {
      console.error('Failed to fetch RSS items:', e);
    }
  };

  const handleRejectItem = async (itemId) => {
    try {
      await axios.post(`${API}/rss/items/${itemId}/reject`, {}, axiosConfig);
      toast.success('Item dismissed');
      setRssItems(prev => prev.filter(i => i.id !== itemId));
      if (selectedRssItem?.id === itemId) setSelectedRssItem(null);
    } catch (e) {
      toast.error('Failed to reject item');
    }
  };

  const handleEvaluateItems = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/rss/items/evaluate`, {}, axiosConfig);
      toast.success(response.data.message);
      fetchRssItems();
    } catch (e) {
      toast.error('Failed to evaluate items');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get(`${API}/subscribers`, axiosConfig);
      setSubscribers(response.data);
    } catch (e) {
      console.error('Failed to fetch subscribers:', e);
    }
  };

  const fetchFounder = async () => {
    try {
      const response = await axios.get(`${API}/settings/founder`, axiosConfig);
      const d = response.data || {};
      setFounder({
        enabled: !!d.enabled,
        photo_url: d.photo_url || '',
        signature_url: d.signature_url || '',
        name_fr: d.name_fr || '',
        name_en: d.name_en || '',
        name_fa: d.name_fa || '',
        title_fr: d.title_fr || '',
        title_en: d.title_en || '',
        title_fa: d.title_fa || '',
        intro_text_fr: d.intro_text_fr || '',
        intro_text_en: d.intro_text_en || '',
        intro_text_fa: d.intro_text_fa || ''
      });
    } catch (e) {
      console.error('Failed to fetch founder settings:', e);
    }
  };

  const saveFounder = async () => {
    setSavingFounder(true);
    try {
      await axios.put(`${API}/settings/founder`, founder, axiosConfig);
      toast.success('Founder introduction saved');
    } catch (e) {
      toast.error('Failed to save founder settings');
    } finally {
      setSavingFounder(false);
    }
  };

  const handleFounderPhotoUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      toast.error('Only image files allowed');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploadingFounderPhoto(true);
    try {
      const response = await axios.post(`${API}/upload/image`, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFounder(prev => ({ ...prev, [field]: response.data.image_url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingFounderPhoto(false);
    }
  };

  const handlePdfUpload = async (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files allowed');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API}/upload/pdf`, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const pdfUrl = response.data.pdf_url;
      if (target === 'new') {
        setNewArticle(prev => ({ ...prev, pdf_url: pdfUrl }));
      } else if (target === 'edit') {
        setEditArticle(prev => ({ ...prev, pdf_url: pdfUrl }));
      }
      toast.success(`PDF uploaded: ${file.name}`);
    } catch (err) {
      toast.error('Failed to upload PDF');
    }
  };

  const handleImageUpload = async (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      toast.error('Only image files allowed (jpg, png, webp, gif)');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API}/upload/image`, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = response.data.image_url;
      if (target === 'new') {
        setNewArticle(prev => ({ ...prev, image_url: imageUrl }));
      } else if (target === 'edit') {
        setEditArticle(prev => ({ ...prev, image_url: imageUrl }));
      }
      toast.success(`Image uploaded: ${file.name}`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  // Auto-extract first <img> src from HTML content
  const extractFirstImage = (html) => {
    if (!html) return null;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  };

  const handleDeleteSubscriber = async (subId) => {
    try {
      await axios.delete(`${API}/subscribers/${subId}`, axiosConfig);
      setSubscribers(prev => prev.filter(s => s.id !== subId));
      toast.success('Subscriber removed');
    } catch (e) {
      toast.error('Failed to delete subscriber');
    }
  };

  const handleFetchFeed = async (feedId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/rss/feeds/${feedId}/fetch`, {}, axiosConfig);
      toast.success(response.data.message);
      fetchRssItems();
      fetchFeeds();
    } catch (e) {
      toast.error('Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.url) return;
    try {
      await axios.post(`${API}/rss/feeds`, newFeed, axiosConfig);
      toast.success('Feed added successfully');
      setShowAddFeed(false);
      setNewFeed({ name: '', url: '', category: 'general', language: 'en', is_regime_source: false });
      fetchFeeds();
    } catch (e) {
      toast.error('Failed to add feed');
    }
  };

  const handleUpdateFeed = async () => {
    if (!editFeed || !editFeed.name || !editFeed.url) return;
    try {
      await axios.put(`${API}/rss/feeds/${editFeed.id}`, {
        name: editFeed.name,
        url: editFeed.url,
        category: editFeed.category,
        language: editFeed.language,
        is_regime_source: !!editFeed.is_regime_source,
      }, axiosConfig);
      toast.success('Feed updated successfully');
      setEditFeed(null);
      fetchFeeds();
    } catch (e) {
      toast.error('Failed to update feed');
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (!window.confirm('Delete this feed?')) return;
    try {
      await axios.delete(`${API}/rss/feeds/${feedId}`, axiosConfig);
      toast.success('Feed deleted');
      fetchFeeds();
    } catch (e) {
      toast.error('Failed to delete feed');
    }
  };

  const handleGenerateArticle = async () => {
    if (!selectedRssItem) return;
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/ai/generate`, {
        rss_item_id: selectedRssItem.id,
        target_languages: ['en', 'fr', 'fa']
      }, axiosConfig);
      toast.success('Article generated! Review and publish.');
      setSelectedRssItem(null);
      fetchArticles();
      fetchRssItems();
      fetchStats();
    } catch (e) {
      toast.error('Failed to generate article: ' + (e.response?.data?.detail || e.message));
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishArticle = async (articleId) => {
    try {
      await axios.post(`${API}/articles/${articleId}/publish`, {}, axiosConfig);
      toast.success('Article published!');
      fetchArticles();
      fetchStats();
    } catch (e) {
      toast.error('Failed to publish article');
    }
  };

  const handleUpdateArticle = async () => {
    if (!editArticle) return;
    try {
      await axios.put(`${API}/articles/${editArticle.id}`, editArticle, axiosConfig);
      toast.success('Article updated');
      setEditArticle(null);
      setSeoScore(null);
      fetchArticles();
    } catch (e) {
      toast.error('Failed to update article');
    }
  };

  const handleHumanize = async () => {
    if (!editArticle?.id) return;
    if (!window.confirm('Reformater le contenu de cet article en HTML propre (paragraphes, h2, etc.) ? Cela écrasera le contenu actuel dans les 3 langues.')) return;
    setHumanizing(true);
    try {
      const res = await axios.post(`${API}/articles/${editArticle.id}/humanize`, {}, axiosConfig);
      // Re-fetch the article so the editor shows the new HTML
      const fresh = await axios.get(`${API}/articles/${editArticle.id}`);
      setEditArticle(prev => ({ ...prev, ...fresh.data }));
      toast.success(`Article reformaté (${(res.data.languages_updated || []).join(', ')})`);
    } catch (e) {
      toast.error('Échec du reformatage : ' + (e.response?.data?.detail || e.message));
    } finally {
      setHumanizing(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (!editArticle?.id) return;
    setSeoGenerating(true);
    try {
      const res = await axios.post(`${API}/articles/${editArticle.id}/seo/generate`, {}, axiosConfig);
      // Merge AI output back into the edit form so admin can review/edit
      setEditArticle(prev => ({
        ...prev,
        seo_title_en: res.data.seo_title_en || '',
        seo_title_fr: res.data.seo_title_fr || '',
        seo_title_fa: res.data.seo_title_fa || '',
        meta_description_en: res.data.meta_description_en || '',
        meta_description_fr: res.data.meta_description_fr || '',
        meta_description_fa: res.data.meta_description_fa || '',
        focus_keywords: res.data.focus_keywords || []
      }));
      // Refresh score
      try {
        const sc = await axios.get(`${API}/articles/${editArticle.id}/seo/score`, axiosConfig);
        setSeoScore(sc.data);
      } catch {}
      toast.success('SEO meta generated');
    } catch (e) {
      toast.error('SEO generation failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSeoGenerating(false);
    }
  };

  const fetchSeoScore = async (articleId) => {
    if (!articleId) { setSeoScore(null); return; }
    setSeoScoreLoading(true);
    try {
      const res = await axios.get(`${API}/articles/${articleId}/seo/score`, axiosConfig);
      setSeoScore(res.data);
    } catch {
      setSeoScore(null);
    } finally {
      setSeoScoreLoading(false);
    }
  };

  const handleSuggestAngles = async () => {
    setAnglesLoading(true);
    try {
      const res = await axios.post(`${API}/seo/suggest-angles`, { topic: anglesTopic }, axiosConfig);
      setAngles(res.data.angles || []);
    } catch (e) {
      toast.error('Angle suggestion failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setAnglesLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await axios.delete(`${API}/articles/${articleId}`, axiosConfig);
      toast.success('Article deleted');
      fetchArticles();
      fetchStats();
    } catch (e) {
      toast.error('Failed to delete article');
    }
  };

  const handleCreateArticle = async () => {
    if (!newArticle.title_en && !newArticle.title_fr) {
      toast.error('Please add at least one title');
      return;
    }
    try {
      await axios.post(`${API}/articles`, newArticle, axiosConfig);
      toast.success('Article created as draft');
      setShowCreateArticle(false);
      setNewArticle({
        title_en: '', title_fr: '', title_fa: '',
        content_en: '', content_fr: '', content_fa: '',
        summary_en: '', summary_fr: '', summary_fa: '',
        image_url: '', source_url: '', tags: [], category: 'politics', content_type: 'news'
      });
      fetchArticles();
      fetchStats();
    } catch (e) {
      toast.error('Failed to create article');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-black text-2xl tracking-tighter">
              {t('dashboard')}
            </h1>
            <p className="text-sm text-zinc-500">Welcome, {user.name || user.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t('totalArticles')}
                </span>
              </div>
              <p className="font-heading font-black text-2xl">{stats.total_articles}</p>
            </div>
            <div className="bg-white border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t('published_status')}
                </span>
              </div>
              <p className="font-heading font-black text-2xl text-green-600">{stats.published}</p>
            </div>
            <div className="bg-white border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t('drafts')}
                </span>
              </div>
              <p className="font-heading font-black text-2xl text-amber-600">{stats.drafts}</p>
            </div>
            <div className="bg-white border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Rss className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {t('pendingItems')}
                </span>
              </div>
              <p className="font-heading font-black text-2xl text-blue-600">{stats.pending_rss_items}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-zinc-200 rounded-none p-1">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-dashboard"
            >
              <BarChart3 className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger 
              value="articles" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-articles"
            >
              <FileText className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('articles')}
            </TabsTrigger>
            <TabsTrigger 
              value="rss" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-rss"
            >
              <Rss className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('rssFeeds')}
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-generate"
            >
              <Sparkles className="w-4 h-4 me-2" strokeWidth={1.5} />
              {t('aiGenerate')}
            </TabsTrigger>
            <TabsTrigger 
              value="subscribers" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-subscribers"
            >
              <FileText className="w-4 h-4 me-2" strokeWidth={1.5} />
              Subscribers
            </TabsTrigger>
            <TabsTrigger 
              value="newsletter" 
              className="rounded-none data-[state=active]:bg-zinc-900 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
              data-testid="tab-newsletter"
            >
              <FileText className="w-4 h-4 me-2" strokeWidth={1.5} />
              Newsletter
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Drafts */}
              <div className="bg-white border border-zinc-200">
                <div className="border-b border-zinc-200 p-4">
                  <h3 className="font-heading font-bold">{t('drafts')}</h3>
                </div>
                <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                  {articles.filter(a => a.status === 'draft').slice(0, 5).map(article => (
                    <div key={article.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{article.title_en || 'Untitled'}</p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          onClick={() => { setEditArticle(article); fetchSeoScore(article.id); }}
                        >
                          <Edit className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-none bg-green-600 hover:bg-green-700"
                          onClick={() => handlePublishArticle(article.id)}
                        >
                          <Send className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteArticle(article.id)}
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {articles.filter(a => a.status === 'draft').length === 0 && (
                    <p className="p-4 text-zinc-500 text-sm">No drafts</p>
                  )}
                </div>
              </div>

              {/* Pending RSS Items */}
              <div className="bg-white border border-zinc-200">
                <div className="border-b border-zinc-200 p-4">
                  <h3 className="font-heading font-bold">{t('pendingItems')}</h3>
                </div>
                <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                  {rssItems.slice(0, 5).map(item => (
                    <div key={item.id} className="p-4">
                      <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-1">{item.feed_name}</p>
                    </div>
                  ))}
                  {rssItems.length === 0 && (
                    <p className="p-4 text-zinc-500 text-sm">No pending items</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tools: Repair broken image URLs */}
            <div className="bg-white border border-zinc-200 p-4 mt-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-heading font-bold text-sm">Image URL Repair</h3>
                  <p className="text-xs text-zinc-500 mt-1">Rewrites legacy article image_urls that point to the wrong environment (e.g., preview URL stored on production), and reports any files actually missing from storage.</p>
                </div>
                <Button
                  className="rounded-none bg-[#1E3A5F] text-xs"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${API}/admin/repair-image-urls`, {}, axiosConfig);
                      const { rewritten_count, still_broken_count, still_broken } = res.data;
                      const titles = (still_broken || []).slice(0, 5).map(s => `- ${s.title} (${s.content_type})`).join('\n');
                      const more = still_broken_count > 5 ? `\n...and ${still_broken_count - 5} more` : '';
                      toast.success(`Rewrote ${rewritten_count} URL(s). ${still_broken_count} article(s) still need re-upload.`);
                      if (still_broken_count > 0) {
                        alert(`Articles whose cover image file is missing — re-upload required:\n\n${titles}${more}`);
                      }
                      fetchArticles();
                    } catch (e) {
                      toast.error('Failed: ' + (e.response?.data?.detail || e.message));
                    }
                  }}
                  data-testid="repair-image-urls-btn"
                >
                  Run Image URL Repair
                </Button>
              </div>
            </div>

            {/* SEO tools */}
            <div className="bg-white border border-zinc-200 p-4 mt-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h3 className="font-heading font-bold text-sm">SEO Tools</h3>
                  <p className="text-xs text-zinc-500 mt-1">Backfill slugs on legacy articles + AI angle suggester to ideate high-potential SEO topics.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none text-xs"
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${API}/admin/backfill-slugs`, {}, axiosConfig);
                      toast.success(`Slugs generated for ${res.data.updated_count} article(s)`);
                      fetchArticles();
                    } catch (e) {
                      toast.error('Failed: ' + (e.response?.data?.detail || e.message));
                    }
                  }}
                  data-testid="backfill-slugs-btn"
                >
                  Backfill Slugs
                </Button>
              </div>

              <div className="mt-3 border-t border-zinc-100 pt-3">
                <Label className="font-mono text-xs uppercase tracking-wider text-zinc-500">Suggest SEO angles (10 article ideas)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={anglesTopic}
                    onChange={(e) => setAnglesTopic(e.target.value)}
                    className="rounded-none flex-1 text-sm"
                    placeholder="ex: sanctions Iran 2026, droits humains, JCPOA..."
                    data-testid="seo-angles-topic"
                  />
                  <Button
                    size="sm"
                    className="rounded-none bg-[#3DB883] hover:bg-[#2d9e6e]"
                    disabled={anglesLoading}
                    onClick={handleSuggestAngles}
                    data-testid="suggest-angles-btn"
                  >
                    {anglesLoading ? 'Génération...' : '✨ Suggérer'}
                  </Button>
                </div>
                {angles && angles.length > 0 && (
                  <div className="mt-4 space-y-2" data-testid="angles-results">
                    {angles.map((a, i) => (
                      <div key={i} className="bg-zinc-50 border border-zinc-200 p-3 text-xs">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-bold text-[#1E3A5F]">{i + 1}. {a.title_fr || a.title_en}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${a.estimated_difficulty === 'low' ? 'bg-green-100 text-green-700' : a.estimated_difficulty === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {a.estimated_difficulty || '-'}
                            </span>
                          </div>
                        </div>
                        {a.title_en && a.title_fr && a.title_en !== a.title_fr && (
                          <p className="text-zinc-500 italic mb-1">EN: {a.title_en}</p>
                        )}
                        <p className="text-zinc-600 mb-1">🎯 {a.primary_keyword}</p>
                        <p className="text-zinc-500 text-[11px]">{a.why_it_matters}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none uppercase tracking-widest text-xs font-bold"
                onClick={() => setShowCreateArticle(true)}
                data-testid="create-article-btn"
              >
                <Plus className="w-4 h-4 me-2" strokeWidth={1.5} />
                New Article
              </Button>
            </div>

            <div className="bg-white border border-zinc-200">
              <div className="border-b border-zinc-200 p-4 flex items-center justify-between">
                <h3 className="font-heading font-bold">{t('articles')}</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {articles.map(article => (
                  <div key={article.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{article.title_en || article.title_fr || 'Untitled'}</p>
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {article.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${
                          article.content_type === 'news' ? 'bg-blue-100 text-blue-700' :
                          article.content_type === 'analysis' ? 'bg-purple-100 text-purple-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {article.content_type || 'news'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-1">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => { setEditArticle(article); fetchSeoScore(article.id); }}
                        data-testid={`edit-article-${article.id}`}
                      >
                        <Edit className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                      {article.status === 'draft' && (
                        <Button
                          size="sm"
                          className="rounded-none bg-green-600 hover:bg-green-700"
                          onClick={() => handlePublishArticle(article.id)}
                          data-testid={`publish-article-${article.id}`}
                        >
                          <Send className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteArticle(article.id)}
                        data-testid={`delete-article-${article.id}`}
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
                {articles.length === 0 && (
                  <p className="p-8 text-center text-zinc-500">{t('noArticles')}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* RSS Feeds Tab */}
          <TabsContent value="rss" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none uppercase tracking-widest text-xs font-bold"
                onClick={() => setShowAddFeed(true)}
                data-testid="add-feed-btn"
              >
                <Plus className="w-4 h-4 me-2" strokeWidth={1.5} />
                {t('addFeed')}
              </Button>
            </div>

            <div className="bg-white border border-zinc-200">
              <div className="divide-y divide-zinc-100">
                {feeds.map(feed => (
                  <div key={feed.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{feed.name}</p>
                        <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-zinc-100 text-zinc-600">
                          {feed.language || 'en'}
                        </span>
                        {feed.is_regime_source && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300"
                            title="Source du régime iranien — attribution automatique"
                            data-testid={`regime-badge-${feed.id}`}
                          >
                            Régime
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono truncate">{feed.url}</p>
                      {feed.last_fetched && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Last fetched: {new Date(feed.last_fetched).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => setEditFeed(feed)}
                        data-testid={`edit-feed-${feed.id}`}
                      >
                        <Edit className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => handleFetchFeed(feed.id)}
                        disabled={loading}
                        data-testid={`fetch-feed-${feed.id}`}
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteFeed(feed.id)}
                        data-testid={`delete-feed-${feed.id}`}
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
                {feeds.length === 0 && (
                  <p className="p-8 text-center text-zinc-500">No RSS feeds configured</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="rounded-none uppercase tracking-widest text-xs font-bold"
                onClick={handleEvaluateItems}
                disabled={loading}
                data-testid="evaluate-items-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Sparkles className="w-4 h-4 me-2" strokeWidth={1.5} />}
                Re-evaluate Items
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RSS Items List */}
              <div className="bg-white border border-zinc-200">
                <div className="border-b border-zinc-200 p-4">
                  <h3 className="font-heading font-bold">AI Suggestions</h3>
                  <p className="text-xs text-zinc-500 mt-1">Items selected by AI for their analytical potential</p>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                  {rssItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedRssItem?.id === item.id 
                          ? 'bg-[#e8f5f0] border-l-4 border-[#3DB883]' 
                          : 'hover:bg-zinc-50'
                      }`}
                      onClick={() => setSelectedRssItem(item)}
                      data-testid={`rss-item-${item.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm flex-1">{item.title}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-none text-zinc-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); handleRejectItem(item.id); }}
                          data-testid={`reject-item-${item.id}`}
                          title="Dismiss this suggestion"
                        >
                          <X className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                      {item.ai_reason && (
                        <p className="text-xs text-[#3DB883] mt-1 italic">{item.ai_reason}</p>
                      )}
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{item.summary}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-zinc-400">{item.feed_name}</span>
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {rssItems.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                      <p>No suggested items yet.</p>
                      <p className="text-xs mt-2">Click "Re-evaluate Items" to run AI analysis on pending feeds.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Panel */}
              <div className="bg-white border border-zinc-200">
                <div className="border-b border-zinc-200 p-4">
                  <h3 className="font-heading font-bold">{t('generateArticle')}</h3>
                </div>
                <div className="p-4">
                  {selectedRssItem ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="font-mono text-xs uppercase tracking-wider">Selected Item</Label>
                        <p className="font-medium mt-1">{selectedRssItem.title}</p>
                        <p className="text-sm text-zinc-500 mt-1">{selectedRssItem.summary}</p>
                      </div>

                      <div>
                        <Label className="font-mono text-xs uppercase tracking-wider">Target Languages</Label>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-zinc-100 text-xs font-mono">EN</span>
                          <span className="px-2 py-1 bg-zinc-100 text-xs font-mono">FR</span>
                          <span className="px-2 py-1 bg-zinc-100 text-xs font-mono">FA</span>
                        </div>
                      </div>

                      <Button
                        className="w-full btn-primary rounded-none flex items-center justify-center gap-2"
                        onClick={handleGenerateArticle}
                        disabled={generating}
                        data-testid="generate-article-btn"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                            {t('generateArticle')}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-zinc-500 text-center">
                        AI will generate article content in all 3 languages. You can review and edit before publishing.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" strokeWidth={1} />
                      <p>{t('selectItem')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <div className="bg-white border border-zinc-200">
              <div className="border-b border-zinc-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold">Email Subscribers</h3>
                  <p className="text-xs text-zinc-500 mt-1">Users who subscribed to the newsletter or downloaded PDFs</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                  <span>{subscribers.length} total</span>
                  <span className="text-blue-700">FR {subscribers.filter(s => (s.language || 'fr') === 'fr').length}</span>
                  <span className="text-green-700">EN {subscribers.filter(s => s.language === 'en').length}</span>
                  <span className="text-purple-700">FA {subscribers.filter(s => s.language === 'fa').length}</span>
                </div>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
                {subscribers.map(sub => (
                  <div key={sub.id} className="p-4 flex items-center justify-between" data-testid={`subscriber-${sub.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{sub.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {sub.newsletter && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-mono uppercase">Newsletter</span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400">{sub.downloads_count} downloads</span>
                        <span className="text-[10px] font-mono text-zinc-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sub.language || 'fr'}
                        onChange={async (e) => {
                          const newLang = e.target.value;
                          try {
                            await axios.patch(`${API}/subscribers/${sub.id}`, { language: newLang }, axiosConfig);
                            setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, language: newLang } : s));
                            toast.success(`Language set to ${newLang.toUpperCase()}`);
                          } catch {
                            toast.error('Failed to update language');
                          }
                        }}
                        className="text-xs font-mono border border-zinc-200 rounded px-2 py-1 bg-white"
                        data-testid={`subscriber-lang-${sub.id}`}
                      >
                        <option value="fr">FR</option>
                        <option value="en">EN</option>
                        <option value="fa">FA</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-400 hover:text-red-500"
                        onClick={() => handleDeleteSubscriber(sub.id)}
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
                {subscribers.length === 0 && (
                  <p className="p-8 text-center text-zinc-500 text-sm">No subscribers yet. Emails will appear here when users subscribe or download PDFs.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Newsletter Tab */}
          <TabsContent value="newsletter" className="space-y-4">
            {/* Add Subscribers */}
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="font-heading font-bold text-lg mb-2">Add Subscribers</h3>
              <p className="text-sm text-zinc-500 mb-4">Paste multiple emails (one per line, or comma/semicolon separated). All emails added in one batch get the same language.</p>
              <form className="space-y-3" onSubmit={async (e) => {
                e.preventDefault();
                const raw = e.target.emails.value.trim();
                const lang = e.target.bulk_lang.value;
                if (!raw) return;
                const emails = raw.split(/[\n,;]+/).map(s => s.trim().toLowerCase()).filter(s => s && s.includes('@'));
                if (!emails.length) { toast.error('No valid emails found'); return; }
                let added = 0, skipped = 0;
                for (const email of emails) {
                  try {
                    await axios.post(`${API}/subscribers/add`, { email, newsletter: true, language: lang }, axiosConfig);
                    added++;
                  } catch { skipped++; }
                }
                toast.success(`Added ${added} ${lang.toUpperCase()} subscriber${added !== 1 ? 's' : ''}${skipped ? `, ${skipped} skipped` : ''}`);
                e.target.reset();
                fetchSubscribers();
              }}>
                <Textarea name="emails" placeholder={"email1@example.com\nemail2@example.com\nemail3@example.com"} className="rounded-none font-mono text-sm" rows={4} />
                <div className="flex items-center gap-3">
                  <Label className="text-xs font-mono uppercase text-zinc-500">Language:</Label>
                  <select name="bulk_lang" defaultValue="fr" className="text-sm font-mono border border-zinc-200 rounded px-3 py-2 bg-white" data-testid="bulk-add-lang">
                    <option value="fr">Français (FR)</option>
                    <option value="en">English (EN)</option>
                    <option value="fa">فارسی (FA)</option>
                  </select>
                  <Button type="submit" className="rounded-none bg-[#1E3A5F] flex-1">Add All</Button>
                </div>
              </form>
            </div>

            {/* Founder Introduction (multi-language) */}
            <div className="bg-white border border-zinc-200 p-6" data-testid="founder-intro-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-lg">Founder Introduction</h3>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={founder.enabled}
                    onChange={(e) => setFounder(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded-none"
                    data-testid="founder-enabled-checkbox"
                  />
                  <span>Include in auto newsletter</span>
                </label>
              </div>
              <p className="text-sm text-zinc-500 mb-4">Write your personal note in each language. Photo & signature are shared across all languages.</p>
              
              {/* Language tabs */}
              <div className="flex gap-1 mb-4 border-b border-zinc-200">
                {['fr', 'en', 'fa'].map(lng => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setFounderTab(lng)}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${founderTab === lng ? 'border-[#1E3A5F] text-[#1E3A5F] font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                    data-testid={`founder-tab-${lng}`}
                  >
                    {lng === 'fr' ? 'Français' : lng === 'en' ? 'English' : 'فارسی'}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-zinc-500 uppercase tracking-wider">Name ({founderTab.toUpperCase()})</Label>
                      <Input
                        placeholder={founderTab === 'fa' ? 'مثلاً سارا دو' : 'e.g. Jane Doe'}
                        className="rounded-none mt-1"
                        dir={founderTab === 'fa' ? 'rtl' : 'ltr'}
                        value={founder[`name_${founderTab}`] || ''}
                        onChange={(e) => setFounder(prev => ({ ...prev, [`name_${founderTab}`]: e.target.value }))}
                        data-testid={`founder-name-${founderTab}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500 uppercase tracking-wider">Title ({founderTab.toUpperCase()})</Label>
                      <Input
                        placeholder={founderTab === 'fr' ? 'ex. Directrice' : founderTab === 'fa' ? 'مثلاً مدیر' : 'e.g. Director'}
                        className="rounded-none mt-1"
                        dir={founderTab === 'fa' ? 'rtl' : 'ltr'}
                        value={founder[`title_${founderTab}`] || ''}
                        onChange={(e) => setFounder(prev => ({ ...prev, [`title_${founderTab}`]: e.target.value }))}
                        data-testid={`founder-title-${founderTab}`}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider">Introduction Text ({founderTab.toUpperCase()})</Label>
                    <Textarea
                      placeholder={founderTab === 'fr' ? 'Chers lecteurs,\n\nCette semaine...' : founderTab === 'fa' ? 'خوانندگان عزیز،\n\nاین هفته...' : 'Dear readers,\n\nThis week...'}
                      className="rounded-none mt-1 font-mono text-sm"
                      dir={founderTab === 'fa' ? 'rtl' : 'ltr'}
                      rows={5}
                      value={founder[`intro_text_${founderTab}`] || ''}
                      onChange={(e) => setFounder(prev => ({ ...prev, [`intro_text_${founderTab}`]: e.target.value }))}
                      data-testid={`founder-intro-text-${founderTab}`}
                    />
                  </div>
                  
                  {/* Shared images */}
                  <div className="pt-3 border-t border-zinc-100">
                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Shared across all languages</p>
                    <div className="mb-3">
                      <Label className="text-xs text-zinc-500 uppercase tracking-wider">Photo</Label>
                      <div className="flex items-center gap-3 mt-1">
                        {founder.photo_url && (
                          <img src={founder.photo_url} alt="founder" className="w-14 h-14 rounded-full object-cover border border-zinc-200" data-testid="founder-photo-preview" />
                        )}
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFounderPhotoUpload(e, 'photo_url')}
                            data-testid="founder-photo-upload"
                          />
                          <div className="border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 text-center">
                            {uploadingFounderPhoto ? 'Uploading...' : (founder.photo_url ? 'Replace photo' : 'Upload photo')}
                          </div>
                        </label>
                        {founder.photo_url && (
                          <button type="button" onClick={() => setFounder(prev => ({ ...prev, photo_url: '' }))} className="text-xs text-red-600 hover:underline" data-testid="founder-photo-remove">Remove</button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500 uppercase tracking-wider">Signature image (optional)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        {founder.signature_url && (
                          <img src={founder.signature_url} alt="signature" className="h-10 object-contain border border-zinc-200 bg-white px-2" data-testid="founder-signature-preview" />
                        )}
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFounderPhotoUpload(e, 'signature_url')}
                            data-testid="founder-signature-upload"
                          />
                          <div className="border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 text-center">
                            {founder.signature_url ? 'Replace signature' : 'Upload signature'}
                          </div>
                        </label>
                        {founder.signature_url && (
                          <button type="button" onClick={() => setFounder(prev => ({ ...prev, signature_url: '' }))} className="text-xs text-red-600 hover:underline" data-testid="founder-signature-remove">Remove</button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">If no signature image, the localized name will appear in italic below the message.</p>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full rounded-none bg-[#1E3A5F]"
                    onClick={saveFounder}
                    disabled={savingFounder}
                    data-testid="save-founder-btn"
                  >
                    {savingFounder ? 'Saving...' : 'Save Founder Introduction (all languages)'}
                  </Button>
                </div>
                
                {/* Preview for current language */}
                <div className="border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">Preview · {founderTab.toUpperCase()}</p>
                  {(founder[`intro_text_${founderTab}`] || founder.photo_url || founder[`name_${founderTab}`]) ? (
                    <div className="bg-white p-4 border border-zinc-200" dir={founderTab === 'fa' ? 'rtl' : 'ltr'} style={{ textAlign: founderTab === 'fa' ? 'right' : 'left' }}>
                      <div className="flex items-start gap-3" style={{ flexDirection: founderTab === 'fa' ? 'row-reverse' : 'row' }}>
                        {founder.photo_url && (
                          <img src={founder.photo_url} alt={founder[`name_${founderTab}`]} className="w-16 h-16 rounded-full object-cover border-2 border-[#3DB883] flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#3DB883] font-bold">
                            {founderTab === 'fr' ? 'Le mot du fondateur' : founderTab === 'fa' ? 'یادداشت بنیان‌گذار' : 'A note from the founder'}
                          </p>
                          {founder[`name_${founderTab}`] && <p className="text-sm font-bold text-[#1E3A5F] mt-1">{founder[`name_${founderTab}`]}</p>}
                          {founder[`title_${founderTab}`] && <p className="text-xs text-zinc-500">{founder[`title_${founderTab}`]}</p>}
                        </div>
                      </div>
                      {founder[`intro_text_${founderTab}`] && (
                        <div className="mt-3 text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{founder[`intro_text_${founderTab}`]}</div>
                      )}
                      {founder.signature_url ? (
                        <img src={founder.signature_url} alt="signature" className="h-10 mt-2 object-contain" />
                      ) : (
                        founder[`name_${founderTab}`] && <p className="text-sm italic text-[#1E3A5F] mt-2" style={{ fontFamily: 'Georgia, serif' }}>— {founder[`name_${founderTab}`]}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-sm text-center py-10">Fill in the fields to see preview</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-3">
                    {founder.enabled ? '✓ Will appear in auto newsletter' : 'Not currently included — toggle "Include" to enable'}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-Generated Newsletter (multi-language) */}
            <div className="bg-white border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-lg">Auto Newsletter</h3>
                <div className="flex gap-1">
                  {['fr', 'en', 'fa'].map(lng => (
                    <button
                      key={lng}
                      type="button"
                      onClick={async () => {
                        setNewsletterPreviewLang(lng);
                        try {
                          const res = await axios.post(`${API}/newsletter/generate?lang=${lng}`, {}, axiosConfig);
                          setNewsletterPreview(res.data);
                        } catch {
                          toast.error('Failed to generate newsletter');
                        }
                      }}
                      className={`px-3 py-1 text-xs font-mono uppercase border ${newsletterPreviewLang === lng && newsletterPreview ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                      data-testid={`preview-lang-${lng}`}
                    >
                      {lng === 'fa' ? 'فارسی' : lng.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-4">Auto-generated from the latest weekly brief + featured articles + new studies. Pick a language to preview it. The "Send" button delivers all 3 versions, each to its language audience.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Button 
                    className="w-full rounded-none bg-[#1E3A5F]"
                    onClick={async () => {
                      try {
                        const res = await axios.post(`${API}/newsletter/generate?lang=${newsletterPreviewLang}`, {}, axiosConfig);
                        setNewsletterPreview(res.data);
                        toast.success(`Preview generated (${newsletterPreviewLang.toUpperCase()})`);
                      } catch (e) {
                        toast.error('Failed to generate newsletter');
                      }
                    }}
                    data-testid="generate-newsletter-btn"
                  >
                    Generate Preview ({newsletterPreviewLang.toUpperCase()})
                  </Button>
                  <Button 
                    className="w-full rounded-none bg-[#3DB883] hover:bg-[#2D9E6E] disabled:opacity-60"
                    disabled={generatingBrief}
                    onClick={async () => {
                      if (generatingBrief) return;
                      if (!window.confirm("Générer un nouveau Weekly Brief ? Cette opération prend ~60s. Ne cliquez pas plusieurs fois.")) return;
                      setGeneratingBrief(true);
                      try {
                        const res = await axios.post(
                          `${API}/briefs/generate`,
                          {},
                          { ...axiosConfig, timeout: 180000 } // 3 min — LLM call is slow
                        );
                        if (res.data.status === "already_exists") {
                          toast.info(`Brief de cette semaine déjà généré (ID ${res.data.article_id.slice(0,8)}). Retrouvez-le dans l'onglet Articles.`, { duration: 6000 });
                        } else {
                          toast.success(`Weekly brief généré (ID: ${res.data.article_id})`);
                        }
                        fetchArticles();
                      } catch (e) {
                        toast.error('Failed: ' + (e.response?.data?.detail || e.message));
                      } finally {
                        setGeneratingBrief(false);
                      }
                    }}
                    data-testid="generate-brief-btn"
                  >
                    {generatingBrief ? '⏳ Generating brief (≈60s)…' : 'Generate Weekly Brief Now'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-none text-xs text-zinc-600 hover:text-red-600 border-zinc-300"
                    onClick={async () => {
                      if (!window.confirm("Supprimer les briefs en double (même titre) ? On garde le plus récent par titre.")) return;
                      try {
                        const res = await axios.post(`${API}/briefs/cleanup-duplicates`, {}, axiosConfig);
                        toast.success(`Cleanup: ${res.data.deleted} supprimés, ${res.data.kept} conservés.`);
                        fetchArticles();
                      } catch (e) {
                        toast.error('Cleanup failed: ' + (e.response?.data?.detail || e.message));
                      }
                    }}
                    data-testid="cleanup-briefs-btn"
                  >
                    🧹 Nettoyer les briefs en double
                  </Button>
                  {(() => {
                    const fr = subscribers.filter(s => s.newsletter && (s.language || 'fr') === 'fr').length;
                    const en = subscribers.filter(s => s.newsletter && s.language === 'en').length;
                    const fa = subscribers.filter(s => s.newsletter && s.language === 'fa').length;
                    const total = fr + en + fa;
                    return (
                      <>
                        <div className="bg-zinc-50 border border-zinc-200 p-3 text-xs font-mono text-zinc-600">
                          <p className="font-bold mb-1">Audience by language</p>
                          <div className="flex gap-4">
                            <span>🇫🇷 FR: <strong>{fr}</strong></span>
                            <span>🇬🇧 EN: <strong>{en}</strong></span>
                            <span>🇮🇷 FA: <strong>{fa}</strong></span>
                          </div>
                        </div>
                        <Button 
                          className="w-full rounded-none bg-red-600 hover:bg-red-700 text-white"
                          disabled={sendingNewsletter || total === 0}
                          onClick={async () => {
                            if (!window.confirm(`Send the auto newsletter in all 3 languages?\n\nFR: ${fr} subscribers\nEN: ${en} subscribers\nFA: ${fa} subscribers\n\nTotal: ${total}`)) return;
                            setSendingNewsletter(true);
                            try {
                              const res = await axios.post(`${API}/newsletter/send-multilingual`, {}, axiosConfig);
                              const by = res.data.by_language || {};
                              toast.success(`Sent ${res.data.total_sent} emails — FR:${by.fr?.sent || 0}, EN:${by.en?.sent || 0}, FA:${by.fa?.sent || 0}`);
                            } catch (e) {
                              toast.error('Failed: ' + (e.response?.data?.detail || e.message));
                            } finally {
                              setSendingNewsletter(false);
                            }
                          }}
                          data-testid="send-newsletter-multilingual-btn"
                        >
                          {sendingNewsletter ? 'Sending...' : `Send Newsletter (All Languages, ${total} subscribers)`}
                        </Button>
                      </>
                    );
                  })()}
                </div>
                <div className="border border-zinc-200 rounded overflow-hidden">
                  <div className="bg-zinc-100 p-2 border-b border-zinc-200 flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500">PREVIEW · {newsletterPreviewLang.toUpperCase()}</span>
                    {newsletterPreview?.subject && (
                      <span className="text-xs text-zinc-600 italic truncate max-w-[60%]">{newsletterPreview.subject}</span>
                    )}
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto">
                    {newsletterPreview ? (
                      <div dangerouslySetInnerHTML={renderHtml(newsletterPreview.html_content)} />
                    ) : (
                      <p className="text-zinc-400 text-sm text-center py-10">Click "Generate Preview" or pick a language tab</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Newsletter */}
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="font-heading font-bold text-lg mb-2">Custom Message</h3>
              <p className="text-sm text-zinc-500 mb-4">Write and send your own newsletter (e.g. launch announcement). Supports HTML.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Input 
                    placeholder="Subject line" 
                    className="rounded-none"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    data-testid="custom-subject"
                  />
                  <Textarea
                    placeholder="Write your message here... HTML is supported (e.g. <h2>Title</h2><p>Content</p>)"
                    className="rounded-none font-mono text-sm"
                    rows={8}
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    data-testid="custom-content"
                  />
                  <Button 
                    className="w-full rounded-none bg-red-600 hover:bg-red-700 text-white"
                    disabled={!customSubject || !customContent}
                    onClick={async () => {
                      if (!window.confirm(`Send custom newsletter "${customSubject}" to ${subscribers.filter(s => s.newsletter).length} subscribers?`)) return;
                      try {
                        const res = await axios.post(`${API}/newsletter/custom`, {
                          subject: customSubject,
                          content: customContent
                        }, axiosConfig);
                        toast.success(`Sent to ${res.data.sent}/${res.data.total} subscribers`);
                      } catch (e) {
                        toast.error('Failed: ' + (e.response?.data?.detail || e.message));
                      }
                    }}
                    data-testid="send-custom-btn"
                  >
                    Send Custom Newsletter ({subscribers.filter(s => s.newsletter).length} subscribers)
                  </Button>
                </div>
                <div className="border border-zinc-200 rounded overflow-hidden">
                  <div className="bg-zinc-100 p-2 border-b border-zinc-200"><span className="text-xs font-mono text-zinc-500">PREVIEW</span></div>
                  <div className="p-4 max-h-[400px] overflow-y-auto prose prose-sm max-w-none">
                    {customContent ? (
                      <div dangerouslySetInnerHTML={renderHtml(customContent)} />
                    ) : (
                      <p className="text-zinc-400 text-sm text-center py-10">Your message preview will appear here</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Feed Dialog */}
      <Dialog open={showAddFeed} onOpenChange={setShowAddFeed}>
        <DialogContent className="rounded-none border-zinc-200">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">{t('addFeed')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Name</Label>
              <Input
                value={newFeed.name}
                onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                placeholder="Feed name"
                className="rounded-none"
                data-testid="feed-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">URL</Label>
              <Input
                value={newFeed.url}
                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                placeholder="https://rss.app/feeds/xxx.xml"
                className="rounded-none"
                data-testid="feed-url-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Language</Label>
                <Select value={newFeed.language} onValueChange={(v) => setNewFeed({ ...newFeed, language: v })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Category</Label>
                <Select value={newFeed.category} onValueChange={(v) => setNewFeed({ ...newFeed, category: v })}>
                  <SelectTrigger className="rounded-none" data-testid="feed-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="regime">Régime (État iranien)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-start gap-3 p-3 border border-amber-300 bg-amber-50 rounded-none cursor-pointer">
              <input
                type="checkbox"
                checked={!!newFeed.is_regime_source}
                onChange={(e) => setNewFeed({ ...newFeed, is_regime_source: e.target.checked })}
                className="mt-1"
                data-testid="feed-regime-source-toggle"
              />
              <div className="flex-1">
                <div className="font-mono text-xs uppercase tracking-wider text-amber-900 font-semibold">Source du régime iranien</div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Cochez si la source est un média d'État iranien (Tasnim, Fars, IRNA, Press TV, Mehr, ISNA…). Tous les articles générés à partir de ce flux seront automatiquement préfixés <span className="italic">« selon les médias d'État iraniens »</span>.
                </p>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setShowAddFeed(false)}>
              {t('cancel')}
            </Button>
            <Button className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none" onClick={handleAddFeed} data-testid="save-feed-btn">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Feed Dialog */}
      <Dialog open={!!editFeed} onOpenChange={() => setEditFeed(null)}>
        <DialogContent className="rounded-none border-zinc-200">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">Edit Feed</DialogTitle>
          </DialogHeader>
          {editFeed && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Name</Label>
                <Input
                  value={editFeed.name}
                  onChange={(e) => setEditFeed({ ...editFeed, name: e.target.value })}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">URL</Label>
                <Input
                  value={editFeed.url}
                  onChange={(e) => setEditFeed({ ...editFeed, url: e.target.value })}
                  className="rounded-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Language</Label>
                  <Select value={editFeed.language || 'en'} onValueChange={(v) => setEditFeed({ ...editFeed, language: v })}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Category</Label>
                  <Select value={editFeed.category || 'general'} onValueChange={(v) => setEditFeed({ ...editFeed, category: v })}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="regime">Régime (État iranien)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 border border-amber-300 bg-amber-50 rounded-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editFeed.is_regime_source}
                  onChange={(e) => setEditFeed({ ...editFeed, is_regime_source: e.target.checked })}
                  className="mt-1"
                  data-testid="edit-feed-regime-source-toggle"
                />
                <div className="flex-1">
                  <div className="font-mono text-xs uppercase tracking-wider text-amber-900 font-semibold">Source du régime iranien</div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Cochez si la source est un média d'État iranien (Tasnim, Fars, IRNA, Press TV…). Attribution automatique appliquée.
                  </p>
                </div>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setEditFeed(null)}>
              {t('cancel')}
            </Button>
            <Button className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none" onClick={handleUpdateFeed}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Article Dialog (for Studies/Analysis) */}
      <Dialog open={showCreateArticle} onOpenChange={setShowCreateArticle}>
        <DialogContent className="rounded-none border-zinc-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5" strokeWidth={1.5} />
              Create Article
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Content Type</Label>
                <Select value={newArticle.content_type} onValueChange={(v) => setNewArticle({ ...newArticle, content_type: v })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">{t('category')}</Label>
                <Select value={newArticle.category} onValueChange={(v) => setNewArticle({ ...newArticle, category: v })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="society">Society</SelectItem>
                    <SelectItem value="human-rights">Human Rights</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="en" className="space-y-4">
              <TabsList className="rounded-none">
                <TabsTrigger value="en" className="rounded-none font-mono text-xs">English</TabsTrigger>
                <TabsTrigger value="fr" className="rounded-none font-mono text-xs">Français</TabsTrigger>
                <TabsTrigger value="fa" className="rounded-none font-mono text-xs">فارسی</TabsTrigger>
              </TabsList>

              {['en', 'fr', 'fa'].map(lang => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-wider">{t('title')}</Label>
                    <Input
                      value={newArticle[`title_${lang}`] || ''}
                      onChange={(e) => setNewArticle({ ...newArticle, [`title_${lang}`]: e.target.value })}
                      className="rounded-none"
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      placeholder={lang === 'en' ? 'Article title...' : lang === 'fr' ? 'Titre de l\'article...' : 'عنوان مقاله...'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-wider">{t('summary')}</Label>
                    <Textarea
                      value={newArticle[`summary_${lang}`] || ''}
                      onChange={(e) => setNewArticle({ ...newArticle, [`summary_${lang}`]: e.target.value })}
                      className="rounded-none"
                      rows={2}
                      dir={lang === 'fa' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-mono text-xs uppercase tracking-wider">{t('content')}</Label>
                      {(newArticle.content_type === 'analysis' || newArticle.content_type === 'study') && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400">HTML supported</span>
                          <Button 
                            size="sm" variant="outline" 
                            className="h-6 text-[10px] rounded-none font-mono"
                            onClick={() => setPreviewLang(previewLang === lang ? null : lang)}
                          >
                            {previewLang === lang ? 'Edit' : 'Preview'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {previewLang === lang ? (
                      <div 
                        className="border border-zinc-200 rounded-none p-4 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none prose-headings:font-heading prose-a:text-[#1E3A5F] prose-table:border-collapse prose-td:border prose-td:border-zinc-200 prose-td:p-2 prose-th:border prose-th:border-zinc-200 prose-th:p-2 prose-th:bg-zinc-50"
                        dangerouslySetInnerHTML={renderHtml(newArticle[`content_${lang}`] || '<p class="text-zinc-400">No content yet</p>')}
                      />
                    ) : (
                      <Textarea
                        value={newArticle[`content_${lang}`] || ''}
                        onChange={(e) => setNewArticle({ ...newArticle, [`content_${lang}`]: e.target.value })}
                        className="rounded-none font-mono text-sm"
                        rows={12}
                        dir={lang === 'fa' ? 'rtl' : 'ltr'}
                        placeholder={newArticle.content_type === 'analysis' || newArticle.content_type === 'study' 
                          ? 'Paste HTML content here... e.g. <h2>Section</h2><p>Content...</p>' 
                          : 'Article content...'}
                      />
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Cover Image</Label>
              {newArticle.image_url ? (
                <div className="space-y-2">
                  <div className="relative w-full h-32 rounded border border-zinc-200 overflow-hidden bg-zinc-50">
                    <img src={newArticle.image_url} alt="Cover" className="w-full h-full object-cover" />
                    <Button size="sm" variant="ghost" className="absolute top-1 right-1 bg-white/80 h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => setNewArticle({ ...newArticle, image_url: '' })}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'new')}
                    className="rounded-none"
                    data-testid="image-upload-new"
                  />
                  {(newArticle.content_type === 'analysis' || newArticle.content_type === 'study') && (
                    (() => {
                      const htmlImg = extractFirstImage(newArticle.content_en || newArticle.content_fr);
                      return htmlImg ? (
                        <Button 
                          size="sm" variant="outline" className="rounded-none text-xs w-full"
                          onClick={() => setNewArticle({ ...newArticle, image_url: htmlImg })}
                        >
                          Use first image from HTML content
                        </Button>
                      ) : null;
                    })()
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">PDF Attachment</Label>
              {newArticle.pdf_url ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 flex-1">PDF uploaded</span>
                  <Button size="sm" variant="ghost" className="text-red-500 h-6" onClick={() => setNewArticle({ ...newArticle, pdf_url: '' })}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handlePdfUpload(e, 'new')}
                  className="rounded-none"
                  data-testid="pdf-upload-new"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setShowCreateArticle(false)}>
              {t('cancel')}
            </Button>
            <Button className="bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none" onClick={handleCreateArticle}>
              Create as Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={!!editArticle} onOpenChange={() => setEditArticle(null)}>
        <DialogContent className="rounded-none border-zinc-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">{t('edit')} {t('articles')}</DialogTitle>
          </DialogHeader>
          {editArticle && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between gap-3 border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Mise en forme</p>
                  <p className="text-xs text-zinc-700">Reformate le contenu IA en HTML structuré (paragraphes, sous-titres, voix humaine) dans les 3 langues.</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-none bg-amber-600 hover:bg-amber-700 text-xs whitespace-nowrap"
                  disabled={humanizing}
                  onClick={handleHumanize}
                  data-testid="humanize-article-btn"
                >
                  {humanizing ? 'Reformatage…' : '✍️ Humaniser & formater'}
                </Button>
              </div>

              <Tabs defaultValue="en" className="space-y-4">
                <TabsList className="rounded-none">
                  <TabsTrigger value="en" className="rounded-none font-mono text-xs">English</TabsTrigger>
                  <TabsTrigger value="fr" className="rounded-none font-mono text-xs">Français</TabsTrigger>
                  <TabsTrigger value="fa" className="rounded-none font-mono text-xs">فارسی</TabsTrigger>
                </TabsList>

                {['en', 'fr', 'fa'].map(lang => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-wider">{t('title')}</Label>
                      <Input
                        value={editArticle[`title_${lang}`] || ''}
                        onChange={(e) => setEditArticle({ ...editArticle, [`title_${lang}`]: e.target.value })}
                        className="rounded-none"
                        dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-wider">{t('summary')}</Label>
                      <Textarea
                        value={editArticle[`summary_${lang}`] || ''}
                        onChange={(e) => setEditArticle({ ...editArticle, [`summary_${lang}`]: e.target.value })}
                        className="rounded-none"
                        rows={2}
                        dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-mono text-xs uppercase tracking-wider">{t('content')}</Label>
                        {(editArticle.content_type === 'analysis' || editArticle.content_type === 'study') && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-400">HTML supported</span>
                            <Button 
                              size="sm" variant="outline" 
                              className="h-6 text-[10px] rounded-none font-mono"
                              onClick={() => setPreviewLang(previewLang === lang ? null : lang)}
                            >
                              {previewLang === lang ? 'Edit' : 'Preview'}
                            </Button>
                          </div>
                        )}
                      </div>
                      {previewLang === lang ? (
                        <div 
                          className="border border-zinc-200 rounded-none p-4 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none prose-headings:font-heading prose-a:text-[#1E3A5F] prose-table:border-collapse prose-td:border prose-td:border-zinc-200 prose-td:p-2 prose-th:border prose-th:border-zinc-200 prose-th:p-2 prose-th:bg-zinc-50"
                          dangerouslySetInnerHTML={renderHtml(editArticle[`content_${lang}`] || '<p class="text-zinc-400">No content yet</p>')}
                        />
                      ) : (
                        <Textarea
                          value={editArticle[`content_${lang}`] || ''}
                          onChange={(e) => setEditArticle({ ...editArticle, [`content_${lang}`]: e.target.value })}
                          className="rounded-none font-mono text-sm"
                          rows={12}
                          dir={lang === 'fa' ? 'rtl' : 'ltr'}
                          placeholder="Paste HTML content here..."
                        />
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Cover Image</Label>
                  {editArticle.image_url ? (
                    <div className="relative w-full h-20 rounded border border-zinc-200 overflow-hidden bg-zinc-50">
                      <img src={editArticle.image_url} alt="Cover" className="w-full h-full object-cover" />
                      <Button size="sm" variant="ghost" className="absolute top-1 right-1 bg-white/80 h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => setEditArticle({ ...editArticle, image_url: '' })}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'edit')} className="rounded-none" />
                      {(editArticle.content_type === 'analysis' || editArticle.content_type === 'study') && (() => {
                        const htmlImg = extractFirstImage(editArticle.content_en || editArticle.content_fr);
                        return htmlImg ? (
                          <Button size="sm" variant="outline" className="rounded-none text-xs w-full" onClick={() => setEditArticle({ ...editArticle, image_url: htmlImg })}>
                            Use first image from HTML
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">{t('category')}</Label>
                  <Select 
                    value={editArticle.category || 'news'} 
                    onValueChange={(v) => setEditArticle({ ...editArticle, category: v })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="society">Society</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">PDF Attachment</Label>
                {editArticle.pdf_url ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200">
                    <Check className="w-4 h-4 text-green-600" />
                    <a href={editArticle.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 flex-1 underline">PDF attached</a>
                    <Button size="sm" variant="ghost" className="text-red-500 h-6" onClick={() => setEditArticle({ ...editArticle, pdf_url: '' })}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handlePdfUpload(e, 'edit')}
                    className="rounded-none"
                    data-testid="pdf-upload-edit"
                  />
                )}
              </div>

              {/* ============ SEO PANEL ============ */}
              <div className="border-t border-zinc-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-bold text-base">SEO</h3>
                    <p className="text-xs text-zinc-500 mt-1">Meta title, description et mots-clés par langue.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {seoScore && (
                      <div
                        className={`px-3 py-1 text-xs font-mono font-bold ${seoScore.score >= 80 ? 'bg-green-100 text-green-700' : seoScore.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                        data-testid="seo-score-badge"
                      >
                        SEO {seoScore.score}/100
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="rounded-none bg-[#1E3A5F] text-xs"
                      disabled={seoGenerating}
                      onClick={handleGenerateSeo}
                      data-testid="generate-seo-btn"
                    >
                      {seoGenerating ? 'Génération...' : '✨ Générer SEO (IA)'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="font-mono text-xs uppercase tracking-wider">Slug (URL)</Label>
                  <Input
                    value={editArticle.slug || ''}
                    onChange={(e) => setEditArticle({ ...editArticle, slug: e.target.value })}
                    className="rounded-none font-mono text-xs"
                    placeholder="ex: iran-strait-hormuz-crisis-2026"
                    data-testid="seo-slug-input"
                  />
                  <p className="text-[10px] text-zinc-400">URL canonique : iranobservatory.org/article/<span className="font-mono">{editArticle.slug || '...'}</span></p>
                </div>

                <Tabs defaultValue="fr" className="space-y-3">
                  <TabsList className="rounded-none">
                    <TabsTrigger value="fr" className="rounded-none font-mono text-xs">FR</TabsTrigger>
                    <TabsTrigger value="en" className="rounded-none font-mono text-xs">EN</TabsTrigger>
                    <TabsTrigger value="fa" className="rounded-none font-mono text-xs">FA</TabsTrigger>
                  </TabsList>
                  {['fr', 'en', 'fa'].map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="font-mono text-xs uppercase tracking-wider">SEO Title ({lang.toUpperCase()})</Label>
                          <span className={`text-[10px] font-mono ${((editArticle[`seo_title_${lang}`] || '').length || 0) > 60 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {((editArticle[`seo_title_${lang}`] || '').length || 0)}/60
                          </span>
                        </div>
                        <Input
                          value={editArticle[`seo_title_${lang}`] || ''}
                          onChange={(e) => setEditArticle({ ...editArticle, [`seo_title_${lang}`]: e.target.value })}
                          className="rounded-none"
                          dir={lang === 'fa' ? 'rtl' : 'ltr'}
                          maxLength={70}
                          data-testid={`seo-title-${lang}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="font-mono text-xs uppercase tracking-wider">Meta Description ({lang.toUpperCase()})</Label>
                          <span className={`text-[10px] font-mono ${((editArticle[`meta_description_${lang}`] || '').length || 0) > 160 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {((editArticle[`meta_description_${lang}`] || '').length || 0)}/155
                          </span>
                        </div>
                        <Textarea
                          value={editArticle[`meta_description_${lang}`] || ''}
                          onChange={(e) => setEditArticle({ ...editArticle, [`meta_description_${lang}`]: e.target.value })}
                          className="rounded-none"
                          rows={2}
                          dir={lang === 'fa' ? 'rtl' : 'ltr'}
                          maxLength={170}
                          data-testid={`meta-desc-${lang}`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="space-y-1 mt-3">
                  <Label className="font-mono text-xs uppercase tracking-wider">Focus Keywords (comma-separated)</Label>
                  <Input
                    value={(editArticle.focus_keywords || []).join(', ')}
                    onChange={(e) => setEditArticle({ ...editArticle, focus_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                    className="rounded-none font-mono text-xs"
                    placeholder="Iran sanctions 2026, Strait of Hormuz, droits humains Iran"
                    data-testid="focus-keywords-input"
                  />
                </div>

                {/* Live SEO checklist */}
                {seoScore && (
                  <div className="mt-4 bg-zinc-50 border border-zinc-200 p-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Checklist</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {seoScore.checks.map((c, i) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span className={c.passed ? 'text-green-600' : 'text-zinc-300'}>{c.passed ? '✓' : '○'}</span>
                          <span className={c.passed ? 'text-zinc-700' : 'text-zinc-500'}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setEditArticle(null)}>
              {t('cancel')}
            </Button>
            <Button className="btn-primary rounded-none" onClick={handleUpdateArticle} data-testid="save-article-btn">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
