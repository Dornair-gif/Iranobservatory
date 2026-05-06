import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [editFeed, setEditFeed] = useState(null);
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'general', language: 'en' });
  const [selectedRssItem, setSelectedRssItem] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [previewLang, setPreviewLang] = useState(null);
  const [newsletterPreview, setNewsletterPreview] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
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
      setNewFeed({ name: '', url: '', category: 'general', language: 'en' });
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
        language: editFeed.language
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
      fetchArticles();
    } catch (e) {
      toast.error('Failed to update article');
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
                          onClick={() => setEditArticle(article)}
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
                        onClick={() => setEditArticle(article)}
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{feed.name}</p>
                        <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-zinc-100 text-zinc-600">
                          {feed.language || 'en'}
                        </span>
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
                  <p className="text-xs text-zinc-500 mt-1">Users who provided their email to download PDFs</p>
                </div>
                <span className="font-mono text-sm text-zinc-500">{subscribers.length} contacts</span>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
                {subscribers.map(sub => (
                  <div key={sub.id} className="p-4 flex items-center justify-between" data-testid={`subscriber-${sub.id}`}>
                    <div>
                      <p className="font-medium text-sm">{sub.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {sub.newsletter && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-mono uppercase">Newsletter</span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400">{sub.downloads_count} downloads</span>
                        <span className="text-[10px] font-mono text-zinc-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => handleDeleteSubscriber(sub.id)}
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                    </Button>
                  </div>
                ))}
                {subscribers.length === 0 && (
                  <p className="p-8 text-center text-zinc-500 text-sm">No subscribers yet. Emails will appear here when users download PDFs.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Newsletter Tab */}
          <TabsContent value="newsletter" className="space-y-4">
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="font-heading font-bold text-lg mb-4">Send Newsletter</h3>
              <p className="text-sm text-zinc-500 mb-6">Generate and send a newsletter to all subscribers who opted in. Includes the latest weekly brief, featured news, and new studies.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Button 
                    className="w-full rounded-none bg-[#1E3A5F]"
                    onClick={async () => {
                      try {
                        const res = await axios.post(`${API}/newsletter/generate`, {}, axiosConfig);
                        setNewsletterPreview(res.data);
                        toast.success('Newsletter generated');
                      } catch (e) {
                        toast.error('Failed to generate newsletter');
                      }
                    }}
                    data-testid="generate-newsletter-btn"
                  >
                    Generate Newsletter Preview
                  </Button>
                  
                  <Button 
                    className="w-full rounded-none bg-[#3DB883] hover:bg-[#2D9E6E]"
                    onClick={async () => {
                      try {
                        const res = await axios.post(`${API}/briefs/generate`, {}, axiosConfig);
                        toast.success(`Weekly brief generated (ID: ${res.data.article_id})`);
                        fetchArticles();
                      } catch (e) {
                        toast.error('Failed to generate brief: ' + (e.response?.data?.detail || e.message));
                      }
                    }}
                    data-testid="generate-brief-btn"
                  >
                    Generate Weekly Brief Now
                  </Button>
                  
                  {newsletterPreview && (
                    <Button 
                      className="w-full rounded-none bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        if (!window.confirm(`Send newsletter to all subscribers?`)) return;
                        try {
                          const res = await axios.post(`${API}/newsletter/send`, {
                            subject: newsletterPreview.subject,
                            html_content: newsletterPreview.html_content
                          }, axiosConfig);
                          toast.success(`Newsletter sent to ${res.data.sent} subscribers`);
                        } catch (e) {
                          toast.error('Failed to send: ' + (e.response?.data?.detail || e.message));
                        }
                      }}
                      data-testid="send-newsletter-btn"
                    >
                      Send to All Subscribers ({subscribers.filter(s => s.newsletter).length})
                    </Button>
                  )}
                </div>
                
                {/* Preview */}
                <div className="border border-zinc-200 rounded overflow-hidden">
                  <div className="bg-zinc-100 p-2 border-b border-zinc-200">
                    <span className="text-xs font-mono text-zinc-500">PREVIEW</span>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto">
                    {newsletterPreview ? (
                      <div dangerouslySetInnerHTML={{ __html: newsletterPreview.html_content }} />
                    ) : (
                      <p className="text-zinc-400 text-sm text-center py-10">Click "Generate Newsletter Preview" to see the email</p>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                        dangerouslySetInnerHTML={{ __html: newArticle[`content_${lang}`] || '<p class="text-zinc-400">No content yet</p>' }}
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
                          dangerouslySetInnerHTML={{ __html: editArticle[`content_${lang}`] || '<p class="text-zinc-400">No content yet</p>' }}
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
