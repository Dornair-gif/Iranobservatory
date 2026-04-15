import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, DollarSign, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown, Minus,
  Eye, ChevronDown, ChevronUp, Calendar, Fuel, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

function MiniSparkline({ data, color = '#3DB883', height = 32, width = 120 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => 
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');
  // Area fill
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon fill={color + '15'} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function tensionColor(score) {
  if (score >= 8) return '#dc2626';
  if (score >= 6) return '#d97706';
  if (score >= 4) return '#2563eb';
  return '#059669';
}

function barColor(val) {
  if (val >= 8) return '#dc2626';
  if (val >= 6) return '#d97706';
  if (val >= 4) return '#60a5fa';
  return '#86efac';
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllSanctions, setShowAllSanctions] = useState(null);

  useEffect(() => {
    axios.get(`${API}/dashboard/indexes`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Activity className="w-10 h-10 text-[#3DB883] animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">{language === 'fr' ? 'Données en cours de calcul...' : 'Computing data...'}</p>
        </div>
      </div>
    );
  }

  const ti = data.tension_index || {};
  const history = data.tension_history || [];
  const hri = data.human_rights_index || {};
  const hrTimeline = data.hr_timeline || [];
  const hrIssues = data.hr_key_issues || [];
  const blackoutDays = data.internet_blackout_days || 0;
  const protests = data.protests_reported || 0;
  const sanctions = data.sanctions_tracker || {};
  const sanctionsCategories = sanctions.categories || [];
  const sectorBreakdown = sanctions.sector_breakdown || [];
  const recentPackages = sanctions.recent_packages || [];
  const econ = data.economic_indicators || {};
  const econMetrics = econ.metrics || [];

  // Sanctions bar chart data
  const usTrend = sanctions.us_trend || [];
  const euTrend = sanctions.eu_trend || [];
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  // Category colors
  const categoryColors = { 'US': '#dc2626', 'EU': '#3b82f6', 'UN': '#d97706' };
  const categoryBg = { 'US': 'bg-red-500/10 border-red-500/20', 'EU': 'bg-blue-500/10 border-blue-500/20', 'UN': 'bg-amber-500/10 border-amber-500/20' };
  const categoryText = { 'US': 'text-red-400', 'EU': 'text-blue-400', 'UN': 'text-amber-400' };
  const categoryBadge = { 'US': 'bg-red-500/15 text-red-400', 'EU': 'bg-blue-500/15 text-blue-400', 'UN': 'bg-amber-500/15 text-amber-400' };

  // Sector chart max for scaling
  const sectorMax = Math.max(...sectorBreakdown.map(s => (s.us_count || 0) + (s.eu_count || 0) + (s.un_count || 0)), 1);

  return (
    <div className="min-h-screen bg-[#0a1628]" data-testid="dashboard-page">
      <SEO 
        title={language === 'fr' ? 'Iran Monitor' : 'Iran Monitor'}
        description="Real-time intelligence dashboard on Iran"
        url="/monitor" language={language}
      />

      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link to="/" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-wider">Iran Observatory</Link>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-[#3DB883]" strokeWidth={1.5} />
              <h1 className="font-heading font-black text-2xl tracking-tighter text-white">Iran Monitor</h1>
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

        {/* BRIEFING */}
        {data.situation_summary && (
          <section className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-6 lg:p-8">
            <h2 className="text-xs font-mono text-[#3DB883] uppercase tracking-widest mb-4 font-bold">
              {language === 'fr' ? 'Briefing' : 'Situation Briefing'}
            </h2>
            <ul className="space-y-3">
              {(Array.isArray(data.situation_summary) ? data.situation_summary : [data.situation_summary]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-zinc-200 leading-relaxed">
                  <span className="text-[#3DB883] mt-1 flex-shrink-0 text-lg">&#8226;</span>{b}
                </li>
              ))}
            </ul>
            {data.updated_context && (
              <p className="mt-4 pt-4 border-t border-zinc-700/50 text-sm text-zinc-400 leading-relaxed italic">{data.updated_context}</p>
            )}
          </section>
        )}

        {/* TENSION INDEX + HUMAN RIGHTS INDEX side by side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tension */}
          <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-6">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-5 font-bold">
              {language === 'fr' ? 'Indice de Tension Géopolitique' : 'Geopolitical Tension Index'}
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(ti.score)} strokeWidth="8" strokeDasharray={`${(ti.score / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" className="drop-shadow-lg" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-heading font-black" style={{ color: tensionColor(ti.score) }}>{ti.score}</span>
                  <span className="text-[9px] font-mono text-zinc-500">/10</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded" style={{ backgroundColor: tensionColor(ti.score) + '25', color: tensionColor(ti.score) }}>{ti.level}</span>
                <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{ti.summary}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {ti.key_drivers?.map((d, i) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800/80 text-zinc-400 text-[10px] font-mono rounded">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Human Rights Index */}
          <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-6">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-5 font-bold">
              {language === 'fr' ? 'Indice Droits Humains' : 'Human Rights Index'}
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(hri.score || 0)} strokeWidth="8" strokeDasharray={`${((hri.score || 0) / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" className="drop-shadow-lg" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-heading font-black" style={{ color: tensionColor(hri.score || 0) }}>{hri.score || '—'}</span>
                  <span className="text-[9px] font-mono text-zinc-500">/10</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded" style={{ backgroundColor: tensionColor(hri.score || 0) + '25', color: tensionColor(hri.score || 0) }}>{hri.level || '—'}</span>
                <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{hri.summary}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {hri.key_factors?.map((f, i) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800/80 text-zinc-400 text-[10px] font-mono rounded">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 30-DAY TREND */}
        <section className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Tendance de Tension — 30 Jours' : 'Tension Trend — 30 Days'}
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-red-500"></span>{language === 'fr' ? 'Critique 8+' : 'Critical 8+'}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span>{language === 'fr' ? 'Élevé 6-7' : 'Elevated 6-7'}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-full bg-blue-400"></span>{language === 'fr' ? 'Modéré 4-5' : 'Moderate 4-5'}</span>
            </div>
          </div>
          {history.length > 0 ? (
            <>
              <div className="flex items-end gap-[3px] h-40">
                {history.map((val, i) => {
                  const numVal = Number(val) || 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative" title={`Day ${i+1}: ${numVal}/10`}>
                      <div 
                        className="w-full rounded-sm transition-all hover:opacity-100 cursor-pointer"
                        style={{ 
                          height: `${Math.max((numVal / 10) * 100, 5)}%`, 
                          backgroundColor: barColor(numVal), 
                          opacity: 0.5 + (i / history.length) * 0.5 
                        }} 
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                        <span className="text-[10px] font-mono text-white bg-zinc-700 px-1.5 py-0.5 rounded shadow-lg">{numVal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-mono text-zinc-600">-30d</span>
                <span className="text-[10px] font-mono text-zinc-600">{language === 'fr' ? "Aujourd'hui" : 'Today'}</span>
              </div>
            </>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-10">{language === 'fr' ? 'Données en cours de calcul' : 'Computing trend data...'}</p>
          )}
        </section>

        {/* HUMAN RIGHTS & SOCIETY */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#7c3aed]" strokeWidth={1.5} />
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Droits Humains & Société' : 'Human Rights & Society'}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Key metrics */}
            <div className="space-y-3">
              <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                    {language === 'fr' ? 'Internet — NetBlocks Iran' : 'Internet — NetBlocks Iran'}
                  </span>
                  {blackoutDays > 0 ? <WifiOff className="w-5 h-5 text-red-500" strokeWidth={1.5} /> : <Wifi className="w-5 h-5 text-green-500" strokeWidth={1.5} />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-heading font-black text-red-500">{blackoutDays}</span>
                  <span className="text-sm text-zinc-400">{language === 'fr' ? 'jours de coupure' : 'blackout days'}</span>
                </div>
              </div>
              <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                  {language === 'fr' ? 'Manifestations signalées' : 'Protests Reported'}
                </span>
                <p className="text-4xl font-heading font-black text-amber-500 mt-2">{protests}</p>
              </div>
              <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                  {language === 'fr' ? 'Enjeux principaux' : 'Key Issues'}
                </span>
                <ul className="mt-3 space-y-2">
                  {hrIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                      <span className="text-[#7c3aed] mt-0.5 flex-shrink-0">&#8226;</span>{issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-2 border border-zinc-700/50 bg-zinc-900/70 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-700/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                  {language === 'fr' ? 'Chronologie' : 'Timeline'}
                </span>
                <span className="text-[10px] font-mono text-zinc-600">HRA News / VahidOnline</span>
              </div>
              <div className="divide-y divide-zinc-800/40 max-h-[400px] overflow-y-auto">
                {hrTimeline.map((event, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-3 mt-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
                      {i < hrTimeline.length - 1 && <div className="w-px flex-1 bg-zinc-700/50 mt-1" style={{minHeight: '20px'}} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                        <span className="text-[11px] font-mono text-zinc-400">{event.date}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{event.source}</span>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ECONOMIC INDICATORS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#d97706]" strokeWidth={1.5} />
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Indicateurs Économiques' : 'Economic Indicators'}
            </h2>
          </div>
          
          {econ.summary && (
            <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5 mb-4">
              <p className="text-sm text-zinc-300 leading-relaxed">{econ.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {econMetrics.map((metric, i) => {
              const changePct = metric.change_pct || 0;
              const isPositive = changePct > 0;
              const changeColor = metric.label?.toLowerCase().includes('inflation') || metric.label?.toLowerCase().includes('irr')
                ? (isPositive ? '#dc2626' : '#059669')
                : (isPositive ? '#059669' : '#dc2626');
              
              return (
                <div key={i} className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5 hover:border-zinc-600 transition-colors">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3 font-bold">{metric.label}</p>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-2xl font-heading font-black text-white">{metric.value}</span>
                    <span className="text-sm font-mono flex items-center gap-0.5 font-bold" style={{ color: changeColor }}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{changePct}%
                    </span>
                  </div>
                  {metric.trend_data && metric.trend_data.length > 1 && (
                    <MiniSparkline data={metric.trend_data} color={changeColor} height={32} width={180} />
                  )}
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{metric.context}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SANCTIONS TRACKER — CATEGORIZED */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-[#059669]" strokeWidth={1.5} />
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Suivi des Sanctions' : 'Sanctions Tracker'}
            </h2>
          </div>

          {/* Sanctions counts + trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Counts + Persons/Entities */}
            <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                {language === 'fr' ? 'Sanctions actives estimées' : 'Estimated Active Sanctions'}
              </span>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-heading font-black text-red-400">{sanctions.us_active_count || '—'}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mt-1">US</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-heading font-black text-blue-400">{sanctions.eu_active_count || '—'}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mt-1">EU</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-heading font-black text-amber-400">{sanctions.un_active_count || '—'}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mt-1">UN</p>
                </div>
              </div>
              {/* Persons & Entities */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-700/50">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Personnes' : 'Persons'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-heading font-black text-red-400">{sanctions.us_persons_designated || '—'}</span>
                    <span className="text-[8px] font-mono text-zinc-600">US</span>
                    <span className="text-lg font-heading font-black text-blue-400">{sanctions.eu_persons_designated || '—'}</span>
                    <span className="text-[8px] font-mono text-zinc-600">EU</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{language === 'fr' ? 'Entités' : 'Entities'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-heading font-black text-red-400">{sanctions.us_entities_designated || '—'}</span>
                    <span className="text-[8px] font-mono text-zinc-600">US</span>
                    <span className="text-lg font-heading font-black text-blue-400">{sanctions.eu_entities_designated || '—'}</span>
                    <span className="text-[8px] font-mono text-zinc-600">EU</span>
                  </div>
                </div>
              </div>
            </div>

            {/* US Sanctions Trend */}
            <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                US — {language === 'fr' ? 'Nouvelles sanctions/mois (12 mois)' : 'New sanctions/month (12 months)'}
              </span>
              <div className="flex items-end gap-1 h-20 mt-3">
                {(usTrend.length > 0 ? usTrend : [0,0,0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
                  const maxVal = Math.max(...usTrend, 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                      <div 
                        className="w-full bg-red-500/70 rounded-t hover:bg-red-500 transition-colors"
                        style={{ height: `${Math.max((val / maxVal) * 100, 3)}%` }}
                        title={`${months[i]}: ${val}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {months.map((m, i) => (
                  <span key={i} className="text-[8px] font-mono text-zinc-600 flex-1 text-center">{m}</span>
                ))}
              </div>
            </div>

            {/* EU Sanctions Trend */}
            <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                EU — {language === 'fr' ? 'Nouvelles sanctions/mois (12 mois)' : 'New sanctions/month (12 months)'}
              </span>
              <div className="flex items-end gap-1 h-20 mt-3">
                {(euTrend.length > 0 ? euTrend : [0,0,0,0,0,0,0,0,0,0,0,0]).map((val, i) => {
                  const maxVal = Math.max(...euTrend, 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div 
                        className="w-full bg-blue-500/70 rounded-t hover:bg-blue-500 transition-colors"
                        style={{ height: `${Math.max((val / maxVal) * 100, 3)}%` }}
                        title={`${months[i]}: ${val}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {months.map((m, i) => (
                  <span key={i} className="text-[8px] font-mono text-zinc-600 flex-1 text-center">{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sector Breakdown + Recent Packages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Sector Breakdown horizontal bar chart */}
            {sectorBreakdown.length > 0 && (
              <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg p-5" data-testid="sector-breakdown">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  {language === 'fr' ? 'Sanctions par Secteur' : 'Sanctions by Sector'}
                </span>
                <div className="flex gap-3 mt-2 mb-4">
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-sm bg-red-500"></span>US</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-sm bg-blue-500"></span>EU</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-500"><span className="w-2 h-2 rounded-sm bg-amber-500"></span>UN</span>
                </div>
                <div className="space-y-3">
                  {sectorBreakdown.map((sector, i) => {
                    const total = (sector.us_count || 0) + (sector.eu_count || 0) + (sector.un_count || 0);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-zinc-300">{sector.sector}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{total}</span>
                        </div>
                        <div className="flex h-4 rounded-sm overflow-hidden bg-zinc-800/50">
                          {sector.us_count > 0 && (
                            <div className="bg-red-500/80 hover:bg-red-500 transition-colors" style={{ width: `${(sector.us_count / sectorMax) * 100}%` }} title={`US: ${sector.us_count}`} />
                          )}
                          {sector.eu_count > 0 && (
                            <div className="bg-blue-500/80 hover:bg-blue-500 transition-colors" style={{ width: `${(sector.eu_count / sectorMax) * 100}%` }} title={`EU: ${sector.eu_count}`} />
                          )}
                          {sector.un_count > 0 && (
                            <div className="bg-amber-500/80 hover:bg-amber-500 transition-colors" style={{ width: `${(sector.un_count / sectorMax) * 100}%` }} title={`UN: ${sector.un_count}`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Sanctions Packages */}
            {recentPackages.length > 0 && (
              <div className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg overflow-hidden" data-testid="recent-packages">
                <div className="p-4 border-b border-zinc-700/50">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                    {language === 'fr' ? 'Derniers Paquets de Sanctions' : 'Recent Sanctions Packages'}
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/40 max-h-[380px] overflow-y-auto">
                  {recentPackages.map((pkg, i) => {
                    const issuerColor = pkg.issuer === 'US' ? 'text-red-400 bg-red-500/15' : pkg.issuer === 'EU' ? 'text-blue-400 bg-blue-500/15' : 'text-amber-400 bg-amber-500/15';
                    return (
                      <div key={i} className="px-4 py-3 hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${issuerColor}`}>{pkg.issuer}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{pkg.date}</span>
                        </div>
                        <p className="text-sm text-zinc-200 mb-1.5">{pkg.title}</p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
                          {pkg.persons_added > 0 && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" strokeWidth={1.5} /> +{pkg.persons_added} {language === 'fr' ? 'personnes' : 'persons'}</span>
                          )}
                          {pkg.entities_added > 0 && (
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" strokeWidth={1.5} /> +{pkg.entities_added} {language === 'fr' ? 'entités' : 'entities'}</span>
                          )}
                        </div>
                        {pkg.details && <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{pkg.details}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Categorized sanctions by regime */}
          <div className="space-y-4" data-testid="sanctions-categories">
            {sanctionsCategories.map((cat, catIdx) => {
              const short = cat.short || cat.regime?.split(' ')[0] || 'UN';
              const color = categoryColors[short] || '#d97706';
              const bgClass = categoryBg[short] || 'bg-amber-500/10 border-amber-500/20';
              const textClass = categoryText[short] || 'text-amber-400';
              const badgeClass = categoryBadge[short] || 'bg-amber-500/15 text-amber-400';
              const keySanctions = cat.key_sanctions || [];
              const isExpanded = showAllSanctions === catIdx;
              const sourceUrl = short === 'US' 
                ? 'https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions'
                : short === 'EU' 
                  ? 'https://www.consilium.europa.eu/en/policies/sanctions-against-iran/'
                  : 'https://www.un.org/securitycouncil/sanctions/2231';

              return (
                <div key={catIdx} className="border border-zinc-700/50 bg-zinc-900/70 rounded-lg overflow-hidden" data-testid={`sanctions-category-${short.toLowerCase()}`}>
                  {/* Category header */}
                  <div className={`p-5 border-b border-zinc-700/50 ${bgClass}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-xl font-heading font-black ${textClass}`}>{cat.regime}</span>
                        <span className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold rounded ${badgeClass}`}>
                          {keySanctions.length} {language === 'fr' ? 'mesures clés' : 'key measures'}
                        </span>
                        <a 
                          href={sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-[#3DB883] transition-colors"
                          data-testid={`source-link-${short.toLowerCase()}`}
                        >
                          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                          {language === 'fr' ? 'Source officielle' : 'Official source'}
                        </a>
                      </div>
                      <button
                        onClick={() => setShowAllSanctions(isExpanded ? null : catIdx)}
                        className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                        data-testid={`toggle-sanctions-${short.toLowerCase()}`}
                      >
                        {isExpanded ? (language === 'fr' ? 'Réduire' : 'Collapse') : (language === 'fr' ? 'Détails' : 'Details')}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{cat.description}</p>
                    )}
                  </div>

                  {/* Sanctions list — expanded */}
                  {isExpanded && (
                    <div className="divide-y divide-zinc-800/40">
                      {keySanctions.map((s, i) => (
                        <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-zinc-800/30 transition-colors">
                          <div className="flex-shrink-0 mt-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[15px] font-medium text-white">{s.name}</p>
                              <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${s.status === 'Active' ? badgeClass : 'bg-green-500/15 text-green-400'}`}>
                                {s.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Calendar className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                              <span className="text-[11px] font-mono text-zinc-400">{s.date}</span>
                              {s.target && <span className="text-[10px] font-mono text-zinc-500">| {s.target}</span>}
                            </div>
                            {s.details && <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{s.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsed preview — show first 2 */}
                  {!isExpanded && keySanctions.length > 0 && (
                    <div className="divide-y divide-zinc-800/40">
                      {keySanctions.slice(0, 2).map((s, i) => (
                        <div key={i} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm text-zinc-300 truncate flex-1">{s.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0">{s.date}</span>
                        </div>
                      ))}
                      {keySanctions.length > 2 && (
                        <button 
                          onClick={() => setShowAllSanctions(catIdx)} 
                          className="w-full p-3 text-center text-[10px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                        >
                          + {keySanctions.length - 2} {language === 'fr' ? 'autres mesures' : 'more measures'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-700/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-mono text-zinc-500">Sources:</p>
            <a href="https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-zinc-500 hover:text-[#3DB883] transition-colors flex items-center gap-1">US Treasury/OFAC <ExternalLink className="w-2.5 h-2.5" /></a>
            <a href="https://www.consilium.europa.eu/en/policies/sanctions-against-iran/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-zinc-500 hover:text-[#3DB883] transition-colors flex items-center gap-1">EU Council <ExternalLink className="w-2.5 h-2.5" /></a>
            <a href="https://www.un.org/securitycouncil/sanctions/2231" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-zinc-500 hover:text-[#3DB883] transition-colors flex items-center gap-1">UN/UNSCR 2231 <ExternalLink className="w-2.5 h-2.5" /></a>
            <span className="text-[10px] font-mono text-zinc-600">| RSS, HRA News, VahidOnline, NetBlocks</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500">{data.rss_items_analyzed} items + {data.telegram_messages_analyzed} messages</p>
        </div>
      </main>
    </div>
  );
}
