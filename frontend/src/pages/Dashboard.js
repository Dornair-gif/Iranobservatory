import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, Bomb, DollarSign, Handshake, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown, Minus, ArrowUpRight, 
  ArrowDownRight, Eye, ChevronDown, ChevronUp, Calendar, Globe, Fuel,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

const themeConfig = {
  military: { icon: Bomb, color: '#dc2626', label: { en: 'Military', fr: 'Militaire', fa: 'نظامی' } },
  diplomacy: { icon: Handshake, color: '#2563eb', label: { en: 'Diplomacy', fr: 'Diplomatie', fa: 'دیپلماسی' } },
  economy: { icon: DollarSign, color: '#d97706', label: { en: 'Economy', fr: 'Économie', fa: 'اقتصاد' } },
  human_rights: { icon: Users, color: '#7c3aed', label: { en: 'Human Rights', fr: 'Droits Humains', fa: 'حقوق بشر' } },
  nuclear: { icon: AlertTriangle, color: '#e11d48', label: { en: 'Nuclear', fr: 'Nucléaire', fa: 'هسته‌ای' } },
  sanctions: { icon: Scale, color: '#059669', label: { en: 'Sanctions', fr: 'Sanctions', fa: 'تحریم‌ها' } },
};

function TrendBadge({ trend, language }) {
  const labels = { rising: { en: 'Rising', fr: 'Hausse' }, declining: { en: 'Declining', fr: 'Baisse' }, stable: { en: 'Stable', fr: 'Stable' } };
  const colors = { rising: 'text-red-400', declining: 'text-green-400', stable: 'text-zinc-500' };
  const icons = { rising: ArrowUpRight, declining: ArrowDownRight, stable: Minus };
  const Icon = icons[trend] || Minus;
  return (
    <span className={`flex items-center gap-1 text-[9px] font-mono ${colors[trend] || 'text-zinc-500'}`}>
      <Icon className="w-3 h-3" />
      {labels[trend]?.[language] || trend}
    </span>
  );
}

function barColor(val) {
  if (val >= 8) return '#dc2626';
  if (val >= 6) return '#d97706';
  if (val >= 4) return '#60a5fa';
  return '#86efac';
}

function tensionColor(score) {
  if (score >= 8) return '#dc2626';
  if (score >= 6) return '#d97706';
  if (score >= 4) return '#2563eb';
  return '#059669';
}

// Expandable Event Detail Panel
function EventDetailPanel({ themeKey, events, config, onClose, language }) {
  const Icon = config.icon;
  return (
    <div className="border border-zinc-800 bg-zinc-900/80 mt-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
          <span className="font-heading font-bold text-white text-sm">{config.label[language] || config.label.en}</span>
          <span className="text-[10px] font-mono text-zinc-500">{events?.length || 0} {language === 'fr' ? 'événements' : 'events'}</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="divide-y divide-zinc-800/50 max-h-96 overflow-y-auto">
        {events?.map((event, i) => (
          <div key={i} className="p-4 hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-mono text-zinc-600 w-20 flex-shrink-0 pt-0.5">{event.date}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{event.description}</p>
                <span className="text-[9px] font-mono text-zinc-600 mt-1 inline-block">{event.source}</span>
              </div>
            </div>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <p className="p-6 text-center text-zinc-600 text-sm">{language === 'fr' ? 'Aucun événement détaillé disponible' : 'No detailed events available'}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [showAllSanctions, setShowAllSanctions] = useState(false);

  useEffect(() => {
    axios.get(`${API}/dashboard/indexes`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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
          <p className="text-zinc-400">{language === 'fr' ? 'Données en cours de calcul...' : 'Data being computed...'}</p>
        </div>
      </div>
    );
  }

  const ti = data.tension_index || {};
  const tc = data.theme_counts || {};
  const tt = data.theme_trends || {};
  const te = data.theme_events || {};
  const hr = data.human_rights || {};
  const sanctions = data.sanctions_tracker || data.sanctions_recent || [];
  const history = data.tension_history || [];
  const econ = data.economic_indicators || {};

  return (
    <div className="min-h-screen bg-[#0a1628]" data-testid="dashboard-page">
      <SEO 
        title={language === 'fr' ? 'Iran Monitor — Tableau de Bord' : 'Iran Monitor — Live Dashboard'}
        description={language === 'fr' ? 'Analyse en temps réel de la situation en Iran' : 'Real-time analysis of the situation in Iran'}
        url="/monitor"
        language={language}
      />

      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-wider transition-colors">
            Iran Observatory
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <Eye className="w-7 h-7 text-[#3DB883]" strokeWidth={1.5} />
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tighter text-white">Iran Monitor</h1>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#3DB883] animate-pulse" />
              <span className="text-[9px] font-mono text-zinc-600">
                {data.updated_at ? new Date(data.updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* === SITUATION BRIEFING === */}
        {data.situation_summary && (
          <section className="border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-[10px] font-mono text-[#3DB883] uppercase tracking-widest mb-3">
              {language === 'fr' ? 'Briefing Situation' : 'Situation Briefing'}
            </h2>
            <ul className="space-y-2">
              {(Array.isArray(data.situation_summary) ? data.situation_summary : [data.situation_summary]).map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                  <span className="text-[#3DB883] mt-1.5 flex-shrink-0">&#8226;</span>
                  {bullet}
                </li>
              ))}
            </ul>
            {data.updated_context && (
              <p className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500 leading-relaxed italic">
                {data.updated_context}
              </p>
            )}
          </section>
        )}

        {/* === TENSION INDEX === */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center">
              <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
                {language === 'fr' ? 'Indice de Tension' : 'Tension Index'}
              </h3>
              <div className="relative w-36 h-36 mb-3">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(ti.score)} strokeWidth="8" strokeDasharray={`${(ti.score / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-heading font-black" style={{ color: tensionColor(ti.score) }}>{ti.score}</span>
                  <span className="text-[9px] font-mono text-zinc-600">/10</span>
                </div>
              </div>
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold" style={{ backgroundColor: tensionColor(ti.score) + '20', color: tensionColor(ti.score) }}>
                {ti.level}
              </span>
              <p className="text-[11px] text-zinc-500 mt-3 text-center leading-relaxed">{ti.summary}</p>
            </div>

            <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'fr' ? 'Tendance 30 Jours' : '30-Day Trend'}
                </span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{language === 'fr' ? 'Critique' : 'Critical'}</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{language === 'fr' ? 'Élevé' : 'Elevated'}</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-600"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{language === 'fr' ? 'Modéré' : 'Moderate'}</span>
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-28">
                {history.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end" title={`Day ${i+1}: ${val}/10`}>
                    <div className="w-full rounded-sm" style={{ height: `${(val / 10) * 100}%`, backgroundColor: barColor(val), opacity: 0.4 + (i / history.length) * 0.6 }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-mono text-zinc-700">-30d</span>
                <span className="text-[8px] font-mono text-zinc-700">{language === 'fr' ? "Auj." : 'Today'}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{language === 'fr' ? 'Facteurs' : 'Drivers'}</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ti.key_drivers?.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[10px] font-mono border border-zinc-700/40">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === EVENT TRACKER (clickable) === */}
        <section>
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
            {language === 'fr' ? 'Suivi des Événements — 30 jours' : 'Event Tracker — 30 days'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(tc).map(([key, count]) => {
              const config = themeConfig[key];
              if (!config) return null;
              const Icon = config.icon;
              const trend = tt[key] || 'stable';
              const isExpanded = expandedTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => setExpandedTheme(isExpanded ? null : key)}
                  className={`border bg-zinc-900/50 p-3 text-center transition-all cursor-pointer ${isExpanded ? 'border-zinc-500 ring-1 ring-zinc-500/30' : 'border-zinc-800 hover:border-zinc-600'}`}
                  data-testid={`tracker-${key}`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: config.color }} strokeWidth={1.5} />
                  <p className="text-xl font-heading font-black text-white">{count}</p>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">{config.label[language] || config.label.en}</p>
                  <TrendBadge trend={trend} language={language} />
                  <ChevronDown className={`w-3 h-3 mx-auto mt-1 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>
          {expandedTheme && themeConfig[expandedTheme] && (
            <EventDetailPanel
              themeKey={expandedTheme}
              events={te[expandedTheme]}
              config={themeConfig[expandedTheme]}
              onClose={() => setExpandedTheme(null)}
              language={language}
            />
          )}
        </section>

        {/* === HUMAN RIGHTS & SOCIETY (timeline) === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#7c3aed]" strokeWidth={1.5} />
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {language === 'fr' ? 'Droits Humains & Société' : 'Human Rights & Society'}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Metrics */}
            <div className="space-y-2">
              <div className="border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase">{language === 'fr' ? 'Accès Internet' : 'Internet Access'}</span>
                  {hr.internet_status?.toLowerCase().includes('disrupt') || hr.internet_status?.toLowerCase().includes('cut') || hr.internet_status?.toLowerCase().includes('restrict') ?
                    <WifiOff className="w-4 h-4 text-red-500" strokeWidth={1.5} /> :
                    <Wifi className="w-4 h-4 text-green-500" strokeWidth={1.5} />
                  }
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{hr.internet_status}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                  <p className="text-2xl font-heading font-black text-[#7c3aed]">{hr.political_prisoners_mentioned}</p>
                  <p className="text-[8px] font-mono text-zinc-600 uppercase mt-1">{language === 'fr' ? 'Prisonniers pol.' : 'Pol. Prisoners'}</p>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                  <p className="text-2xl font-heading font-black text-amber-500">{hr.protests_reported}</p>
                  <p className="text-[8px] font-mono text-zinc-600 uppercase mt-1">{language === 'fr' ? 'Manifestations' : 'Protests'}</p>
                </div>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/50 p-4">
                <span className="text-[9px] font-mono text-zinc-600 uppercase">{language === 'fr' ? 'Enjeux principaux' : 'Key Issues'}</span>
                <ul className="mt-2 space-y-1.5">
                  {hr.key_issues?.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                      <span className="text-[#7c3aed] mt-0.5 flex-shrink-0">&#8226;</span>{issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/50">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'fr' ? 'Chronologie des événements' : 'Event Timeline'}
                </span>
                <span className="text-[9px] font-mono text-zinc-700">{language === 'fr' ? 'Source: HRA News, VahidOnline' : 'Source: HRA News, VahidOnline'}</span>
              </div>
              <div className="divide-y divide-zinc-800/40 max-h-[400px] overflow-y-auto">
                {hr.timeline?.map((event, i) => (
                  <div key={i} className="p-3 flex items-start gap-3 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-3 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                      {i < (hr.timeline?.length || 0) - 1 && <div className="w-px h-full bg-zinc-800 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Calendar className="w-3 h-3 text-zinc-600" strokeWidth={1.5} />
                        <span className="text-[10px] font-mono text-zinc-500">{event.date}</span>
                        <span className="text-[9px] font-mono text-zinc-700">{event.source}</span>
                      </div>
                      <p className="text-[12px] text-zinc-300 leading-relaxed">{event.event}</p>
                    </div>
                  </div>
                ))}
                {(!hr.timeline || hr.timeline.length === 0) && (
                  <p className="p-6 text-center text-zinc-600 text-xs">{language === 'fr' ? 'Aucun événement récent' : 'No recent events'}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* === ECONOMIC MONITOR === */}
        {econ.key_metrics && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#d97706]" strokeWidth={1.5} />
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {language === 'fr' ? 'Indicateurs Économiques' : 'Economic Indicators'}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Context cards */}
              <div className="border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                {econ.oil_impact && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Impact Pétrole' : 'Oil Impact'}</span>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">{econ.oil_impact}</p>
                  </div>
                )}
                {econ.currency_pressure && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Pression Devises' : 'Currency Pressure'}</span>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">{econ.currency_pressure}</p>
                  </div>
                )}
                {econ.inflation_context && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-red-400" strokeWidth={1.5} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Inflation' : 'Inflation'}</span>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">{econ.inflation_context}</p>
                  </div>
                )}
                {econ.trade_disruption && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Commerce' : 'Trade'}</span>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">{econ.trade_disruption}</p>
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="border border-zinc-800 bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-800">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    {language === 'fr' ? 'Métriques Clés' : 'Key Metrics'}
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/40">
                  {econ.key_metrics?.map((metric, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{metric.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{metric.context}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-sm font-heading font-bold text-white">{metric.value}</span>
                        {metric.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> :
                         metric.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-green-400" /> :
                         <Minus className="w-3.5 h-3.5 text-zinc-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* === SANCTIONS TRACKER (expandable) === */}
        {sanctions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#059669]" strokeWidth={1.5} />
                <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'fr' ? 'Suivi des Sanctions' : 'Sanctions Tracker'}
                </h2>
              </div>
              <button
                onClick={() => setShowAllSanctions(!showAllSanctions)}
                className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                data-testid="toggle-sanctions"
              >
                {showAllSanctions ? (language === 'fr' ? 'Réduire' : 'Collapse') : (language === 'fr' ? 'Voir tout' : 'View all')}
                {showAllSanctions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <div className="border border-zinc-800 bg-zinc-900/50">
              <div className="divide-y divide-zinc-800/40">
                {(showAllSanctions ? sanctions : sanctions.slice(0, 3)).map((s, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-20">
                      <span className="text-[10px] font-mono text-zinc-500">{s.date}</span>
                      <div className={`w-2 h-2 rounded-full mt-1 ${s.action === 'Added' ? 'bg-red-500' : s.action === 'Lifted' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.entity}</p>
                      {s.details && <p className="text-[11px] text-zinc-500 mt-0.5">{s.details}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${s.action === 'Added' ? 'bg-red-500/15 text-red-400' : s.action === 'Lifted' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {s.action}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600">{s.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!showAllSanctions && sanctions.length > 3 && (
                <button
                  onClick={() => setShowAllSanctions(true)}
                  className="w-full p-3 text-center text-[10px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 border-t border-zinc-800 transition-colors"
                >
                  + {sanctions.length - 3} {language === 'fr' ? 'sanctions supplémentaires' : 'more sanctions'}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Sources footer */}
        <div className="pt-4 border-t border-zinc-800/50 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] font-mono text-zinc-700">
            {language === 'fr' ? 'Sources : Flux RSS, HRA News (Telegram), VahidOnline (Telegram)' : 'Sources: RSS feeds, HRA News (Telegram), VahidOnline (Telegram)'}
          </p>
          <p className="text-[9px] font-mono text-zinc-700">
            {data.rss_items_analyzed} {language === 'fr' ? 'articles' : 'items'} + {data.telegram_messages_analyzed} messages {language === 'fr' ? 'analysés' : 'analyzed'}
          </p>
        </div>
      </main>
    </div>
  );
}
