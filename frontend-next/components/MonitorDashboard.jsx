"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, DollarSign, Users, Scale,
  Shield, WifiOff, TrendingUp, TrendingDown,
  Calendar, ExternalLink, Skull, Lock, Megaphone, Anchor, Heart,
} from "lucide-react";

// Monitor dashboard — ported verbatim from the React SPA so all the
// hand-tuned Hormuz / sanctions / human-rights cards keep working.
// All metric data comes from /api/dashboard/indexes (refreshed every 10min).

function MiniSparkline({ data, color = "#3DB883", height = 80, width = 280 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 8) - 4}`)
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={0}
          y1={height * t}
          x2={width}
          y2={height * t}
          stroke="#ffffff"
          strokeOpacity="0.06"
          strokeDasharray="3 3"
        />
      ))}
      <polygon fill={color + "22"} points={area} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
      {/* Data points */}
      {data.map((v, i) => {
        const cx = i * stepX;
        const cy = height - ((v - min) / range) * (height - 8) - 4;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3" fill={color} />
            {(i === 0 || i === data.length - 1) && (
              <text
                x={i === 0 ? cx + 6 : cx - 6}
                y={cy - 8}
                textAnchor={i === 0 ? "start" : "end"}
                fill={color}
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                fontWeight="bold"
              >
                {typeof v === "number" ? v.toLocaleString() : v}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

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
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="50%" cy="50%" r="0" fill="none" stroke="#3DB883" strokeWidth="0.5" opacity="0.5">
            <animate attributeName="r" from="0" to="600" dur={`${4 + i}s`} repeatCount="indefinite" begin={`${i * 1.3}s`} />
            <animate attributeName="opacity" from="0.5" to="0" dur={`${4 + i}s`} repeatCount="indefinite" begin={`${i * 1.3}s`} />
          </circle>
        ))}
      </svg>
    </div>
  );
}

function SourceFavicons({ sources, lang = "fr", size = 18 }) {
  if (!sources || sources.length === 0) return null;
  const label = lang === "fr"
    ? `${sources.length} sources vérifiées`
    : lang === "fa"
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
            <img src={s.favicon} alt={s.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
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

function LastUpdatedPill({ timestamp, lang = "fr" }) {
  if (!timestamp) return <span className="text-xs font-mono text-zinc-400">LIVE</span>;
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  const diffHr = Math.floor(diffMin / 60);
  let label;
  if (diffMin < 1) label = lang === "fr" ? "à l'instant" : lang === "fa" ? "هم اکنون" : "just now";
  else if (diffMin < 60) label = lang === "fr" ? `il y a ${diffMin} min` : lang === "fa" ? `${diffMin} دقیقه پیش` : `${diffMin} min ago`;
  else if (diffHr < 24) label = lang === "fr" ? `il y a ${diffHr}h` : lang === "fa" ? `${diffHr} ساعت پیش` : `${diffHr}h ago`;
  else label = date.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse" />
      <span className="text-xs font-mono text-zinc-400">
        {lang === "fr" ? "MAJ" : lang === "fa" ? "به‌روزرسانی" : "UPDATED"} <span className="text-[#3DB883]">{label}</span>
      </span>
    </div>
  );
}

export function MonitorDashboard({ lang }) {
  const [data, setData] = useState(null);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/indexes").then((r) => r.json()),
      fetch("/api/dashboard/sources").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([d, s]) => { setData(d); setSources(s || {}); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Tick every minute to refresh "X min ago" pill, plus refetch every 10min
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      fetch("/api/dashboard/indexes").then((r) => r.json()).then(setData).catch(() => {});
    }, 600_000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1b2d] flex items-center justify-center">
        <div className="relative">
          <Activity className="w-12 h-12 text-[#3DB883] animate-pulse" />
          <div className="absolute inset-0 animate-ping">
            <Activity className="w-12 h-12 text-[#3DB883] opacity-30" />
          </div>
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
  const sectorMax = Math.max(...sectorBreakdown.map((s) => (s.us_count || 0) + (s.eu_count || 0) + (s.un_count || 0)), 1);

  return (
    <div className="min-h-screen bg-[#0f1b2d] text-white" data-testid="dashboard-page">
      <div className="relative border-b border-white/10">
        <PulseBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/${lang}`} className="text-zinc-500 hover:text-[#3DB883] text-xs font-mono uppercase tracking-wider transition-colors">
            Iran Observatory
          </Link>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
                <div className="absolute inset-0 animate-ping opacity-30">
                  <Activity className="w-8 h-8 text-[#3DB883]" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter">Iran Monitor</h1>
            </div>
            <LastUpdatedPill timestamp={data.last_updated || data.updated_at} lang={lang} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ===== SITUATION BRIEFING ===== */}
        {(data[`situation_summary_${lang}`] || data.situation_summary) && (
          <section className="relative bg-[#162640] border border-[#3DB883]/30 rounded-xl p-6 lg:p-8 shadow-lg shadow-[#3DB883]/5">
            <div className="absolute top-4 right-4 w-3 h-3 bg-[#3DB883] rounded-full animate-pulse" />
            <h2 className="text-base font-mono text-[#3DB883] uppercase tracking-[0.2em] mb-5 font-black">
              {lang === "fr" ? "Briefing de Situation" : lang === "fa" ? "بریفینگ موقعیت" : "Situation Briefing"}
            </h2>
            <ul className="space-y-4">
              {(() => {
                const localized = data[`situation_summary_${lang}`];
                const fallback = data.situation_summary;
                const raw = localized || fallback;
                const arr = Array.isArray(raw) ? raw : [raw];
                return arr.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-[17px] text-white/90 leading-relaxed font-medium">
                    <span className="text-[#3DB883] mt-0.5 flex-shrink-0 text-xl font-black">•</span>{b}
                  </li>
                ));
              })()}
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10">
              <SourceFavicons sources={sources.tension_index} lang={lang} />
            </div>
          </section>
        )}

        {/* ===== ECONOMIC INDICATORS ===== */}
        {econMetrics.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
                <h2 className="font-heading font-black text-2xl tracking-tight">
                  {lang === "fr" ? "Indicateurs Économiques" : lang === "fa" ? "شاخص‌های اقتصادی" : "Economic Indicators"}
                </h2>
              </div>
              <SourceFavicons sources={sources.economy} lang={lang} />
            </div>
            {econ.summary && (
              <div className="bg-[#162640] border border-white/10 rounded-xl p-5 mb-5">
                <p className="text-base text-zinc-300 leading-relaxed">{econ.summary}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {econMetrics.map((m, i) => {
                const c = m.change_pct || 0;
                const isPos = c > 0;
                const cc = m.label?.toLowerCase().includes("inflation") || m.label?.toLowerCase().includes("irr") || m.label?.toLowerCase().includes("gdp")
                  ? "#ef4444" : (isPos ? "#22c55e" : "#ef4444");
                return (
                  <div key={i} className="bg-[#162640] border border-white/10 rounded-xl p-5 hover:border-[#3DB883]/30 transition-colors" data-testid={`econ-metric-${i}`}>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 font-bold">{m.label}</p>
                    <div className="flex items-end justify-between mb-3">
                      <span className="text-3xl font-heading font-black text-white">{m.value}</span>
                      <div className="text-right">
                        <span className="text-lg font-mono flex items-center gap-1 font-bold" style={{ color: cc }}>
                          {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPos ? "+" : ""}{c}%
                        </span>
                        {m.period && <span className="text-[10px] font-mono text-zinc-500 block">{m.period}</span>}
                      </div>
                    </div>
                    {m.trend_data && m.trend_data.length > 1 && (
                      <MiniSparkline data={m.trend_data} color={cc} height={80} width={400} />
                    )}
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{m.context}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== HORMUZ CRISIS ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Anchor className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">
                {lang === "fr" ? "Crise du Détroit d'Ormuz" : lang === "fa" ? "بحران تنگه هرمز" : "Strait of Hormuz Crisis"}
              </h2>
            </div>
            <SourceFavicons sources={sources.hormuz} lang={lang} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { v: "~90%", color: "cyan", label: lang === "fr" ? "Réduction du trafic" : "Traffic Reduction", sub: "vs 20M bpd capacity", src: "EIA / UNCTAD" },
              { v: "2,000+", color: "red", label: lang === "fr" ? "Navires bloqués" : "Vessels Stranded", sub: lang === "fr" ? "Deux côtés du détroit" : "Both sides of Strait", src: "CENTCOM / Crisis Group" },
              { v: "$126", color: "amber", label: lang === "fr" ? "Brent pic ($/bbl)" : "Brent Peak ($/bbl)", sub: "Dubai crude hit $166", src: "S&P Global / ICE" },
              { v: "-2.9%", color: "purple", label: lang === "fr" ? "Impact PIB mondial" : "Global GDP Impact", sub: "Q2 2026 projection", src: "Dallas Fed Research" },
            ].map((k, i) => (
              <div key={i} className={`bg-[#162640] border border-${k.color}-500/20 rounded-xl p-5 text-center`}>
                <p className={`text-4xl font-heading font-black text-${k.color}-400`}>{k.v}</p>
                <p className="text-sm text-zinc-400 mt-1">{k.label}</p>
                <p className="text-[9px] font-mono text-zinc-600 mt-1">{k.sub}</p>
                <p className="text-[8px] text-zinc-600">Source: {k.src}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== HUMAN RIGHTS ===== */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
              <h2 className="font-heading font-black text-2xl tracking-tight">
                {lang === "fr" ? "Droits Humains" : lang === "fa" ? "حقوق بشر" : "Human Rights"}
              </h2>
            </div>
            <SourceFavicons sources={[...(sources.human_rights || []), ...(sources.internet_blackouts || [])]} lang={lang} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <div className="bg-[#162640] border border-red-500/20 rounded-xl p-5 text-center" data-testid="hr-blackout">
              <WifiOff className="w-8 h-8 text-red-500 mx-auto mb-2" strokeWidth={1.5} />
              {(() => {
                const connStatus = (hri.internet_connectivity || "").toLowerCase();
                const restored = ["restored", "rétabli", "rétablie", "back online", "full", "online", "normal"].some((k) => connStatus.includes(k));
                if (restored) {
                  return (
                    <>
                      <p className="text-2xl font-heading font-black text-emerald-400">
                        {lang === "fr" ? "Rétablie" : lang === "fa" ? "بازگشت" : "Restored"}
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {lang === "fr" ? "Connexion internet" : "Internet connection"}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">
                        {lang === "fr"
                          ? `Pic historique : ${hri.internet_blackout_days || blackoutDays || 0} j`
                          : `Historic peak: ${hri.internet_blackout_days || blackoutDays || 0}d`}
                      </p>
                    </>
                  );
                }
                return (
                  <>
                    <p className="text-4xl font-heading font-black text-red-500">{hri.internet_blackout_days || blackoutDays || "—"}</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {lang === "fr" ? "Jours de coupure internet" : "Internet Blackout Days"}
                    </p>
                  </>
                );
              })()}
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.internet_source || "NetBlocks"}</p>
              {hri.internet_detail && <p className="text-[8px] text-zinc-600 mt-1 leading-tight">{hri.internet_detail}</p>}
            </div>
            <div className="bg-[#162640] border border-amber-500/20 rounded-xl p-5 text-center" data-testid="hr-protests">
              <Megaphone className="w-8 h-8 text-amber-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-amber-400">{protests}</p>
              <p className="text-sm text-zinc-400 mt-1">{lang === "fr" ? "Manifestations signalées" : "Protests Reported"}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{data.protests_source || "HRA News"}</p>
            </div>
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5 text-center" data-testid="hr-executions">
              <Skull className="w-8 h-8 text-zinc-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-white">{hri.executions || "—"}</p>
              <p className="text-sm text-zinc-400 mt-1">{lang === "fr" ? "Exécutions (2025)" : "Executions (2025)"}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.executions_source || "IHR/ECPM"}</p>
            </div>
            <div className="bg-[#162640] border border-purple-500/20 rounded-xl p-5 text-center" data-testid="hr-prisoners">
              <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-4xl font-heading font-black text-purple-400">{hri.political_prisoners || "—"}</p>
              <p className="text-sm text-zinc-400 mt-1">{lang === "fr" ? "Prisonniers politiques" : "Political Prisoners"}</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{hri.political_prisoners_source || "HRW / HRANA"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {hrIssues.length > 0 && (
              <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
                <span className="text-xs font-mono text-zinc-500 uppercase font-bold">
                  {lang === "fr" ? "Enjeux principaux" : "Key Issues"}
                </span>
                <ul className="mt-3 space-y-2.5">
                  {hrIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                      <span className="text-purple-400 mt-0.5 flex-shrink-0 font-bold">•</span>{issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hrTimeline.length > 0 && (
              <div className="lg:col-span-2 bg-[#162640] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Timeline</span>
                  <span className="text-xs font-mono text-zinc-600">HRA News / VahidOnline</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                  {hrTimeline.map((event, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0 w-3 mt-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        {i < hrTimeline.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" style={{ minHeight: "24px" }} />}
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
            )}
          </div>
        </section>

        {/* ===== SANCTIONS ===== */}
        {(sanctions.us_active_count || sectorBreakdown.length > 0 || recentPackages.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-[#3DB883]" strokeWidth={1.5} />
                <h2 className="font-heading font-black text-2xl tracking-tight">{lang === "fr" ? "Sanctions" : lang === "fa" ? "تحریم‌ها" : "Sanctions"}</h2>
              </div>
              <SourceFavicons sources={sources.sanctions} lang={lang} />
            </div>
            <div className="bg-[#162640] border border-white/10 rounded-xl p-6 mb-5">
              <div className="grid grid-cols-3 gap-6 mb-5">
                <div className="text-center"><p className="text-4xl font-heading font-black text-red-400">{sanctions.us_active_count || "—"}</p><p className="text-xs font-mono text-zinc-500 mt-1">US</p></div>
                <div className="text-center"><p className="text-4xl font-heading font-black text-blue-400">{sanctions.eu_active_count || "—"}</p><p className="text-xs font-mono text-zinc-500 mt-1">EU</p></div>
                <div className="text-center"><p className="text-4xl font-heading font-black text-amber-400">{sanctions.un_active_count || "—"}</p><p className="text-xs font-mono text-zinc-500 mt-1">UN</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[10px] font-mono text-zinc-500 uppercase">Persons</span></div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-heading font-black text-red-400">{sanctions.us_persons_designated || "—"}</span><span className="text-[9px] text-zinc-600">US</span>
                    <span className="text-xl font-heading font-black text-blue-400">{sanctions.eu_persons_designated || "—"}</span><span className="text-[9px] text-zinc-600">EU</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1"><Shield className="w-3.5 h-3.5 text-zinc-500" /><span className="text-[10px] font-mono text-zinc-500 uppercase">Entities</span></div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-heading font-black text-red-400">{sanctions.us_entities_designated || "—"}</span><span className="text-[9px] text-zinc-600">US</span>
                    <span className="text-xl font-heading font-black text-blue-400">{sanctions.eu_entities_designated || "—"}</span><span className="text-[9px] text-zinc-600">EU</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {sectorBreakdown.length > 0 && (
                <div className="bg-[#162640] border border-white/10 rounded-xl p-5" data-testid="sector-breakdown">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold">Sanctions by Sector</span>
                  <div className="flex gap-3 mt-2 mb-4">
                    <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />US</span>
                    <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />EU</span>
                    <span className="flex items-center gap-1 text-xs font-mono text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />UN</span>
                  </div>
                  <div className="space-y-3">
                    {sectorBreakdown.map((sector, i) => {
                      const total = (sector.us_count || 0) + (sector.eu_count || 0) + (sector.un_count || 0);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-300">{sector.sector}</span>
                            <span className="text-xs font-mono text-zinc-500 font-bold">{total}</span>
                          </div>
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
                  <div className="p-4 border-b border-white/5">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold">Recent Sanctions Packages</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {recentPackages.map((pkg, i) => {
                      const ic = pkg.issuer === "US"
                        ? "text-red-400 bg-red-500/15 border-red-500/30"
                        : pkg.issuer === "EU"
                        ? "text-blue-400 bg-blue-500/15 border-blue-500/30"
                        : "text-amber-400 bg-amber-500/15 border-amber-500/30";
                      return (
                        <div key={i} className="px-5 py-3.5">
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
            <div className="bg-[#162640] border border-white/10 rounded-xl p-5">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold mb-3 block">Official Sanctions Lists</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { href: "https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions", label: "US Treasury / OFAC", sub: "Iran Sanctions", color: "red", code: "US" },
                  { href: "https://www.consilium.europa.eu/en/policies/sanctions-against-iran/", label: "EU Council", sub: "Sanctions Against Iran", color: "blue", code: "EU" },
                  { href: "https://www.un.org/securitycouncil/sanctions/1737", label: "UN 1737 Committee", sub: "Snapback", color: "amber", code: "UN" },
                ].map((l) => (
                  <a key={l.code} href={l.href} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 border border-${l.color}-500/20 bg-${l.color}-500/5 rounded-lg hover:bg-${l.color}-500/10 transition-colors`}>
                    <div className={`w-9 h-9 bg-${l.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-heading font-black text-xs">{l.code}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{l.label}</p>
                      <p className="text-[10px] text-zinc-500">{l.sub}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-mono text-zinc-600">
            Sources: IMF, World Bank, IHR/ECPM, HRW, HRANA, NetBlocks, Crisis Group, US Treasury/OFAC, EU Council, UN 1737, OPEC, FDD/UANI
          </p>
          {(data.rss_items_analyzed || data.telegram_messages_analyzed) && (
            <p className="text-xs font-mono text-zinc-600">{data.rss_items_analyzed} items + {data.telegram_messages_analyzed} messages</p>
          )}
        </div>

        {/* Support */}
        <div className="mt-6 bg-gradient-to-r from-[#162640] via-[#1E3A5F] to-[#162640] border border-[#3DB883]/20 rounded-xl py-5 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#3DB883]/15 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-[#3DB883]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-zinc-300">
              {lang === "fr"
                ? "Si ce briefing vous est utile, soutenez l'indépendance de l'Iran Observatory."
                : lang === "fa"
                ? "اگر این بریفینگ برای شما مفید است، از استقلال رصدخانه ایران حمایت کنید."
                : "If this briefing is useful to your work, consider supporting Iran Observatory's independence."}
            </p>
          </div>
          <a
            href="https://www.helloasso.com/associations/dorna/formulaires/2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#3DB883] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#2D9E6E] transition-colors rounded-full flex-shrink-0 shadow-lg shadow-[#3DB883]/20"
          >
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
            {lang === "fr" ? "Soutenir" : lang === "fa" ? "حمایت" : "Support us"}
          </a>
        </div>
      </main>
    </div>
  );
}

export default MonitorDashboard;
