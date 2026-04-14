import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, Gauge, BarChart3, Activity, Users, Bomb, Handshake, Scale, Fuel, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// Mock data for visual preview
const mockEconomicData = {
  rial: { value: '585,000', change: -2.3, label: 'IRR/USD (Parallel)' },
  oil: { value: '$78.40', change: 1.8, label: 'Iran Crude (bbl)' },
  inflation: { value: '38.5%', change: -1.2, label: 'Inflation Rate' },
  tedpix: { value: '2,145,000', change: 3.1, label: 'TEDPIX Index' },
};

const mockTensionHistory = [3, 4, 4, 5, 6, 5, 7, 8, 7, 6, 7, 8, 9, 8, 7, 8, 7, 6, 5, 6, 7, 8, 7, 6, 7, 8, 7, 6, 5, 7];

const mockThemeData = [
  { key: 'military', label: 'Military', count: 24, trend: 'up', color: '#dc2626', icon: Bomb },
  { key: 'diplomacy', label: 'Diplomacy', count: 15, trend: 'down', color: '#2563eb', icon: Handshake },
  { key: 'economy', label: 'Economy', count: 18, trend: 'up', color: '#d97706', icon: DollarSign },
  { key: 'human_rights', label: 'Human Rights', count: 12, trend: 'stable', color: '#7c3aed', icon: Users },
  { key: 'nuclear', label: 'Nuclear', count: 8, trend: 'up', color: '#dc2626', icon: AlertTriangle },
  { key: 'sanctions', label: 'Sanctions', count: 11, trend: 'up', color: '#059669', icon: Scale },
];

const mockSanctions = [
  { date: '2026-03-28', entity: 'IRGC Quds Force - 3 commanders', type: 'US Treasury', action: 'Added' },
  { date: '2026-03-15', entity: 'Bank Melli Iran (Brussels branch)', type: 'EU Council', action: 'Added' },
  { date: '2026-03-01', entity: 'NITC (shipping fleet)', type: 'US OFAC', action: 'Extended' },
  { date: '2026-02-20', entity: 'Mobarakeh Steel Company', type: 'UK OFSI', action: 'Added' },
  { date: '2026-02-10', entity: 'IRISL Maritime (2 vessels)', type: 'US Treasury', action: 'Added' },
];

function MiniSparkline({ data, color = '#3DB883', height = 40 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

function TrendArrow({ trend }) {
  if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />;
  if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />;
  return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
}

// ===== OPTION A: Economic Indicators =====
function OptionA() {
  return (
    <section className="py-12 bg-white border-t border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-black text-2xl tracking-tighter text-[#1E3A5F]">Economic Indicators</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-1">Real-time Iran economic data</p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Updated 2h ago</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(mockEconomicData).map(([key, data]) => (
            <div key={key} className="border border-zinc-200 p-5 hover:border-zinc-400 transition-colors">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">{data.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-heading font-black text-[#1E3A5F]">{data.value}</span>
                <span className={`text-xs font-mono flex items-center gap-1 ${data.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {data.change > 0 ? '+' : ''}{data.change}%
                </span>
              </div>
              <div className="mt-3">
                <MiniSparkline 
                  data={key === 'rial' ? [540, 550, 560, 555, 570, 580, 575, 585] : key === 'oil' ? [72, 74, 73, 76, 75, 77, 78, 78] : key === 'inflation' ? [42, 41, 40, 39, 39, 38, 39, 38] : [1900, 1950, 2000, 2050, 2080, 2100, 2120, 2145]} 
                  color={data.change > 0 ? '#059669' : '#dc2626'} 
                  height={30} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== OPTION B: AI Tension Index =====
function OptionB() {
  const tensionScore = 7.2;
  const tensionLevel = tensionScore >= 8 ? 'CRITICAL' : tensionScore >= 6 ? 'ELEVATED' : tensionScore >= 4 ? 'MODERATE' : 'LOW';
  const tensionColor = tensionScore >= 8 ? '#dc2626' : tensionScore >= 6 ? '#d97706' : tensionScore >= 4 ? '#2563eb' : '#059669';
  
  return (
    <section className="py-12 bg-[#0a1628] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-black text-2xl tracking-tighter">Iran Tension Index</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-1">AI-powered geopolitical risk assessment</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3DB883] animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-500">Live analysis</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Gauge */}
          <div className="lg:col-span-1 border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={tensionColor} strokeWidth="8" strokeDasharray={`${(tensionScore / 10) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-heading font-black" style={{ color: tensionColor }}>{tensionScore}</span>
                <span className="text-[10px] font-mono text-zinc-500">/10</span>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-mono uppercase tracking-wider font-bold" style={{ backgroundColor: tensionColor + '20', color: tensionColor }}>
              {tensionLevel}
            </span>
            <p className="text-xs text-zinc-500 mt-3 text-center">Military escalation in Strait of Hormuz & Gulf region driving elevated risk</p>
          </div>
          
          {/* 30-day trend */}
          <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">30-Day Trend</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical (8+)</span>
                <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Elevated (6-7)</span>
                <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Moderate (4-5)</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-32">
              {mockTensionHistory.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div 
                    className="w-full rounded-t transition-all"
                    style={{ 
                      height: `${(val / 10) * 100}%`, 
                      backgroundColor: val >= 8 ? '#dc2626' : val >= 6 ? '#d97706' : val >= 4 ? '#2563eb' : '#059669',
                      opacity: i === mockTensionHistory.length - 1 ? 1 : 0.6
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono text-zinc-600">30 days ago</span>
              <span className="text-[10px] font-mono text-zinc-600">Today</span>
            </div>
            
            {/* Key drivers */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Key Drivers</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Strait of Hormuz standoff', 'IRGC naval exercises', 'UAE drone strikes', 'Khuzestan unrest'].map(d => (
                  <span key={d} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-mono">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== OPTION C: Thematic Tracker =====
function OptionC() {
  return (
    <section className="py-12 bg-[#f7f8fa] border-t border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-black text-2xl tracking-tighter text-[#1E3A5F]">Iran Event Tracker</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-1">Events monitored over the past 30 days</p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-300 px-2 py-1">Last 30 days</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockThemeData.map(theme => {
            const Icon = theme.icon;
            return (
              <div key={theme.key} className="bg-white border border-zinc-200 p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: theme.color + '15' }}>
                  <Icon className="w-5 h-5" style={{ color: theme.color }} strokeWidth={1.5} />
                </div>
                <p className="text-3xl font-heading font-black text-[#1E3A5F] mb-1">{theme.count}</p>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">{theme.label}</p>
                <div className="flex items-center justify-center gap-1">
                  <TrendArrow trend={theme.trend} />
                  <span className={`text-[10px] font-mono ${theme.trend === 'up' ? 'text-red-500' : theme.trend === 'down' ? 'text-green-600' : 'text-zinc-400'}`}>
                    {theme.trend === 'up' ? 'Rising' : theme.trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Heat bar */}
        <div className="mt-6 bg-white border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Event Intensity — Last 30 Days</span>
          </div>
          <div className="flex gap-0.5 h-6">
            {mockTensionHistory.map((val, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-sm"
                style={{ 
                  backgroundColor: val >= 8 ? '#dc2626' : val >= 6 ? '#d97706' : val >= 4 ? '#60a5fa' : '#86efac',
                  opacity: 0.7 + (i / mockTensionHistory.length) * 0.3
                }}
                title={`Day ${i + 1}: ${val}/10`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-zinc-400">Mar 15</span>
            <span className="text-[9px] font-mono text-zinc-400">Apr 14</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== OPTION D: Sanctions Tracker =====
function OptionD() {
  return (
    <section className="py-12 bg-white border-t border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-black text-2xl tracking-tighter text-[#1E3A5F]">Sanctions Tracker</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-1">Active sanctions monitoring on Iran</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center border border-zinc-200 px-4 py-2">
              <p className="text-xl font-heading font-black text-red-600">847</p>
              <p className="text-[9px] font-mono text-zinc-500 uppercase">Active US</p>
            </div>
            <div className="text-center border border-zinc-200 px-4 py-2">
              <p className="text-xl font-heading font-black text-blue-600">312</p>
              <p className="text-[9px] font-mono text-zinc-500 uppercase">Active EU</p>
            </div>
            <div className="text-center border border-zinc-200 px-4 py-2">
              <p className="text-xl font-heading font-black text-amber-600">54</p>
              <p className="text-[9px] font-mono text-zinc-500 uppercase">Active UN</p>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-zinc-50 border border-zinc-200">
          <div className="border-b border-zinc-200 p-3 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Recent Sanctions Activity</span>
            <span className="text-[10px] font-mono text-zinc-400">2026</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {mockSanctions.map((s, i) => (
              <div key={i} className="p-4 flex items-start gap-4 hover:bg-white transition-colors">
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                  <span className="text-[10px] font-mono text-zinc-400">{s.date.split('-').slice(1).join('/')}</span>
                  <div className={`w-2 h-2 rounded-full mt-1 ${s.action === 'Added' ? 'bg-red-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#1E3A5F]">{s.entity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${s.action === 'Added' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.action}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{s.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== MAIN PREVIEW PAGE =====
export default function IndexPreview() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-black text-3xl tracking-tighter">Visual Index Options Preview</h1>
          <p className="text-zinc-400 text-sm mt-2 font-mono">4 options to evaluate — scroll down to compare</p>
        </div>
      </div>

      {/* Option Labels */}
      <div className="bg-[#3DB883] text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest font-bold">OPTION A — Economic Indicators</p>
        </div>
      </div>
      <OptionA />

      <div className="bg-[#3DB883] text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest font-bold">OPTION B — AI Tension Index</p>
        </div>
      </div>
      <OptionB />

      <div className="bg-[#3DB883] text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest font-bold">OPTION C — Event Tracker</p>
        </div>
      </div>
      <OptionC />

      <div className="bg-[#3DB883] text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest font-bold">OPTION D — Sanctions Tracker</p>
        </div>
      </div>
      <OptionD />
    </div>
  );
}
