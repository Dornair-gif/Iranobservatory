import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, DollarSign, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown,
  Eye, ChevronDown, ChevronUp, Calendar, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

function MiniSparkline({ data, color = '#1E3A5F', height = 36, width = 140 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => 
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon fill={color + '15'} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
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
  if (val >= 4) return '#3b82f6';
  return '#86efac';
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/dashboard/indexes`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <Activity className="w-10 h-10 text-[#1E3A5F] animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-500 text-base">{language === 'fr' ? 'Données en cours de calcul...' : 'Computing data...'}</p>
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
  const sectorBreakdown = sanctions.sector_breakdown || [];
  const recentPackages = sanctions.recent_packages || [];
  const econ = data.economic_indicators || {};
  const econMetrics = econ.metrics || [];
  const usTrend = sanctions.us_trend || [];
  const euTrend = sanctions.eu_trend || [];
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const sectorMax = Math.max(...sectorBreakdown.map(s => (s.us_count || 0) + (s.eu_count || 0) + (s.un_count || 0)), 1);

  return (
    <div className="min-h-screen bg-[#f8f9fb]" data-testid="dashboard-page">
      <SEO 
        title="Iran Monitor"
        description="Real-time intelligence dashboard on Iran"
        url="/monitor" language={language}
      />

      {/* Header */}
      <div className="bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link to="/" className="text-zinc-400 hover:text-[#1E3A5F] text-xs font-mono uppercase tracking-wider">Iran Observatory</Link>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <Eye className="w-7 h-7 text-[#1E3A5F]" strokeWidth={1.5} />
              <h1 className="font-heading font-black text-3xl tracking-tighter text-[#1E3A5F]">Iran Monitor</h1>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#3DB883] animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">
                {data.updated_at ? new Date(data.updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* BRIEFING */}
        {data.situation_summary && (
          <section className="bg-white border border-zinc-200 rounded-xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-sm font-mono text-[#1E3A5F] uppercase tracking-widest mb-4 font-bold">
              {language === 'fr' ? 'Briefing' : 'Situation Briefing'}
            </h2>
            <ul className="space-y-3">
              {(Array.isArray(data.situation_summary) ? data.situation_summary : [data.situation_summary]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-zinc-700 leading-relaxed">
                  <span className="text-[#1E3A5F] mt-1 flex-shrink-0 text-lg font-bold">&#8226;</span>{b}
                </li>
              ))}
            </ul>
            {data.updated_context && (
              <p className="mt-5 pt-5 border-t border-zinc-100 text-sm text-zinc-500 leading-relaxed italic">{data.updated_context}</p>
            )}
          </section>
        )}

        {/* TENSION + HR INDEX */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tension Index */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-5 font-bold">
              {language === 'fr' ? 'Indice de Tension Géopolitique' : 'Geopolitical Tension Index'}
            </h3>
            <div className="flex items-center gap-8">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(ti.score)} strokeWidth="10" strokeDasharray={`${(ti.score / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-heading font-black" style={{ color: tensionColor(ti.score) }}>{ti.score}</span>
                  <span className="text-xs font-mono text-zinc-400">/10</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider font-bold rounded-full" style={{ backgroundColor: tensionColor(ti.score) + '15', color: tensionColor(ti.score) }}>{ti.level}</span>
                <p className="text-base text-zinc-600 mt-3 leading-relaxed">{ti.summary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ti.key_drivers?.map((d, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-mono rounded-full">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Human Rights Index */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-5 font-bold">
              {language === 'fr' ? 'Indice Droits Humains' : 'Human Rights Index'}
            </h3>
            <div className="flex items-center gap-8">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor(hri.score || 0)} strokeWidth="10" strokeDasharray={`${((hri.score || 0) / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-heading font-black" style={{ color: tensionColor(hri.score || 0) }}>{hri.score || '—'}</span>
                  <span className="text-xs font-mono text-zinc-400">/10</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider font-bold rounded-full" style={{ backgroundColor: tensionColor(hri.score || 0) + '15', color: tensionColor(hri.score || 0) }}>{hri.level || '—'}</span>
                <p className="text-base text-zinc-600 mt-3 leading-relaxed">{hri.summary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {hri.key_factors?.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-mono rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 30-DAY TREND */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Tendance de Tension — 30 Jours' : 'Tension Trend — 30 Days'}
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Critical 8+</span>
              <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Elevated 6-7</span>
              <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>Moderate 4-5</span>
            </div>
          </div>
          {history.length > 0 ? (
            <>
              <div className="flex items-end gap-[3px] h-44">
                {history.map((val, i) => {
                  const numVal = Number(val) || 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative cursor-pointer">
                      <div 
                        className="w-full rounded-sm transition-all hover:opacity-100"
                        style={{ height: `${Math.max((numVal / 10) * 100, 5)}%`, backgroundColor: barColor(numVal), opacity: 0.5 + (i / history.length) * 0.5 }} 
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                        <span className="text-xs font-mono text-white bg-zinc-800 px-2 py-0.5 rounded shadow-lg">{numVal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs font-mono text-zinc-400">-30d</span>
                <span className="text-xs font-mono text-zinc-400">{language === 'fr' ? "Aujourd'hui" : 'Today'}</span>
              </div>
            </>
          ) : (
            <p className="text-zinc-400 text-base text-center py-12">Computing trend data...</p>
          )}
        </section>

        {/* HUMAN RIGHTS & SOCIETY */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Droits Humains & Société' : 'Human Rights & Society'}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-zinc-400 uppercase font-bold">Internet — NetBlocks</span>
                  {blackoutDays > 0 ? <WifiOff className="w-5 h-5 text-red-500" /> : <Wifi className="w-5 h-5 text-green-500" />}
                </div>
                <span className="text-5xl font-heading font-black text-red-600">{blackoutDays}</span>
                <span className="text-base text-zinc-500 ml-2">{language === 'fr' ? 'jours de coupure' : 'blackout days'}</span>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs font-mono text-zinc-400 uppercase font-bold">Protests Reported</span>
                <p className="text-5xl font-heading font-black text-amber-600 mt-2">{protests}</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs font-mono text-zinc-400 uppercase font-bold">Key Issues</span>
                <ul className="mt-3 space-y-2">
                  {hrIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 leading-relaxed">
                      <span className="text-purple-600 mt-0.5 flex-shrink-0 font-bold">&#8226;</span>{issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">Timeline</span>
                <span className="text-xs font-mono text-zinc-400">HRA News / VahidOnline</span>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[420px] overflow-y-auto">
                {hrTimeline.map((event, i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-3 mt-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      {i < hrTimeline.length - 1 && <div className="w-px flex-1 bg-zinc-200 mt-1" style={{minHeight: '24px'}} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                        <span className="text-xs font-mono text-zinc-500">{event.date}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{event.source}</span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ECONOMIC INDICATORS */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                {language === 'fr' ? 'Indicateurs Économiques' : 'Economic Indicators'}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {language === 'fr' ? 'Sources: CBI, TGJU, OPEC, ISC' : 'Sources: CBI, TGJU, OPEC, ISC'}
            </span>
          </div>
          {econ.summary && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-5 shadow-sm">
              <p className="text-base text-zinc-600 leading-relaxed">{econ.summary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {econMetrics.map((metric, i) => {
              const changePct = metric.change_pct || 0;
              const isPositive = changePct > 0;
              const changeColor = metric.label?.toLowerCase().includes('inflation') || metric.label?.toLowerCase().includes('irr')
                ? (isPositive ? '#dc2626' : '#059669')
                : (isPositive ? '#059669' : '#dc2626');
              return (
                <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-shadow shadow-sm">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3 font-bold">{metric.label}</p>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-3xl font-heading font-black text-[#1E3A5F]">{metric.value}</span>
                    <span className="text-sm font-mono flex items-center gap-0.5 font-bold" style={{ color: changeColor }}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {isPositive ? '+' : ''}{changePct}%
                      {metric.period && <span className="text-[10px] text-zinc-400 ml-1">{metric.period}</span>}
                    </span>
                  </div>
                  {metric.trend_data && metric.trend_data.length > 1 && (
                    <MiniSparkline data={metric.trend_data} color={changeColor} height={36} width={200} />
                  )}
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{metric.context}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SANCTIONS TRACKER */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Scale className="w-5 h-5 text-[#1E3A5F]" strokeWidth={1.5} />
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              {language === 'fr' ? 'Suivi des Sanctions' : 'Sanctions Tracker'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Counts + Persons/Entities */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">Active Sanctions</span>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <p className="text-4xl font-heading font-black text-red-600">{sanctions.us_active_count || '—'}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">US</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-heading font-black text-blue-600">{sanctions.eu_active_count || '—'}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">EU</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-heading font-black text-amber-600">{sanctions.un_active_count || '—'}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">UN</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-100">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Persons</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-heading font-black text-red-600">{sanctions.us_persons_designated || '—'}</span>
                    <span className="text-[9px] font-mono text-zinc-400">US</span>
                    <span className="text-xl font-heading font-black text-blue-600">{sanctions.eu_persons_designated || '—'}</span>
                    <span className="text-[9px] font-mono text-zinc-400">EU</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Entities</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-heading font-black text-red-600">{sanctions.us_entities_designated || '—'}</span>
                    <span className="text-[9px] font-mono text-zinc-400">US</span>
                    <span className="text-xl font-heading font-black text-blue-600">{sanctions.eu_entities_designated || '—'}</span>
                    <span className="text-[9px] font-mono text-zinc-400">EU</span>
                  </div>
                </div>
              </div>
            </div>

            {/* US Trend */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">US — New/month (12mo)</span>
              <div className="flex items-end gap-1 h-24 mt-3">
                {(usTrend.length > 0 ? usTrend : Array(12).fill(0)).map((val, i) => {
                  const maxVal = Math.max(...usTrend, 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="w-full bg-red-500 rounded-t hover:bg-red-600 transition-colors" style={{ height: `${Math.max((val / maxVal) * 100, 3)}%`, opacity: 0.7 }} title={`${months[i]}: ${val}`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {months.map((m, i) => (<span key={i} className="text-[9px] font-mono text-zinc-400 flex-1 text-center">{m}</span>))}
              </div>
            </div>

            {/* EU Trend */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">EU — New/month (12mo)</span>
              <div className="flex items-end gap-1 h-24 mt-3">
                {(euTrend.length > 0 ? euTrend : Array(12).fill(0)).map((val, i) => {
                  const maxVal = Math.max(...euTrend, 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{ height: `${Math.max((val / maxVal) * 100, 3)}%`, opacity: 0.7 }} title={`${months[i]}: ${val}`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {months.map((m, i) => (<span key={i} className="text-[9px] font-mono text-zinc-400 flex-1 text-center">{m}</span>))}
              </div>
            </div>
          </div>

          {/* Sector Breakdown + Recent Packages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {sectorBreakdown.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm" data-testid="sector-breakdown">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">Sanctions by Sector</span>
                <div className="flex gap-3 mt-2 mb-4">
                  <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>US</span>
                  <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>EU</span>
                  <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>UN</span>
                </div>
                <div className="space-y-3">
                  {sectorBreakdown.map((sector, i) => {
                    const total = (sector.us_count || 0) + (sector.eu_count || 0) + (sector.un_count || 0);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-700">{sector.sector}</span>
                          <span className="text-xs font-mono text-zinc-400 font-bold">{total}</span>
                        </div>
                        <div className="flex h-5 rounded overflow-hidden bg-zinc-100">
                          {sector.us_count > 0 && <div className="bg-red-500 hover:bg-red-600 transition-colors" style={{ width: `${(sector.us_count / sectorMax) * 100}%` }} title={`US: ${sector.us_count}`} />}
                          {sector.eu_count > 0 && <div className="bg-blue-500 hover:bg-blue-600 transition-colors" style={{ width: `${(sector.eu_count / sectorMax) * 100}%` }} title={`EU: ${sector.eu_count}`} />}
                          {sector.un_count > 0 && <div className="bg-amber-500 hover:bg-amber-600 transition-colors" style={{ width: `${(sector.un_count / sectorMax) * 100}%` }} title={`UN: ${sector.un_count}`} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {recentPackages.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm" data-testid="recent-packages">
                <div className="p-4 border-b border-zinc-100">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">Recent Sanctions Packages</span>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[420px] overflow-y-auto">
                  {recentPackages.map((pkg, i) => {
                    const issuerColor = pkg.issuer === 'US' ? 'text-red-600 bg-red-50 border-red-200' : pkg.issuer === 'EU' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                    return (
                      <div key={i} className="px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${issuerColor}`}>{pkg.issuer}</span>
                          <span className="text-xs font-mono text-zinc-400">{pkg.date}</span>
                        </div>
                        <p className="text-sm text-zinc-800 font-medium mb-1">{pkg.title}</p>
                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                          {pkg.persons_added > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> +{pkg.persons_added} persons</span>}
                          {pkg.entities_added > 0 && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> +{pkg.entities_added} entities</span>}
                        </div>
                        {pkg.details && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{pkg.details}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Official Source Links */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-3 block">
              {language === 'fr' ? 'Listes officielles de sanctions' : 'Official Sanctions Lists'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a href="https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-us">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-heading font-black text-sm">US</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-red-700 transition-colors">US Treasury / OFAC</p>
                  <p className="text-xs text-zinc-500">Iran Sanctions Programs</p>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-red-600 transition-colors" />
              </a>
              <a href="https://www.consilium.europa.eu/en/policies/sanctions-against-iran/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-eu">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-heading font-black text-sm">EU</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-blue-700 transition-colors">EU Council</p>
                  <p className="text-xs text-zinc-500">Sanctions Against Iran</p>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
              </a>
              <a href="https://www.un.org/securitycouncil/sanctions/2231" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-un">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-heading font-black text-sm">UN</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-amber-700 transition-colors">UN Security Council</p>
                  <p className="text-xs text-zinc-500">UNSCR 2231 Snapback</p>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-colors" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-mono text-zinc-400">Sources: US Treasury/OFAC, EU Council, UN/UNSCR 2231, RSS, HRA News, VahidOnline, NetBlocks, CBI, TGJU, OPEC</p>
          <p className="text-xs font-mono text-zinc-400">{data.rss_items_analyzed} items + {data.telegram_messages_analyzed} messages analyzed</p>
        </div>
      </main>
    </div>
  );
}
