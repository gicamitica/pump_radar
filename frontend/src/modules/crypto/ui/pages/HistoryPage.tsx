// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { readStoredToken } from '@/shared/utils/tokenStorage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────
interface SignalItem {
  symbol: string;
  confidence: number;
  verdict: string;
  price_usd?: number;
  price_change_h1?: number;
  price_change_h24?: number;
  whale_accumulation?: boolean;
  pre_pump_activity?: boolean;
  manipulation_probability?: number;
}

interface SnapshotSignals {
  pump: SignalItem[];
  dump: SignalItem[];
  risk: SignalItem[];
  early: SignalItem[];
  watch: SignalItem[];
  dex: SignalItem[];
}

interface Snapshot {
  timestamp: string;
  pump_count: number;
  dump_count: number;
  risk_count: number;
  watch_count: number;
  early_count: number;
  dex_count: number;
  coins_analyzed: number;
  market_summary: string;
  signals: SnapshotSignals;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function fmtPrice(n: number | undefined) {
  if (!n) return 'n/a';
  return n > 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(5)}`;
}

const catColors = {
  pump:  '#22c55e',
  early: '#a78bfa',
  risk:  '#f59e0b',
  watch: '#38bdf8',
  dump:  '#ef4444',
  dex:   '#fb923c',
};

const catConfig = {
  pump:  { label: 'PUMP',  icon: '▲', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  early: { label: 'EARLY', icon: '⚡', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
  risk:  { label: 'RISK',  icon: '⚠', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  watch: { label: 'WATCH', icon: '👁', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30' },
  dump:  { label: 'DUMP',  icon: '▼', color: 'text-red-400',      bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  dex:   { label: 'DEX',   icon: '🔥', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
};

// ─── Signal Pill ──────────────────────────────────────────────────────────
function SignalPill({ symbol, confidence, cat }: { symbol: string; confidence: number; cat: keyof typeof catConfig }) {
  const cfg = catConfig[cat];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      {symbol} {confidence}%
    </span>
  );
}

// ─── Snapshot Row ─────────────────────────────────────────────────────────
function SnapshotRow({ snap, index }: { snap: Snapshot; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const total = snap.pump_count + snap.dump_count + snap.risk_count + snap.early_count + snap.dex_count;
  const hasEarly = snap.early_count > 0;
  const hasPump = snap.pump_count > 0;
  const hasDump = snap.dump_count > 0;

  return (
    <div className={`rounded-xl border transition-all ${hasEarly ? 'border-violet-500/30 bg-violet-500/5' : hasDump ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-background/40'}`}>
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-xs text-muted-foreground w-24 flex-shrink-0">
          <div className="font-bold text-foreground">{fmtTime(snap.timestamp)}</div>
          <div>{fmtDate(snap.timestamp)}</div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {hasEarly && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse">
              ⚡ {snap.early_count} EARLY
            </span>
          )}
          {hasPump && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ▲ {snap.pump_count} PUMP
            </span>
          )}
          {hasDump && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              ▼ {snap.dump_count} DUMP
            </span>
          )}
          {snap.risk_count > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              ⚠ {snap.risk_count} RISK
            </span>
          )}
          {snap.watch_count > 0 && (
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40">
              👁 {snap.watch_count} watch
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
          <div>{snap.coins_analyzed} scanned</div>
          <div>{total} signals</div>
        </div>

        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          {snap.market_summary && (
            <p className="text-xs text-muted-foreground">{snap.market_summary}</p>
          )}

          {(['early', 'pump', 'dump', 'risk', 'watch'] as const).map(cat => {
            const items = snap.signals[cat];
            if (!items?.length) return null;
            const cfg = catConfig[cat];
            return (
              <div key={cat}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/coin/${s.symbol}`)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.color} hover:opacity-80 transition-opacity`}
                    >
                      <span className="font-bold">{s.symbol}</span>
                      <span className="opacity-70">{s.confidence}%</span>
                      {s.pre_pump_activity && <span className="text-violet-400">⚡</span>}
                      {s.whale_accumulation && <span className="text-blue-400">🐋</span>}
                      {s.price_change_h24 !== undefined && (
                        <span className={s.price_change_h24 >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {s.price_change_h24 >= 0 ? '+' : ''}{s.price_change_h24.toFixed(1)}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl p-3 text-xs shadow-xl">
      <div className="font-bold mb-2 text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const token = readStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/crypto/history-v2?limit=48', { headers });
      if (res.data.success) {
        setHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Stats
  const totalPump = history.reduce((a, s) => a + s.pump_count, 0);
  const totalDump = history.reduce((a, s) => a + s.dump_count, 0);
  const totalEarly = history.reduce((a, s) => a + s.early_count, 0);
  const totalRisk = history.reduce((a, s) => a + s.risk_count, 0);
  const totalScans = history.length;

  // Chart data — last 24 snapshots
  const chartData = [...history].reverse().slice(-24).map(s => ({
    time: fmtTime(s.timestamp),
    Pump: s.pump_count,
    Early: s.early_count,
    Risk: s.risk_count,
    Dump: s.dump_count,
    Watch: s.watch_count,
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <div className="font-bold">Loading signal history...</div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Signal History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Last 48 scans · PumpRadar v2</p>
        </div>
        <button onClick={() => fetchHistory(true)} disabled={refreshing}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-border hover:border-primary/40 transition-colors">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pump Signals', value: totalPump, color: 'text-emerald-400' },
          { label: 'Early Signals', value: totalEarly, color: 'text-violet-400' },
          { label: 'Risk Signals', value: totalRisk, color: 'text-amber-400' },
          { label: 'Dump Signals', value: totalDump, color: 'text-red-400' },
          { label: 'Total Scans', value: totalScans, color: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className="bg-muted/20 border border-border rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            📊 Signals per scan — last 24 scans
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Pump" stackId="a" fill={catColors.pump} radius={[0,0,0,0]} />
              <Bar dataKey="Early" stackId="a" fill={catColors.early} radius={[0,0,0,0]} />
              <Bar dataKey="Risk" stackId="a" fill={catColors.risk} radius={[0,0,0,0]} />
              <Bar dataKey="Dump" stackId="a" fill={catColors.dump} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          🕐 Scan Timeline — click to expand
        </div>
        {history.length === 0
          ? <div className="text-center py-16 text-muted-foreground">No scan history yet</div>
          : history.map((snap, i) => <SnapshotRow key={i} snap={snap} index={i} />)
        }
      </div>
    </div>
  );
}
