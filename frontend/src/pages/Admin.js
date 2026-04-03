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
  Eye, Edit, Send, Loader2, Check, X, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'general' });
  const [selectedRssItem, setSelectedRssItem] = useState(null);
  const [generating, setGenerating] = useState(false);

  const axiosConfig = { withCredentials: true };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchArticles();
      fetchFeeds();
      fetchRssItems();
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
      const response = await axios.get(`${API}/rss/items?processed=false`, axiosConfig);
      setRssItems(response.data);
    } catch (e) {
      console.error('Failed to fetch RSS items:', e);
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
      setNewFeed({ name: '', url: '', category: 'general' });
      fetchFeeds();
    } catch (e) {
      toast.error('Failed to add feed');
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
            <div className="bg-white border border-zinc-200">
              <div className="border-b border-zinc-200 p-4 flex items-center justify-between">
                <h3 className="font-heading font-bold">{t('articles')}</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {articles.map(article => (
                  <div key={article.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{article.title_en || 'Untitled'}</p>
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {article.status}
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
                className="btn-primary rounded-none"
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
                      <p className="font-medium">{feed.name}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RSS Items List */}
              <div className="bg-white border border-zinc-200">
                <div className="border-b border-zinc-200 p-4">
                  <h3 className="font-heading font-bold">{t('pendingItems')}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{t('selectItem')}</p>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                  {rssItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedRssItem?.id === item.id 
                          ? 'bg-red-50 border-l-4 border-red-700' 
                          : 'hover:bg-zinc-50'
                      }`}
                      onClick={() => setSelectedRssItem(item)}
                      data-testid={`rss-item-${item.id}`}
                    >
                      <p className="font-medium text-sm">{item.title}</p>
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
                    <p className="p-8 text-center text-zinc-500">
                      No pending RSS items. Fetch a feed first.
                    </p>
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
                placeholder="https://example.com/rss.xml"
                className="rounded-none"
                data-testid="feed-url-input"
              />
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
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setShowAddFeed(false)}>
              {t('cancel')}
            </Button>
            <Button className="btn-primary rounded-none" onClick={handleAddFeed} data-testid="save-feed-btn">
              {t('save')}
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
                      <Label className="font-mono text-xs uppercase tracking-wider">{t('content')}</Label>
                      <Textarea
                        value={editArticle[`content_${lang}`] || ''}
                        onChange={(e) => setEditArticle({ ...editArticle, [`content_${lang}`]: e.target.value })}
                        className="rounded-none"
                        rows={10}
                        dir={lang === 'fa' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Image URL</Label>
                  <Input
                    value={editArticle.image_url || ''}
                    onChange={(e) => setEditArticle({ ...editArticle, image_url: e.target.value })}
                    className="rounded-none"
                  />
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
