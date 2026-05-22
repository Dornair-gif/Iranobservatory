import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Activity, AlertTriangle, DollarSign, Users, Scale, 
  Shield, Wifi, WifiOff, TrendingUp, TrendingDown,
  Eye, Calendar, ExternalLink, Skull, Lock, Megaphone, Anchor, Waves, Heart
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { API } from '../config/api';

function MiniSparkline({ data, color = '#3DB883', height = 40, width = 160 }) {
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
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
    </svg>
  );
}

// Pulse animation SVG background
function PulseBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.06] pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pulse-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="1" fill="#3DB883" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pulse-grid)" />
        {[0, 1, 2].map(i => (
          <circle key={i} cx="50%" cy="50%" r="0" fill="none" stroke="#3DB883" strokeWidth="0.5" opacity="0.5">
            <animate attributeName="r" from="0" to="600" dur={`${4 + i}s`} repeatCount="indefinite" begin={`${i * 1.3}s`} />
            <animate attributeName="opacity" from="0.5" to="0" dur={`${4 + i}s`} repeatCount="indefinite" begin={`${i * 1.3}s`} />
          </circle>
        ))}
      </svg>
    </div>
  );
}

// Source clustering badge — favicons + label "draws on X sources"
function SourceFavicons({ sources, language = 'fr', size = 18 }) {
  if (!sources || sources.length === 0) return null;
  const label = language === 'fr'
    ? `${sources.length} sources vérifiées`
    : language === 'fa'
      ? `${sources.length} منبع تأیید شده`
      : `${sources.length} verified sources`;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center -space-x-1.5">
        {sources.slice(0, 4).map((s, i) => (
          <a
            key={s.url || i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.name}
            className="block bg-white border border-white/20 rounded-full overflow-hidden hover:scale-110 hover:z-10 transition-transform"
            style={{ width: size, height: size }}
          >
            <img
              src={s.favicon}
              alt={s.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </a>
        ))}
        {sources.length > 4 && (
          <span className="bg-white/10 text-white/70 text-[9px] font-mono rounded-full flex items-center justify-center" style={{ width: size, height: size }}>
            +{sources.length - 4}
          </span>
        )}
      </div>
      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// "Last updated X min ago" pill with live tick
function LastUpdatedPill({ timestamp, language = 'fr' }) {
  if (!timestamp) return <span className="text-xs font-mono text-zinc-400">LIVE</span>;
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  const diffHr = Math.floor(diffMin / 60);
  
  let label;
  if (diffMin < 1) {
    label = language === 'fr' ? "à l'instant" : language === 'fa' ? 'هم اکنون' : 'just now';
  } else if (diffMin < 60) {
    label = language === 'fr' ? `il y a ${diffMin} min` : language === 'fa' ? `${diffMin} دقیقه پیش` : `${diffMin} min ago`;
  } else if (diffHr < 24) {
    label = language === 'fr' ? `il y a ${diffHr}h` : language === 'fa' ? `${diffHr} ساعت پیش` : `${diffHr}h ago`;
  } else {
    label = date.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse" />
      <span className="text-xs font-mono text-zinc-400">
        {language === 'fr' ? 'MAJ' : language === 'fa' ? 'به‌روزرسانی' : 'UPDATED'} <span className="text-[#3DB883]">{label}</span>
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Fetch dashboard + sources once
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/dashboard/indexes`),
      axios.get(`${API}/dashboard/sources`).catch(() => ({ data: {} }))
    ]).then(([d, s]) => {
      setData(d.data);
      setSources(s.data || {});
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [refreshTick]);

  // Auto-refresh "last updated X min ago" pill every minute (no API call)
  useEffect(() => {
    const t = setInterval(() => setRefreshTick(t => t), 60_000); // tick state for re-render
    return () => clearInterval(t);
  }, []);

  // Auto refresh data every 10 minutes (in case admin runs refresh on prod)
  useEffect(() => {
    const t = setInterval(() => {
      axios.get(`${API}/dashboard/indexes`).then(r => setData(r.data)).catch(() => {});
    }, 600_000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1b2d] flex items-center justify-center">
        <div className="relative">
          <Activity className="w-12 h-12 text-[#3DB883] animate-pulse" />
          <div className="absolute inset-0 animate-ping"><Activity className="w-12 h-12 text-[#3DB883] opacity-30" /></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1b2d] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">Computing data...</p>
        </div>
      </div>
    );
  }

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
  const sectorMax = Math.max(...sectorBreakdown.map(s => (s.us_count || 0) + (s.eu_count || 0) + (s.un_count || 0)), 1);

  return (
    <div className="min-h-screen bg-[#0f1b2d] text-white" data-testid="dashboard-page">
            <SEO
        title={language === 'fr' ? 'Iran Monitor — Tableau de bord temps réel' : language === 'fa' ? 'ایران مانیتور — داشبورد لحظه‌ای' : 'Iran Monitor — Real-time intelligence dashboard'}
        description={language === 'fr'
          ? 'Tableau de bord temps réel sur l\'Iran : indice de tension, crise du détroit d\'Ormuz, sanctions, blackouts internet, droits humains. Sources vérifiées : NetBlocks, HRA, OFAC, UNSCR.'
          : language === 'fa'
            ? 'داشبورد لحظه‌ای ایران: شاخص تنش، بحران تنگه هرمز، تحریم‌ها، قطعی اینترنت، حقوق بشر. منابع تأیید شده.'
            : "Real-time intelligence dashboard on Iran: tension index, Strait of Hormuz crisis, sanctions tracker, internet blackouts, human rights. Verified sources: NetBlocks, HRA, OFAC, UNSCR."}
        url="/monitor"
        language={language}
        keywords={['Iran monitor', 'Strait of Hormuz', 'Iran sanctions tracker', 'NetBlocks Iran', 'tension index Iran']}
        breadcrumbs={[
          { name: language === 'fr' ? 'Accueil' : language === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: 'Iran Monitor', path: '/monitor' }
        ]}
      />

      {/* Header with pulse */}
      <div className="relative border-b border-white/10">
        <PulseBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-zinc-500 hover:text-[#3DB883] text-xs font-mono uppercase tracking-wider transition-colors">Iran Observatory</Link>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
                <div className="absolute inset-0 animate-ping opacity-30"><Activity className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} /></div>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter">Iran Monitor</h1>
            </div>
            <LastUpdatedPill timestamp={data.last_updated || data.updated_at} language={language} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ===== SITUATION BRIEFING ===== */}
        {data.situation_summary && (
          <section className="relative bg-[#162640] border border-[#3DB883]/30 rounded-xl p-6 lg:p-8 shadow-lg shadow-[#3DB883]/5">
            <div className="absolute top-4 right-4 w-3 h-3 bg-[#3DB883] rounded-full animate-pulse" />
            <h2 className="text-base font-mono text-[#3DB883] uppercase tracking-[0.2em] mb-5 font-black">
              {language === 'fr' ? 'Briefing de Situation' : 'Situation Briefing'}
            </h2>
            <ul className="space-y-4">
              {(Array.isArray(data.situation_summary) ? data.situation_summary : [data.situation_summary]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] text-white/90 leading-relaxed font-medium">
                  <span className="text-[#3DB883] mt-0.5 flex-shrink-0 text-xl font-black">&#8226;</span>{b}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10">
              <SourceFavicons sources={sources.tension_index} language={language} />
            </div>
          </section>
        )}

        {/* ===== ECONOMIC INDICATORS ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">{language === 'fr' ? 'Indicateurs Économiques' : 'Economic Indicators'}</h2>
            </div>
            <SourceFavicons sources={sources.economy} language={language} />
          </div>
          {econ.summary && (
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5 mb-5">
              <p className="text-base text-zinc-300 leading-relaxed">{econ.summary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {econMetrics.map((metric, i) => {
              const changePct = metric.change_pct || 0;
              const isPositive = changePct > 0;
              const changeColor = metric.label?.toLowerCase().includes('inflation') || metric.label?.toLowerCase().includes('irr') || metric.label?.toLowerCase().includes('gdp')
                ? '#ef4444' : (isPositive ? '#22c55e' : '#ef4444');
              return (
                <div key={i} className="bg-[#162640] border border-white/10 rounded-xl p-5 hover:border-[#3DB883]/30 transition-colors" data-testid={`econ-metric-${i}`}>
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 font-bold">{metric.label}</p>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-3xl font-heading font-black text-white">{metric.value}</span>
                    <div className="text-right">
                      <span className="text-lg font-mono flex items-center gap-1 font-bold" style={{ color: changeColor }}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isPositive ? '+' : ''}{changePct}%
                      </span>
                      {metric.period && <span className="text-[10px] font-mono text-zinc-500 block">{metric.period}</span>}
                    </div>
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

        {/* ===== HORMUZ CRISIS MONITORING ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Anchor className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">{language === 'fr' ? 'Crise du Détroit d\'Ormuz' : 'Strait of Hormuz Crisis'}</h2>
            </div>
            <SourceFavicons sources={sources.hormuz} language={language} />
          </div>

          {/* Key indicators row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="bg-[#162640] border border-cyan-500/20 rounded-xl p-5 text-center">
              <p className="text-4xl font-heading font-black text-cyan-400">~90%</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Réduction du trafic' : 'Traffic Reduction'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">vs 20M bpd normal capacity</p>
              <p className="text-[8px] text-zinc-600">Source: EIA / UNCTAD</p>
            </div>
            <div className="bg-[#162640] border border-red-500/20 rounded-xl p-5 text-center">
              <p className="text-4xl font-heading font-black text-red-400">2,000+</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Navires bloqués' : 'Vessels Stranded'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{language === 'fr' ? 'Deux côtés du détroit' : 'Both sides of Strait'}</p>
              <p className="text-[8px] text-zinc-600">Source: CENTCOM / Crisis Group</p>
            </div>
            <div className="bg-[#162640] border border-amber-500/20 rounded-xl p-5 text-center">
              <p className="text-4xl font-heading font-black text-amber-400">$126</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Brent pic ($/bbl)' : 'Brent Peak ($/bbl)'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">Dubai crude hit $166</p>
              <p className="text-[8px] text-zinc-600">Source: S&P Global / ICE</p>
            </div>
            <div className="bg-[#162640] border border-purple-500/20 rounded-xl p-5 text-center">
              <p className="text-4xl font-heading font-black text-purple-400">-2.9%</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Impact PIB mondial' : 'Global GDP Impact'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">Q2 2026 projection</p>
              <p className="text-[8px] text-zinc-600">Source: Dallas Fed Research</p>
            </div>
          </div>

          {/* Detailed indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Shipping & Insurance */}
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold mb-4">{language === 'fr' ? 'Maritime & Assurance' : 'Shipping & Insurance'}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Prime de risque guerre' : 'War Risk Premium'}</span>
                  <div className="text-right">
                    <span className="text-lg font-heading font-black text-red-400">0.8-5%</span>
                    <span className="text-[10px] text-zinc-500 block">{language === 'fr' ? 'de la valeur du navire' : 'of hull value'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Coût transit VLCC' : 'VLCC Transit Cost'}</span>
                  <div className="text-right">
                    <span className="text-lg font-heading font-black text-amber-400">$1.5-7.5M</span>
                    <span className="text-[10px] text-zinc-500 block">{language === 'fr' ? 'par passage (navire $150M)' : 'per transit ($150M vessel)'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Surcharge par conteneur' : 'Container Surcharge'}</span>
                  <div className="text-right">
                    <span className="text-lg font-heading font-black text-amber-400">$3,500</span>
                    <span className="text-[10px] text-zinc-500 block">{language === 'fr' ? 'par conteneur' : 'per container'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Péages exigés par l\'Iran' : 'Iran Demanded Tolls'}</span>
                  <div className="text-right">
                    <span className="text-lg font-heading font-black text-red-400">$2M</span>
                    <span className="text-[10px] text-zinc-500 block">{language === 'fr' ? 'par navire' : 'per vessel'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Reroute via Cap Bonne-Espérance' : 'Cape Reroute Added Time'}</span>
                  <div className="text-right">
                    <span className="text-lg font-heading font-black text-zinc-300">+21 days</span>
                  </div>
                </div>
              </div>
              <p className="text-[8px] font-mono text-zinc-600 mt-3">Sources: S&P Global, Lloyd's, Fairway ETA, WEF</p>
            </div>

            {/* Commodities Impact */}
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold mb-4">{language === 'fr' ? 'Impact sur les commodités mondiales' : 'Global Commodities Impact'}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Pétrole bloqué' : 'Oil Blocked'}</span>
                  <span className="text-lg font-heading font-black text-red-400">~10M bpd</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">LNG</span>
                  <span className="text-sm font-bold text-amber-400">{language === 'fr' ? 'Volumes bloqués significatifs' : 'Significant volumes blocked'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Engrais (ammoniac)' : 'Fertilizer (Ammonia)'}</span>
                  <span className="text-lg font-heading font-black text-amber-400">23%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Hélium mondial' : 'Global Helium'}</span>
                  <span className="text-lg font-heading font-black text-amber-400">33%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Soufre maritime mondial' : 'Global Seaborne Sulfur'}</span>
                  <span className="text-lg font-heading font-black text-amber-400">50%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-300">{language === 'fr' ? 'Kérosène maritime mondial' : 'Global Seaborne Jet Fuel'}</span>
                  <span className="text-lg font-heading font-black text-amber-400">20%</span>
                </div>
              </div>
              <p className="text-[8px] font-mono text-zinc-600 mt-3">Sources: UNCTAD, Atlantic Council, EIA</p>
            </div>
          </div>

          {/* Military + Project Freedom */}
          <div className="bg-[#162640] border border-cyan-500/20 rounded-xl p-5 mb-5">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold mb-4">{language === 'fr' ? 'Opérations militaires — Project Freedom' : 'Military Operations — Project Freedom'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#0f1b2d] rounded-lg">
                <p className="text-2xl font-heading font-black text-cyan-400">15,000</p>
                <p className="text-[10px] font-mono text-zinc-500">{language === 'fr' ? 'Militaires US déployés' : 'US Service Members'}</p>
              </div>
              <div className="text-center p-3 bg-[#0f1b2d] rounded-lg">
                <p className="text-2xl font-heading font-black text-cyan-400">100+</p>
                <p className="text-[10px] font-mono text-zinc-500">{language === 'fr' ? 'Avions déployés' : 'Aircraft Deployed'}</p>
              </div>
              <div className="text-center p-3 bg-[#0f1b2d] rounded-lg">
                <p className="text-2xl font-heading font-black text-red-400">51+</p>
                <p className="text-[10px] font-mono text-zinc-500">{language === 'fr' ? 'Navires redirigés' : 'Vessels Redirected'}</p>
              </div>
              <div className="text-center p-3 bg-[#0f1b2d] rounded-lg">
                <p className="text-2xl font-heading font-black text-red-400">7</p>
                <p className="text-[10px] font-mono text-zinc-500">{language === 'fr' ? 'Bateaux iraniens coulés' : 'Iranian Boats Sunk'}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              {language === 'fr'
                ? 'Les États-Unis ont lancé "Project Freedom" le 3 mai 2026 pour guider les navires neutres hors du Golfe. L\'Iran exige des péages de $2M par navire et a saisi deux navires-conteneurs. Le blocus naval US est en vigueur depuis le 13 avril.'
                : 'The US launched "Project Freedom" on May 3, 2026 to guide neutral vessels out of the Gulf. Iran demands $2M tolls per vessel and has seized two container ships. The US naval blockade has been in effect since April 13.'}
            </p>
            <p className="text-[8px] font-mono text-zinc-600">Sources: CENTCOM, Crisis Group, Pentagon/Dept of War, Reuters</p>
          </div>

          {/* External trackers */}
          <div className="flex flex-wrap gap-3">
            <a href="https://www.crisisgroup.org/trigger-list/iran-usisrael-trigger-list/flashpoints/strait-hormuz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Crisis Group — Hormuz Trigger List
            </a>
            <a href="https://www.bcaresearch.com/collection/bcas-iran-conflict-daily-dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> BCA Research — Iran Conflict Dashboard
            </a>
            <a href="https://unctad.org/publication/strait-hormuz-disruptions-implications-global-trade-and-development" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> UNCTAD — Trade Implications
            </a>
          </div>
        </section>

        {/* ===== HUMAN RIGHTS ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">{language === 'fr' ? 'Droits Humains' : 'Human Rights'}</h2>
            </div>
            <SourceFavicons sources={[...(sources.human_rights || []), ...(sources.internet_blackouts || [])]} language={language} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <div className="bg-[#162640] border border-red-500/20 rounded-xl p-5 text-center" data-testid="hr-blackout">
              <WifiOff className="w-8 h-8 text-red-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-red-500">{hri.internet_blackout_days || blackoutDays || '—'}</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Jours de coupure internet' : 'Internet Blackout Days'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.internet_source || 'NetBlocks'}</p>
              {hri.internet_connectivity && <p className="text-[10px] text-red-400 mt-1 font-bold">{hri.internet_connectivity} connectivity</p>}
              {hri.internet_detail && <p className="text-[8px] text-zinc-600 mt-1 leading-tight">{hri.internet_detail}</p>}
            </div>
            <div className="bg-[#162640] border border-amber-500/20 rounded-xl p-5 text-center" data-testid="hr-protests">
              <Megaphone className="w-8 h-8 text-amber-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-amber-400">{protests}</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Manifestations signalées' : 'Protests Reported'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{data.protests_source || 'HRA News (Jan-May 2026)'}</p>
            </div>
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5 text-center" data-testid="hr-executions">
              <Skull className="w-8 h-8 text-zinc-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-white">{hri.executions || '—'}</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Exécutions (2025)' : 'Executions (2025)'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.executions_source || 'IHR/ECPM'}</p>
              {hri.executions_detail && <p className="text-[8px] text-zinc-600 mt-1 leading-tight">{hri.executions_detail}</p>}
            </div>
            <div className="bg-[#162640] border border-purple-500/20 rounded-xl p-5 text-center" data-testid="hr-prisoners">
              <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-purple-400">{hri.political_prisoners || '—'}</p>
              <p className="text-sm text-zinc-400 mt-1">{language === 'fr' ? 'Prisonniers politiques' : 'Political Prisoners'}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.political_prisoners_source || 'HRW / HRANA'}</p>
              {hri.political_prisoners_detail && <p className="text-[8px] text-zinc-600 mt-1 leading-tight">{hri.political_prisoners_detail}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
              <span className="text-xs font-mono text-zinc-500 uppercase font-bold">{language === 'fr' ? 'Enjeux principaux' : 'Key Issues'}</span>
              <ul className="mt-3 space-y-2.5">
                {hrIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0 font-bold">&#8226;</span>{issue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2 bg-[#162640] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Timeline</span>
                <span className="text-xs font-mono text-zinc-600">HRA News / VahidOnline</span>
              </div>
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {hrTimeline.map((event, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-3 mt-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      {i < hrTimeline.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" style={{minHeight: '24px'}} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-500">{event.date}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{event.source}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SANCTIONS ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-[#3DB883]" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">{language === 'fr' ? 'Sanctions' : 'Sanctions'}</h2>
            </div>
            <SourceFavicons sources={sources.sanctions} language={language} />
          </div>
          <div className="bg-[#162640] border border-white/10 rounded-xl p-6 mb-5">
            <div className="grid grid-cols-3 gap-6 mb-5">
              <div className="text-center"><p className="text-4xl font-heading font-black text-red-400">{sanctions.us_active_count || '—'}</p><p className="text-xs font-mono text-zinc-500 mt-1">US</p></div>
              <div className="text-center"><p className="text-4xl font-heading font-black text-blue-400">{sanctions.eu_active_count || '—'}</p><p className="text-xs font-mono text-zinc-500 mt-1">EU</p></div>
              <div className="text-center"><p className="text-4xl font-heading font-black text-amber-400">{sanctions.un_active_count || '—'}</p><p className="text-xs font-mono text-zinc-500 mt-1">UN</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[10px] font-mono text-zinc-500 uppercase">Persons</span></div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-heading font-black text-red-400">{sanctions.us_persons_designated || '—'}</span><span className="text-[9px] text-zinc-600">US</span>
                  <span className="text-xl font-heading font-black text-blue-400">{sanctions.eu_persons_designated || '—'}</span><span className="text-[9px] text-zinc-600">EU</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1"><Shield className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[10px] font-mono text-zinc-500 uppercase">Entities</span></div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-heading font-black text-red-400">{sanctions.us_entities_designated || '—'}</span><span className="text-[9px] text-zinc-600">US</span>
                  <span className="text-xl font-heading font-black text-blue-400">{sanctions.eu_entities_designated || '—'}</span><span className="text-[9px] text-zinc-600">EU</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {sectorBreakdown.length > 0 && (
              <div className="bg-[#162640] border border-white/10 rounded-xl p-5" data-testid="sector-breakdown">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold">Sanctions by Sector</span>
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
                        <div className="flex items-center justify-between mb-1"><span className="text-sm text-zinc-300">{sector.sector}</span><span className="text-xs font-mono text-zinc-500 font-bold">{total}</span></div>
                        <div className="flex h-4 rounded overflow-hidden bg-white/5">
                          {sector.us_count > 0 && <div className="bg-red-500" style={{ width: `${(sector.us_count / sectorMax) * 100}%` }} />}
                          {sector.eu_count > 0 && <div className="bg-blue-500" style={{ width: `${(sector.eu_count / sectorMax) * 100}%` }} />}
                          {sector.un_count > 0 && <div className="bg-amber-500" style={{ width: `${(sector.un_count / sectorMax) * 100}%` }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {recentPackages.length > 0 && (
              <div className="bg-[#162640] border border-white/10 rounded-xl overflow-hidden" data-testid="recent-packages">
                <div className="p-4 border-b border-white/5"><span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold">Recent Sanctions Packages</span></div>
                <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                  {recentPackages.map((pkg, i) => {
                    const ic = pkg.issuer === 'US' ? 'text-red-400 bg-red-500/15 border-red-500/30' : pkg.issuer === 'EU' ? 'text-blue-400 bg-blue-500/15 border-blue-500/30' : 'text-amber-400 bg-amber-500/15 border-amber-500/30';
                    return (
                      <div key={i} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${ic}`}>{pkg.issuer}</span>
                          <span className="text-xs font-mono text-zinc-500">{pkg.date}</span>
                        </div>
                        <p className="text-sm text-zinc-200 font-medium mb-1">{pkg.title}</p>
                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
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
          <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold mb-3 block">Official Sanctions Lists</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a href="https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-red-500/20 bg-red-500/5 rounded-lg hover:bg-red-500/10 transition-colors group">
                <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-xs">US</span></div>
                <div><p className="text-sm font-bold text-zinc-200">US Treasury / OFAC</p><p className="text-[10px] text-zinc-500">Iran Sanctions</p></div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
              </a>
              <a href="https://www.consilium.europa.eu/en/policies/sanctions-against-iran/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-blue-500/20 bg-blue-500/5 rounded-lg hover:bg-blue-500/10 transition-colors group">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-xs">EU</span></div>
                <div><p className="text-sm font-bold text-zinc-200">EU Council</p><p className="text-[10px] text-zinc-500">Sanctions Against Iran</p></div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
              </a>
              <a href="https://www.un.org/securitycouncil/sanctions/1737" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg hover:bg-amber-500/10 transition-colors group">
                <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-heading font-black text-xs">UN</span></div>
                <div><p className="text-sm font-bold text-zinc-200">UN 1737 Committee</p><p className="text-[10px] text-zinc-500">Snapback</p></div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-mono text-zinc-600">Sources: IMF, World Bank, IHR/ECPM, HRW, HRANA, NetBlocks, Crisis Group, US Treasury/OFAC, EU Council, UN 1737, OPEC, FDD/UANI</p>
          <p className="text-xs font-mono text-zinc-600">{data.rss_items_analyzed} items + {data.telegram_messages_analyzed} messages</p>
        </div>

        {/* Support Banner */}
        <div className="mt-6 bg-gradient-to-r from-[#162640] via-[#1E3A5F] to-[#162640] border border-[#3DB883]/20 rounded-xl py-5 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#3DB883]/15 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4.5 h-4.5 text-[#3DB883]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-zinc-300">
              {language === 'fr' 
                ? 'Si ce briefing vous est utile, soutenez l\'indépendance de l\'Iran Observatory.'
                : 'If this briefing is useful to your work, consider supporting Iran Observatory\'s independence.'}
            </p>
          </div>
          <a href="https://www.helloasso.com/associations/dorna/formulaires/2" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2 bg-[#3DB883] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded-full flex-shrink-0 shadow-lg shadow-[#3DB883]/20">
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
            {language === 'fr' ? 'Soutenir' : 'Support us'}
          </a>
        </div>
      </main>
    </div>
  );
}
