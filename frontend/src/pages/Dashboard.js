import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, Bomb, DollarSign, Handshake, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown, Minus, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Globe, Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

const themeConfig = {
  military: { icon: Bomb, color: '#dc2626', label: { en: 'Military', fr: 'Militaire', fa: 'نظامی' } },
  diplomacy: { icon: Handshake, color: '#2563eb', label: { en: 'Diplomacy', fr: 'Diplomatie', fa: 'دیپلماسی' } },
  economy: { icon: DollarSign, color: '#d97706', label: { en: 'Economy', fr: 'Économie', fa: 'اقتصاد' } },
  human_rights: { icon: Users, color: '#7c3aed', label: { en: 'Human Rights', fr: 'Droits Humains', fa: 'حقوق بشر' } },
  nuclear: { icon: AlertTriangle, color: '#dc2626', label: { en: 'Nuclear', fr: 'Nucléaire', fa: 'هسته‌ای' } },
  sanctions: { icon: Scale, color: '#059669', label: { en: 'Sanctions', fr: 'Sanctions', fa: 'تحریم‌ها' } },
};

function TrendArrow({ trend }) {
  if (trend === 'rising') return <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />;
  if (trend === 'declining') return <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />;
  return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
}

function TrendLabel({ trend, language }) {
  const labels = {
    rising: { en: 'Rising', fr: 'Hausse', fa: 'صعودی' },
    declining: { en: 'Declining', fr: 'Baisse', fa: 'نزولی' },
    stable: { en: 'Stable', fr: 'Stable', fa: 'ثابت' },
  };
  return labels[trend]?.[language] || labels[trend]?.en || trend;
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/dashboard/indexes`);
        setData(response.data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tensionColor = (score) => {
    if (score >= 8) return '#dc2626';
    if (score >= 6) return '#d97706';
    if (score >= 4) return '#2563eb';
    return '#059669';
  };

  const barColor = (val) => {
    if (val >= 8) return '#dc2626';
    if (val >= 6) return '#d97706';
    if (val >= 4) return '#60a5fa';
    return '#86efac';
  };

  const severityColor = (s) => s === 'high' ? 'bg-red-100 text-red-700' : s === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600';

  const titles = {
    en: 'Iran Monitor — Live Intelligence Dashboard',
    fr: 'Iran Monitor — Tableau de Bord en Direct',
    fa: 'رصد ایران — داشبورد اطلاعاتی زنده'
  };
  const subtitles = {
    en: 'AI-powered real-time analysis of geopolitical, security and human rights dynamics',
    fr: 'Analyse en temps réel par IA des dynamiques géopolitiques, sécuritaires et des droits humains',
    fa: 'تحلیل بلادرنگ مبتنی بر هوش مصنوعی از پویایی‌های ژئوپلیتیکی، امنیتی و حقوق بشر'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-10 h-10 text-[#3DB883] animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-wider">
            {language === 'fr' ? 'Chargement des données...' : 'Loading intelligence data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-400">{language === 'fr' ? 'Données en cours de calcul. Réessayez dans quelques minutes.' : 'Data being computed. Try again shortly.'}</p>
        </div>
      </div>
    );
  }

  const ti = data.tension_index;
  const tc = data.theme_counts;
  const tt = data.theme_trends;
  const hr = data.human_rights;
  const sanctions = data.sanctions_recent || [];
  const history = data.tension_history || [];

  return (
    <div className="min-h-screen bg-[#0a1628]" data-testid="dashboard-page">
      <SEO 
        title={titles[language] || titles.en}
        description={subtitles[language] || subtitles.en}
        url="/monitor"
        language={language}
      />

      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-wider transition-colors">
            {language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home'}
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
                <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter text-white">
                  Iran Monitor
                </h1>
              </div>
              <p className="text-zinc-500 mt-2 text-sm max-w-2xl">
                {subtitles[language] || subtitles.en}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Activity className="w-3 h-3 text-[#3DB883] animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                {language === 'fr' ? 'Mis à jour' : 'Updated'}: {data.updated_at ? new Date(data.updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* === TENSION INDEX === */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gauge */}
            <div className="border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col items-center justify-center">
              <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                {language === 'fr' ? 'Indice de Tension' : 'Tension Index'}
              </h3>
              <div className="relative w-40 h-40 mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(ti.score)} strokeWidth="8" strokeDasharray={`${(ti.score / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-heading font-black" style={{ color: tensionColor(ti.score) }}>{ti.score}</span>
                  <span className="text-[10px] font-mono text-zinc-600">/10</span>
                </div>
              </div>
              <span className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold rounded-sm" style={{ backgroundColor: tensionColor(ti.score) + '20', color: tensionColor(ti.score) }}>
                {ti.level}
              </span>
              <p className="text-xs text-zinc-500 mt-3 text-center leading-relaxed max-w-xs">{ti.summary}</p>
            </div>

            {/* 30-day trend */}
            <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'fr' ? 'Tendance 30 Jours' : '30-Day Trend'}
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> {language === 'fr' ? 'Critique' : 'Critical'}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {language === 'fr' ? 'Élevé' : 'Elevated'}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {language === 'fr' ? 'Modéré' : 'Moderate'}</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-36">
                {history.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${(val / 10) * 100}%`,
                        backgroundColor: barColor(val),
                        opacity: i === history.length - 1 ? 1 : 0.5 + (i / history.length) * 0.5
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] font-mono text-zinc-700">30 {language === 'fr' ? 'jours' : 'days'}</span>
                <span className="text-[9px] font-mono text-zinc-700">{language === 'fr' ? "Aujourd'hui" : 'Today'}</span>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'fr' ? 'Facteurs clés' : 'Key Drivers'}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ti.key_drivers?.map((d, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-800/80 text-zinc-300 text-[11px] font-mono border border-zinc-700/50">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === EVENT TRACKER === */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-black text-xl text-white tracking-tighter">
              {language === 'fr' ? 'Suivi des Événements' : 'Event Tracker'}
            </h2>
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-2 py-1">
              {language === 'fr' ? '30 derniers jours' : 'Last 30 days'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(tc).map(([key, count]) => {
              const config = themeConfig[key];
              if (!config) return null;
              const Icon = config.icon;
              const trend = tt[key] || 'stable';
              return (
                <div key={key} className="border border-zinc-800 bg-zinc-900/50 p-4 text-center hover:border-zinc-600 transition-colors">
                  <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: config.color + '15' }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
                  </div>
                  <p className="text-2xl font-heading font-black text-white mb-0.5">{count}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    {config.label[language] || config.label.en}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <TrendArrow trend={trend} />
                    <span className={`text-[9px] font-mono ${trend === 'rising' ? 'text-red-400' : trend === 'declining' ? 'text-green-400' : 'text-zinc-500'}`}>
                      <TrendLabel trend={trend} language={language} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* === HUMAN RIGHTS & SOCIETY === */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#7c3aed]" strokeWidth={1.5} />
            <h2 className="font-heading font-black text-xl text-white tracking-tighter">
              {language === 'fr' ? 'Droits Humains & Société' : language === 'fa' ? 'حقوق بشر و جامعه' : 'Human Rights & Society'}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    {language === 'fr' ? 'Coupure Internet' : 'Internet Access'}
                  </span>
                  {hr.internet_disruption === 'yes' ? (
                    <WifiOff className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                  ) : hr.internet_disruption === 'partial' ? (
                    <Wifi className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                  ) : (
                    <Wifi className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-xl font-heading font-black mt-2" style={{ color: hr.internet_disruption === 'yes' ? '#dc2626' : hr.internet_disruption === 'partial' ? '#d97706' : '#059669' }}>
                  {hr.internet_disruption === 'yes' ? (language === 'fr' ? 'COUPÉ' : 'DISRUPTED') : hr.internet_disruption === 'partial' ? (language === 'fr' ? 'PARTIEL' : 'PARTIAL') : (language === 'fr' ? 'ACTIF' : 'ACTIVE')}
                </p>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/50 p-5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  {language === 'fr' ? 'Prisonniers politiques mentionnés' : 'Political Prisoners Mentioned'}
                </span>
                <p className="text-3xl font-heading font-black text-[#7c3aed] mt-2">{hr.political_prisoners_mentioned}</p>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/50 p-5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  {language === 'fr' ? 'Manifestations signalées' : 'Protests Reported'}
                </span>
                <p className="text-3xl font-heading font-black text-amber-500 mt-2">{hr.protests_reported}</p>
              </div>
            </div>

            {/* Key Issues */}
            <div className="border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                {language === 'fr' ? 'Enjeux principaux' : 'Key Issues'}
              </h3>
              <div className="space-y-3">
                {hr.key_issues?.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold mt-0.5">{i + 1}</span>
                    <p className="text-sm text-zinc-300 leading-relaxed">{issue}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <span className="text-[9px] font-mono text-zinc-600">
                  {language === 'fr' ? 'Source : HRA News (Telegram)' : 'Source: HRA News (Telegram)'}
                </span>
              </div>
            </div>

            {/* Recent Events */}
            <div className="border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                {language === 'fr' ? 'Événements récents' : 'Recent Events'}
              </h3>
              <div className="space-y-4">
                {hr.recent_events?.map((event, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${severityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === SANCTIONS TRACKER === */}
        {sanctions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-[#059669]" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-xl text-white tracking-tighter">
                {language === 'fr' ? 'Suivi des Sanctions' : 'Sanctions Tracker'}
              </h2>
            </div>
            <div className="border border-zinc-800 bg-zinc-900/50">
              <div className="divide-y divide-zinc-800/50">
                {sanctions.map((s, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-20">
                      <span className="text-[10px] font-mono text-zinc-500">{s.date}</span>
                      <div className={`w-2 h-2 rounded-full mt-1 ${s.action === 'Added' ? 'bg-red-500' : s.action === 'Lifted' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">{s.entity}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${s.action === 'Added' ? 'bg-red-500/20 text-red-400' : s.action === 'Lifted' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {s.action}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{s.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer note */}
        <div className="text-center py-6 border-t border-zinc-800/50">
          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-wider">
            {language === 'fr' 
              ? 'Données alimentées par IA — Sources : flux RSS + HRA News (Telegram) — Mise à jour automatique toutes les 2h'
              : 'AI-powered data — Sources: RSS feeds + HRA News (Telegram) — Auto-updated every 2h'}
          </p>
        </div>
      </main>
    </div>
  );
}
