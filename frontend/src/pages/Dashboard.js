import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, DollarSign, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown,
  Eye, Calendar, ExternalLink, Skull, Lock, Megaphone
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

function MiniSparkline({ data, color = '#1E3A5F', height = 40, width = 160 }) {
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
      <polygon fill={color + '12'} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
    </svg>
  );
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
          <p className="text-zinc-500 text-lg">{language === 'fr' ? 'Données en cours de calcul...' : 'Computing data...'}</p>
        </div>
      </div>
    );
  }

  const hrTimeline = data.hr_timeline || [];
  const hrIssues = data.hr_key_issues || [];
  const blackoutDays = data.internet_blackout_days || 0;
  const protests = data.protests_reported || 0;
  const hri = data.human_rights_index || {};
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
              <Activity className="w-3.5 h-3.5 text-[#3DB883] animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">
                {data.updated_at ? new Date(data.updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* BRIEFING */}
        {data.situation_summary && (
          <section className="bg-white border border-zinc-200 rounded-xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-sm font-mono text-[#1E3A5F] uppercase tracking-widest mb-5 font-bold">
              {language === 'fr' ? 'Briefing' : 'Situation Briefing'}
            </h2>
            <ul className="space-y-3">
              {(Array.isArray(data.situation_summary) ? data.situation_summary : [data.situation_summary]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] text-zinc-700 leading-relaxed">
                  <span className="text-[#1E3A5F] mt-0.5 flex-shrink-0 text-xl font-bold">&#8226;</span>{b}
                </li>
              ))}
            </ul>
            {data.updated_context && (
              <p className="mt-5 pt-5 border-t border-zinc-100 text-base text-zinc-500 leading-relaxed italic">{data.updated_context}</p>
            )}
          </section>
        )}

        {/* ============ ECONOMIC INDICATORS ============ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-xl text-[#1E3A5F] tracking-tight">
                {language === 'fr' ? 'Indicateurs Économiques' : 'Economic Indicators'}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">Sources: IMF, World Bank, OPEC</span>
          </div>

          {econ.summary && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-5 shadow-sm">
              <p className="text-[17px] text-zinc-600 leading-relaxed">{econ.summary}</p>
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
                <div key={i} className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow shadow-sm" data-testid={`econ-metric-${i}`}>
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 font-bold">{metric.label}</p>
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-4xl font-heading font-black text-[#1E3A5F]">{metric.value}</span>
                    <div className="text-right">
                      <span className="text-lg font-mono flex items-center gap-1 font-bold" style={{ color: changeColor }}>
                        {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {isPositive ? '+' : ''}{changePct}%
                      </span>
                      {metric.period && <span className="text-xs font-mono text-zinc-400 block">{metric.period}</span>}
                    </div>
                  </div>
                  {metric.trend_data && metric.trend_data.length > 1 && (
                    <MiniSparkline data={metric.trend_data} color={changeColor} height={40} width={220} />
                  )}
                  <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{metric.context}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ HUMAN RIGHTS — REAL FIGURES ============ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
            <h2 className="font-heading font-black text-xl text-[#1E3A5F] tracking-tight">
              {language === 'fr' ? 'Droits Humains' : 'Human Rights'}
            </h2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-center" data-testid="hr-blackout">
              <WifiOff className="w-8 h-8 text-red-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-5xl font-heading font-black text-red-600">{blackoutDays}</p>
              <p className="text-sm text-zinc-500 mt-1">{language === 'fr' ? 'Jours de coupure internet' : 'Internet Blackout Days'}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-1">NetBlocks</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-center" data-testid="hr-protests">
              <Megaphone className="w-8 h-8 text-amber-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-5xl font-heading font-black text-amber-600">{protests}</p>
              <p className="text-sm text-zinc-500 mt-1">{language === 'fr' ? 'Manifestations signalées' : 'Protests Reported'}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-1">HRA News / VahidOnline</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-center" data-testid="hr-executions">
              <Skull className="w-8 h-8 text-zinc-800 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-5xl font-heading font-black text-zinc-900">{hri.executions || '—'}</p>
              <p className="text-sm text-zinc-500 mt-1">{language === 'fr' ? 'Exécutions (2025)' : 'Executions (2025)'}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-1">{hri.executions_source || 'IHR/ECPM'}</p>
              {hri.executions_detail && <p className="text-[9px] text-zinc-400 mt-1 leading-tight">{hri.executions_detail}</p>}
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-center" data-testid="hr-prisoners">
              <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-5xl font-heading font-black text-purple-700">{hri.political_prisoners || '—'}</p>
              <p className="text-sm text-zinc-500 mt-1">{language === 'fr' ? 'Prisonniers politiques' : 'Political Prisoners'}</p>
              <p className="text-[10px] font-mono text-zinc-400 mt-1">{hri.political_prisoners_source || 'HRW / HRANA'}</p>
              {hri.political_prisoners_detail && <p className="text-[9px] text-zinc-400 mt-1 leading-tight">{hri.political_prisoners_detail}</p>}
            </div>
          </div>

          {/* Key Issues + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <span className="text-xs font-mono text-zinc-400 uppercase font-bold">{language === 'fr' ? 'Enjeux principaux' : 'Key Issues'}</span>
              <ul className="mt-3 space-y-2.5">
                {hrIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-zinc-600 leading-relaxed">
                    <span className="text-purple-600 mt-0.5 flex-shrink-0 font-bold">&#8226;</span>{issue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">{language === 'fr' ? 'Chronologie' : 'Timeline'}</span>
                <span className="text-xs font-mono text-zinc-400">HRA News / VahidOnline</span>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
                {hrTimeline.map((event, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-3 mt-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      {i < hrTimeline.length - 1 && <div className="w-px flex-1 bg-zinc-200 mt-1" style={{minHeight: '24px'}} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
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

        {/* ============ SANCTIONS TRACKER ============ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Scale className="w-6 h-6 text-[#1E3A5F]" strokeWidth={1.5} />
            <h2 className="font-heading font-black text-xl text-[#1E3A5F] tracking-tight">
              {language === 'fr' ? 'Sanctions' : 'Sanctions'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-5 mb-5">
            {/* Counts + Persons/Entities */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
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
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-zinc-400" /><span className="text-[10px] font-mono text-zinc-400 uppercase">Persons</span></div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-heading font-black text-red-600">{sanctions.us_persons_designated || '—'}</span>
                    <span className="text-[9px] text-zinc-400">US</span>
                    <span className="text-xl font-heading font-black text-blue-600">{sanctions.eu_persons_designated || '—'}</span>
                    <span className="text-[9px] text-zinc-400">EU</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1"><Shield className="w-3.5 h-3.5 text-zinc-400" /><span className="text-[10px] font-mono text-zinc-400 uppercase">Entities</span></div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-heading font-black text-red-600">{sanctions.us_entities_designated || '—'}</span>
                    <span className="text-[9px] text-zinc-400">US</span>
                    <span className="text-xl font-heading font-black text-blue-600">{sanctions.eu_entities_designated || '—'}</span>
                    <span className="text-[9px] text-zinc-400">EU</span>
                  </div>
                </div>
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
                          {sector.us_count > 0 && <div className="bg-red-500" style={{ width: `${(sector.us_count / sectorMax) * 100}%` }} title={`US: ${sector.us_count}`} />}
                          {sector.eu_count > 0 && <div className="bg-blue-500" style={{ width: `${(sector.eu_count / sectorMax) * 100}%` }} title={`EU: ${sector.eu_count}`} />}
                          {sector.un_count > 0 && <div className="bg-amber-500" style={{ width: `${(sector.un_count / sectorMax) * 100}%` }} title={`UN: ${sector.un_count}`} />}
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
                    const ic = pkg.issuer === 'US' ? 'text-red-600 bg-red-50 border-red-200' : pkg.issuer === 'EU' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                    return (
                      <div key={i} className="px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${ic}`}>{pkg.issuer}</span>
                          <span className="text-xs font-mono text-zinc-400">{pkg.date}</span>
                        </div>
                        <p className="text-sm text-zinc-800 font-medium mb-1">{pkg.title}</p>
                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                          {pkg.persons_added > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> +{pkg.persons_added}</span>}
                          {pkg.entities_added > 0 && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> +{pkg.entities_added}</span>}
                        </div>
                        {pkg.details && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{pkg.details}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Source Links */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-3 block">Official Sanctions Lists</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a href="https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-us">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-sm">US</span></div>
                <div className="flex-1"><p className="text-sm font-bold text-zinc-800 group-hover:text-red-700">US Treasury / OFAC</p><p className="text-xs text-zinc-500">Iran Sanctions Programs</p></div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-red-600" />
              </a>
              <a href="https://www.consilium.europa.eu/en/policies/sanctions-against-iran/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-eu">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-sm">EU</span></div>
                <div className="flex-1"><p className="text-sm font-bold text-zinc-800 group-hover:text-blue-700">EU Council</p><p className="text-xs text-zinc-500">Sanctions Against Iran</p></div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-blue-600" />
              </a>
              <a href="https://www.un.org/securitycouncil/sanctions/2231" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-lg hover:shadow-md transition-shadow group" data-testid="source-link-un">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-sm">UN</span></div>
                <div className="flex-1"><p className="text-sm font-bold text-zinc-800 group-hover:text-amber-700">UN Security Council</p><p className="text-xs text-zinc-500">UNSCR 2231 Snapback</p></div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-amber-600" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-mono text-zinc-400">Sources: IMF, World Bank, IHR/ECPM, HRW, HRANA, US Treasury/OFAC, EU Council, UNSCR 2231, NetBlocks</p>
          <p className="text-xs font-mono text-zinc-400">{data.rss_items_analyzed} items + {data.telegram_messages_analyzed} messages</p>
        </div>
      </main>
    </div>
  );
}
