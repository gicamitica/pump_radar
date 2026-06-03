import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Activity, ExternalLink, Shield, TrendingUp } from 'lucide-react';
import { readStoredToken } from '@/shared/utils/tokenStorage';

interface V2Signal {
  symbol: string; name: string;
  category: 'pump' | 'dump' | 'risk' | 'watch' | 'early' | 'dex';
  signal_type: string; verdict: string; confidence: number; reason: string;
  ai_source: string; sources: string[]; mentions: number; network: string;
  token_address: string; pool_address: string; pool_url: string;
  price_usd: number; reserve_usd: number; volume_h24: number;
  price_change_h1: number; price_change_h24: number; buy_sell_ratio_h1: number;
  red_flags: string[]; whale_accumulation: boolean; whale_score: number;
  multi_source: boolean; pre_pump_activity: boolean;
  manipulation_probability: number; dump_risk_level: 'low' | 'medium' | 'high';
}

interface V2Data {
  pump_signals: V2Signal[]; dump_signals: V2Signal[]; risk_signals: V2Signal[];
  watch_signals: V2Signal[]; early_signals: V2Signal[]; dex_signals: V2Signal[];
  market_summary: string; coins_analyzed: number; last_updated: string;
}

const CAT_ORDER = ['early','pump','watch','risk','dex','dump'] as const;
type CatKey = 'pump'|'dump'|'risk'|'watch'|'early'|'dex';

const categoryConfig: Record<CatKey, {
  label:string; color:string; bg:string; border:string;
  badgeBg:string; badgeText:string; icon:string; hex:string;
}> = {
  pump:  { label:'PUMP',  color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/30', badgeBg:'bg-emerald-700', badgeText:'text-emerald-100', icon:'▲', hex:'#22c55e' },
  dump:  { label:'DUMP',  color:'text-red-400',     bg:'bg-red-500/10',     border:'border-red-500/30',     badgeBg:'bg-red-800',     badgeText:'text-red-100',     icon:'▼', hex:'#ef4444' },
  risk:  { label:'RISK',  color:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/30',   badgeBg:'bg-amber-700',   badgeText:'text-amber-100',   icon:'⚠', hex:'#f59e0b' },
  watch: { label:'WATCH', color:'text-sky-400',     bg:'bg-sky-500/10',     border:'border-sky-500/30',     badgeBg:'bg-sky-700',     badgeText:'text-sky-100',     icon:'👁', hex:'#38bdf8' },
  early: { label:'EARLY', color:'text-violet-400',  bg:'bg-violet-500/10',  border:'border-violet-500/30',  badgeBg:'bg-violet-700',  badgeText:'text-violet-100',  icon:'⚡', hex:'#a78bfa' },
  dex:   { label:'DEX',   color:'text-orange-400',  bg:'bg-orange-500/10',  border:'border-orange-500/30',  badgeBg:'bg-orange-700',  badgeText:'text-orange-100',  icon:'🔥', hex:'#fb923c' },
};

const dumpRiskColor = { low:'text-emerald-400', medium:'text-amber-400', high:'text-red-400' };

function getActionBadge(signal: V2Signal): { label:string; classes:string } {
  if (signal.red_flags.includes('honeypot') || signal.red_flags.includes('cannot_sell_all'))
    return { label:'☠ KEEP OUT', classes:'bg-red-800 text-red-100' };
  if (signal.category === 'dump' || (signal.category === 'risk' && signal.dump_risk_level === 'high'))
    return { label:'☠ KEEP OUT', classes:'bg-red-800 text-red-100' };
  if (signal.category === 'pump' && signal.confidence >= 75)
    return { label:'🔥 IMMINENT', classes:'bg-emerald-700 text-emerald-100' };
  if (signal.category === 'early')
    return { label:'⚡ EARLY SIGNAL', classes:'bg-violet-700 text-violet-100' };
  if (signal.category === 'watch')
    return { label:'👁 WATCH', classes:'bg-sky-700 text-sky-100' };
  if (signal.category === 'dex')
    return { label:'🔥 DEX ONLY', classes:'bg-orange-700 text-orange-100' };
  return { label:'📊 MONITOR', classes:'bg-gray-600 text-gray-100' };
}

function fmt(n:number|null|undefined, d=2) {
  if (n==null||isNaN(n)) return 'n/a';
  return n.toFixed(d);
}
function fmtPrice(n:number|null|undefined) {
  if (n==null||isNaN(n)) return 'n/a';
  return n>1 ? `$${n.toFixed(2)}` : `$${n.toFixed(5)}`;
}
function fmtVol(n:number|null|undefined) {
  if (n==null||isNaN(n)) return 'n/a';
  if (n>=1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
  if (n>=1_000) return `$${(n/1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function manipColor(p:number) {
  return p>=70 ? '#ef4444' : p>=40 ? '#f59e0b' : '#22c55e';
}

// ─── Analysis Block ────────────────────────────────────────────────────────
const CRYPTO_SYMBOLS = ['BTC','ETH','CRV','ORCA','FLUX','ONDO','ZAMA','AAVE','DRIFT','TAO','PENGU','ENA','PYTH','SEI','HODL','SOL','BNB','XRP'];
const BULLISH_WORDS = ['pump','bullish','accumulating','breakout','upward','imminent','early','strong','positive','conviction','upside','continuation'];
const BEARISH_WORDS = ['dump','bearish','risk','manipulation','rug','avoid','decline','reversal','correction','fragile','selloff','exhaustion','pullback'];

const SECTION_CONFIG: Record<string, { icon: string; color: string; border: string; bg: string }> = {
  'Overall Direction': { icon: '🧭', color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/5'   },
  'Market Direction':  { icon: '🧭', color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/5'   },
  'Most Imminent':     { icon: '⚡', color: 'text-violet-400',  border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
  'Imminent Moves':    { icon: '⚡', color: 'text-violet-400',  border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
  'Key Risks':         { icon: '⚠️', color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5'  },
  'Trade Bias':        { icon: '🎯', color: 'text-emerald-400', border: 'border-emerald-500/30',bg: 'bg-emerald-500/5'},
  'Recommendation':    { icon: '🎯', color: 'text-emerald-400', border: 'border-emerald-500/30',bg: 'bg-emerald-500/5'},
  'Bottom Line':       { icon: '📌', color: 'text-sky-400',     border: 'border-sky-500/30',    bg: 'bg-sky-500/5'    },
  'Broader Context':   { icon: '🌐', color: 'text-sky-400',     border: 'border-sky-500/30',    bg: 'bg-sky-500/5'    },
};

function colorizeWord(word: string, idx: number) {
  const clean = word.replace(/[^a-zA-Z0-9%+\-.]/g, '');
  if (CRYPTO_SYMBOLS.includes(clean.toUpperCase()))
    return <span key={idx} className="font-bold text-violet-300 bg-violet-500/10 px-0.5 rounded">{word}</span>;
  if (/^[+-]?\d+(\.\d+)?%$/.test(clean)) {
    const isNeg = clean.startsWith('-');
    return <span key={idx} className={`font-bold ${isNeg ? 'text-red-400' : 'text-emerald-400'}`}>{word}</span>;
  }
  if (/^\d{2,3}$/.test(clean) && parseInt(clean) <= 100)
    return <span key={idx} className="font-semibold text-amber-400">{word}</span>;
  const lower = clean.toLowerCase();
  if (BULLISH_WORDS.some(b => lower === b))
    return <span key={idx} className="text-emerald-400">{word}</span>;
  if (BEARISH_WORDS.some(b => lower === b))
    return <span key={idx} className="text-red-400">{word}</span>;
  return <span key={idx}>{word}</span>;
}

// @ts-ignore
function renderLine(text: string) {
  return text.split(/(\s+)/).map((w, j) => colorizeWord(w, j));
}

function AnalysisBlock({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections: Array<{ title: string; content: string[] }> = [];
  let current: { title: string; content: string[] } | null = null;

  for (const line of lines) {
    // skip # headings
    if (/^#+\s/.test(line)) continue;
    const boldSection = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (boldSection) {
      if (current) sections.push(current);
      current = { title: boldSection[1], content: boldSection[2] ? [boldSection[2]] : [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {sections.map((sec, i) => {
        const cfg = Object.entries(SECTION_CONFIG).find(([k]) => sec.title.includes(k))?.[1]
          || { icon: '📊', color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/20' };
        return (
          <div key={i} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cfg.icon}</span>
              <span className={`font-bold text-xs uppercase tracking-wider ${cfg.color}`}>{sec.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sec.content.join(' ').split(/(\s+)/).map((w, j) => colorizeWord(w, j))}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── AI Market Analysis ────────────────────────────────────────────────────
function AIMarketAnalysis({ signals }: { signals: V2Signal[] }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = useCallback(async () => {
    if (!signals.length) return;
    setLoading(true);
    setAnalysis('');
    try {
      const summary = signals.map(s =>
        `${s.symbol}(${s.category},conf:${s.confidence}%,h1:${s.price_change_h1}%,h24:${s.price_change_h24}%,whale:${s.whale_accumulation},manip:${s.manipulation_probability}%,pre_pump:${s.pre_pump_activity})`
      ).join(' | ');
      const res = await fetch('/api/crypto/ai-market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals_summary: summary }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAnalysis(data?.data?.analysis || data?.analysis || 'Analysis unavailable.');
    } catch {
      setAnalysis('Analysis unavailable.');
    }
    setLoading(false);
  }, [signals]);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Market Analysis</span>
          <span className="text-[10px] text-muted-foreground bg-indigo-500/10 px-2 py-0.5 rounded-full">AI Engine</span>
        </div>
        <button
          onClick={() => { setOpen(true); generate(); }}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
        >
          {loading ? <><RefreshCw className="h-3 w-3 animate-spin" />Analyzing...</> : '✨ Analyze market'}
        </button>
      </div>
      {open && (
        <div className="min-h-[48px]">
          {loading
            ? <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
                <RefreshCw className="h-3 w-3 animate-spin" />AI analyzing signals...
              </div>
            : analysis
              ? <AnalysisBlock text={analysis} />
              : null
          }
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ signals }: { signals: V2Signal[] }) {
  if (!signals.length) return null;
  const size = 180; const cx = size/2; const cy = size/2;
  const radii = [72,54,36,20];
  const displayed = signals.slice(0,4);
  return (
    <div className="bg-background/80 border border-border rounded-2xl p-4 flex flex-col items-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Confidence</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {displayed.map((s,i) => {
          const cfg = categoryConfig[s.category];
          const r = radii[i]||10;
          const circ = 2*Math.PI*r;
          const filled = (s.confidence/100)*circ;
          return (
            <g key={s.symbol}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={cfg.hex+'22'} strokeWidth="14"/>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={cfg.hex} strokeWidth="14"
                strokeDasharray={`${filled} ${circ-filled}`} strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}/>
            </g>
          );
        })}
      </svg>
      <div className="w-full space-y-2 mt-2">
        {displayed.map(s => {
          const cfg = categoryConfig[s.category];
          return (
            <div key={s.symbol} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{background:cfg.hex}}/>
                <span className="font-medium">{s.symbol}</span>
                <span className="text-muted-foreground">{s.category}</span>
              </div>
              <span className="font-bold" style={{color:cfg.hex}}>{s.confidence}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── All Signals Bar ───────────────────────────────────────────────────────
function AllSignalsBar({ signals, onFilter }: { signals: Record<CatKey,V2Signal[]>; onFilter:(cat:CatKey)=>void }) {
  const groups = CAT_ORDER.map(cat => ({ cat, items: signals[cat]||[] })).filter(g => g.items.length>0);
  if (!groups.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">All signals overview</div>
      <div className="flex flex-wrap gap-3 items-stretch">
        {groups.map((g) => {
          const cfg = categoryConfig[g.cat];
          return (
            <div key={g.cat} className={`flex flex-col gap-1 rounded-xl border ${cfg.border} bg-background/40 p-2`}>
              <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
              <div className="flex flex-wrap gap-1">
                  {g.items.map(s => {
                    const mc = manipColor(s.manipulation_probability);
                    const circ = 2*Math.PI*10;
                    const filled = (s.manipulation_probability/100)*circ;
                    const ch24c = (s.price_change_h24??0)>=0 ? 'text-emerald-400' : 'text-red-400';
                    return (
                      <div key={s.symbol}
                        onClick={() => onFilter(g.cat)}
                        className={`flex flex-col items-center rounded-xl border ${cfg.border} ${cfg.bg} px-2 py-2 min-w-[64px] cursor-pointer hover:opacity-80 transition-opacity`}>
                        <div className={`text-xs font-bold ${cfg.color}`}>{s.symbol}</div>
                        <div className="text-[10px] font-bold text-foreground">{s.confidence}%</div>
                        <div className={`text-[10px] ${ch24c}`}>{(s.price_change_h24??0)>=0?'+':''}{fmt(s.price_change_h24)}%</div>
                        <svg width="28" height="28" viewBox="0 0 28 28" className="mt-1">
                          <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30"/>
                          <circle cx="14" cy="14" r="10" fill="none" stroke={mc} strokeWidth="2.5"
                            strokeDasharray={`${filled} ${circ-filled}`} strokeLinecap="round"
                            transform="rotate(-90 14 14)"/>
                          <text x="14" y="17" textAnchor="middle" fontSize="7" fill={mc} fontWeight="600">{s.manipulation_probability}%</text>
                        </svg>
                        <div className="flex gap-0.5 mt-0.5">
                          {s.whale_accumulation && <span className="text-blue-400 text-[9px]">🐋</span>}
                          {s.pre_pump_activity && <span className="text-violet-400 text-[9px]">⚡</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
      <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground flex-wrap">
        <span>● cerc = risc manipulare</span><span>🐋 whale accumulation</span><span>⚡ pre-pump activity</span>
      </div>
    </div>
  );
}

// ─── Signal Card ──────────────────────────────────────────────────────────
function SignalCard({ signal, onClick }: { signal:V2Signal; onClick:()=>void }) {
  const cfg = categoryConfig[signal.category]||categoryConfig.watch;
  const badge = getActionBadge(signal);
  const ch1Color = (signal.price_change_h1??0)>=0 ? 'text-emerald-400' : 'text-red-400';
  const ch24Color = (signal.price_change_h24??0)>=0 ? 'text-emerald-400' : 'text-red-400';
  const wc = signal.whale_score>=70 ? 'text-blue-400' : signal.whale_score>=40 ? 'text-amber-400' : 'text-muted-foreground';
  const wBg = signal.whale_accumulation ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/40';
  const mc = manipColor(signal.manipulation_probability);

  return (
    <div onClick={onClick}
      className={`relative rounded-2xl border ${cfg.border} bg-background/80 p-4 pt-6 space-y-3 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}>
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${badge.classes} text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap z-10`}>
        {badge.label}
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.color}`}>
          {signal.symbol.slice(0,2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base">{signal.symbol}</div>
          <div className="text-xs text-muted-foreground">{signal.network} · {signal.verdict}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`text-2xl font-bold ${cfg.color}`}>{signal.confidence}%</div>
          {signal.pre_pump_activity && (
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">⚡ PRE-PUMP</span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{width:`${signal.confidence}%`, background:cfg.hex}}/>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{signal.reason}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          {label:'Price', value:fmtPrice(signal.price_usd), color:''},
          {label:'1h', value:`${(signal.price_change_h1??0)>=0?'+':''}${fmt(signal.price_change_h1)}%`, color:ch1Color},
          {label:'24h', value:`${(signal.price_change_h24??0)>=0?'+':''}${fmt(signal.price_change_h24)}%`, color:ch24Color},
          {label:'Vol 24h', value:fmtVol(signal.volume_h24), color:''},
          {label:'B/S', value:fmt(signal.buy_sell_ratio_h1), color:''},
          {label:'Liquidity', value:fmtVol(signal.reserve_usd), color:''},
        ].map(m => (
          <div key={m.label} className="bg-muted/40 rounded-lg p-2 text-center">
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
            <div className={`text-xs font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-lg p-2 ${wBg}`}>
          <div className="text-[10px] text-muted-foreground">🐋 Whale</div>
          <div className={`text-xs font-bold ${wc}`}>{signal.whale_accumulation ? 'Accumulating' : 'Not accumulating'}</div>
          <div className={`text-[10px] font-bold ${wc}`}>Score: {signal.whale_score}/100</div>
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full" style={{width:`${signal.whale_score}%`, background: signal.whale_score>=70?'#3b82f6':signal.whale_score>=40?'#f59e0b':'#6b7280'}}/>
          </div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <div className="text-[10px] text-muted-foreground">Manip. Risk</div>
          <div className="text-xs font-bold">{signal.manipulation_probability}%
            <span className={`ml-1 ${dumpRiskColor[signal.dump_risk_level]}`}>· {signal.dump_risk_level}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full" style={{width:`${signal.manipulation_probability}%`, background:mc}}/>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-1">
        <div className="flex gap-1 flex-wrap">
          {signal.sources.map(s => <span key={s} className="bg-muted px-1.5 py-0.5 rounded-full">{s}</span>)}
          <span className="bg-muted px-1.5 py-0.5 rounded-full">{signal.mentions}x</span>
        </div>
        <div className="flex gap-2">
          {signal.multi_source && <span className="text-purple-400 font-bold">⚡ MULTI</span>}
          {signal.red_flags.length>0 && <span className="text-red-400 font-bold">⚠ FLAGS</span>}
        </div>
      </div>
      {signal.pool_url && (
        <a href={signal.pool_url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="h-3 w-3"/>View pool on GeckoTerminal
        </a>
      )}
    </div>
  );
}

// ─── Sources Footer ────────────────────────────────────────────────────────
function SourcesFooter({ signals }: { signals:V2Signal[] }) {
  const sourceMap: Record<string,number> = {};
  signals.forEach(s => s.sources.forEach(src => { sourceMap[src]=(sourceMap[src]||0)+1; }));
  const sourceIcons: Record<string,string> = {
    telegram:'📱', reddit:'🟠', cointelegraph:'📰', dexscreener:'📊', geckoterminal:'🦎', twitter:'🐦'
  };
  const entries = Object.entries(sourceMap).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Signal sources breakdown</div>
      <div className="flex flex-wrap gap-3">
        {entries.map(([src,count]) => (
          <div key={src} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
            <span className="text-base">{sourceIcons[src]||'📡'}</span>
            <div>
              <div className="text-xs font-bold capitalize">{src}</div>
              <div className="text-[10px] text-muted-foreground">{count} signal{count!==1?'s':''}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2 ml-auto">
          <span className="text-base">🤖</span>
          <div>
            <div className="text-xs font-bold">Claude Haiku</div>
            <div className="text-[10px] text-muted-foreground">AI judge</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
type FilterKey = CatKey | 'all';
interface Props { forcedTab?: string; }

export default function SignalsDashboard({ forcedTab }: Props = {}) {
  const navigate = useNavigate();
  const [data, setData] = useState<V2Data|null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [nextRefresh, setNextRefresh] = useState(3600);

  const fetchData = useCallback(async (manual=false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const token = readStoredToken();
      const headers = token ? { Authorization:`Bearer ${token}` } : {};
      const res = await axios.get('/api/crypto/signals-v2', { headers });
      if (res.data.success) { setData(res.data.data); }
    } catch (err:any) {
      if (err.response?.status===402) navigate('/subscription');
    } finally { setLoading(false); setRefreshing(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const iv=setInterval(()=>fetchData(),120000); return ()=>clearInterval(iv); }, [fetchData]);
  useEffect(() => {
    const calc = () => {
      if (!data?.last_updated) { setNextRefresh(0); return; }
      const next = new Date(data.last_updated).getTime() + 3600*1000;
      setNextRefresh(Math.max(0, Math.round((next - Date.now())/1000)));
    };
    calc();
    const t=setInterval(calc,1000);
    return ()=>clearInterval(t);
  }, [data?.last_updated]);

  // forcedTab sync
  useEffect(() => { if (forcedTab) setFilter(forcedTab as FilterKey); }, [forcedTab]);

  const fmtTimer = (s:number) => s<=0 ? 'scanning...' : `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const signals: Record<CatKey,V2Signal[]> = {
    pump:  data?.pump_signals||[],  dump:  data?.dump_signals||[],
    risk:  data?.risk_signals||[],  watch: data?.watch_signals||[],
    early: data?.early_signals||[], dex:   data?.dex_signals||[],
  };

  const allSignals = Object.values(signals).flat();

  // sorted all or filtered
  const displayedSignals: V2Signal[] = filter==='all'
    ? CAT_ORDER.flatMap(cat => signals[cat])
    : signals[filter as CatKey]||[];

  // top signals for donut (active filter or pump+early)
  const donutSignals = filter==='all'
    ? [...(signals.pump), ...(signals.early)].slice(0,4)
    : (signals[filter as CatKey]||[]).slice(0,4);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"/>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"/>
      </div>
      <div className="font-bold text-lg">Scanning markets...</div>
      <div className="text-sm text-muted-foreground">Claude Haiku analyzing signals</div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary"/>
            <span>Pump<span className="text-primary">Radar</span></span>
            <span className="text-lg font-normal text-muted-foreground">v2</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.coins_analyzed??0} coins scanned · {data?.last_updated ? new Date(data.last_updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border">
            Next scan <span className="font-bold text-primary ml-1">{fmtTimer(nextRefresh)}</span>
          </div>
          <button onClick={()=>fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border hover:border-primary/40 transition-colors">
            <RefreshCw className={`h-4 w-4 ${refreshing?'animate-spin':''}`}/>
            {refreshing?'Refreshing...':'Refresh'}
          </button>
        </div>
      </div>

      {/* Market summary */}
      {data?.market_summary && (
        <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 to-purple-500/10 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <div className="text-sm font-bold uppercase tracking-wider text-indigo-300">Market summary</div>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{data.market_summary}</p>
        </div>
      )}

      {/* Early Signal Banner */}
      {signals.early.length > 0 && (
        <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-3xl animate-pulse">⚡</div>
            <div>
              <div className="font-bold text-violet-400 text-sm uppercase tracking-wider">Early Signal Detected</div>
              <div className="text-xs text-muted-foreground mt-0.5">{signals.early.map(s => s.symbol).join(", ")} — market hasn't reacted yet</div>
            </div>
          </div>
          <button onClick={() => setFilter('early')} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">View Early Signals →</button>
        </div>
      )}
      {/* AI Market Analysis */}
      <AIMarketAnalysis signals={allSignals}/>

      {/* Category counters — clickable filter */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {(Object.keys(categoryConfig) as CatKey[]).map(cat => {
          const cfg = categoryConfig[cat];
          const active = filter===cat;
          return (
            <button key={cat} onClick={()=>setFilter(active?'all':cat)}
              className={`rounded-xl border p-3 text-center transition-all ${active ? `${cfg.border} ${cfg.bg}` : 'border-border hover:border-primary/30'}`}>
              <div className={`text-xl font-bold ${cfg.color}`}>{signals[cat].length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Tab pills */}
      <div className="flex gap-1 flex-wrap">
        <button onClick={()=>setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filter==='all' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
          Toate <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">{allSignals.length}</span>
        </button>
        {(Object.keys(categoryConfig) as CatKey[]).map(cat => {
          const cfg = categoryConfig[cat];
          const active = filter===cat;
          return (
            <button key={cat} onClick={()=>setFilter(active?'all':cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${active ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
              {cfg.icon} {cfg.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active?cfg.bg:'bg-muted'}`}>{signals[cat].length}</span>
            </button>
          );
        })}
      </div>

      {/* Cards + Donut */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          {displayedSignals.length===0
            ? <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">📭</div>
                <div className="font-semibold">No signals for this category</div>
              </div>
            : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedSignals.map((s,i) => (
                  <SignalCard key={`${s.symbol}-${i}`} signal={s} onClick={()=>navigate(`/coin/${s.symbol}`)}/>
                ))}
              </div>
          }
        </div>
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <DonutChart signals={donutSignals}/>
        </div>
      </div>

      {/* All Signals Bar */}
      <AllSignalsBar signals={signals} onFilter={(cat)=>setFilter(cat)}/>

      <SourcesFooter signals={allSignals}/>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 pb-2">
        <Shield className="h-3 w-3"/>AI-generated signals. Not financial advice.
      </p>
    </div>
  );
}
