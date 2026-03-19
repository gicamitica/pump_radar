import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Zap, AlertTriangle, Lock, BarChart3, Activity, Sparkles, Brain, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/components/ui/tabs';

interface Signal {
  symbol: string; name: string; signal_strength: number; reason: string;
  confidence: 'high' | 'medium' | 'low'; risk_level: 'low' | 'medium' | 'high';
  price?: number; price_change_1h?: number; price_change_24h?: number;
  volume_24h?: number; social_volume?: number; sentiment?: number;
  galaxy_score?: number; image?: string; signal_type: 'pump' | 'dump';
  is_trending?: boolean;
}
interface SignalData {
  pump_signals: Signal[]; dump_signals: Signal[]; market_summary: string;
  last_updated: string | null; coins_analyzed: number; has_full_access: boolean;
  fear_greed?: { value: number; classification: string }; trending?: string[];
}

const getToken = () => {
  const raw = localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');
  if (!raw) return null;
  try { const p = JSON.parse(raw); return typeof p === 'string' ? p : raw; } catch { return raw; }
};

const confLabel = { high: 'Strong', medium: 'Medium', low: 'Weak' };
const riskColor = { low: 'text-emerald-500', medium: 'text-amber-500', high: 'text-red-500' };
const riskLabel = { low: 'Low', medium: 'Medium', high: 'High' };

function SignalCard({ signal, blurred, onNavigate }: { signal: Signal; blurred: boolean; onNavigate: (url: string) => void }) {
  const isPump = signal.signal_type === 'pump';
  const detailUrl = `/coin/${signal.symbol}?type=${signal.signal_type}`;

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${blurred ? 'select-none cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'} ${isPump ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-background to-background' : 'border-red-500/20 hover:border-red-500/40 bg-gradient-to-br from-red-950/30 via-background to-background'}`}
      data-testid={`signal-card-${signal.symbol}`}
      onClick={() => !blurred && onNavigate(detailUrl)}
    >
      {/* Glow line top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPump ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-red-500 to-transparent'}`} />

      {blurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-background/70 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Pro subscription required</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {signal.image
              ? <img src={signal.image} alt={signal.symbol} className="w-10 h-10 rounded-full ring-2 ring-border" />
              : <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-border ${isPump ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{signal.symbol.slice(0, 2)}</div>
            }
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight">{signal.symbol}</span>
                {signal.is_trending && <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">TRENDING</span>}
                {!blurred && <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <div className="text-xs text-muted-foreground">{signal.name}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPump ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {isPump ? '▲ PUMP' : '▼ DUMP'}
            </span>
            <span className={`text-xs font-medium ${riskColor[signal.risk_level]}`}>Risk: {riskLabel[signal.risk_level]}</span>
          </div>
        </div>

        {/* Signal Strength */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Signal Strength</span>
            <span className={`font-bold tabular-nums ${isPump ? 'text-emerald-400' : 'text-red-400'}`}>{signal.signal_strength}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isPump ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
              style={{ width: `${signal.signal_strength}%` }}
            />
          </div>
        </div>

        {/* AI Reason */}
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{signal.reason}</p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {signal.price !== undefined && (
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Price</div>
              <div className="text-xs font-bold tabular-nums">${signal.price > 1 ? signal.price.toFixed(2) : signal.price.toFixed(5)}</div>
            </div>
          )}
          {signal.price_change_1h !== undefined && (
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">1h</div>
              <div className={`text-xs font-bold tabular-nums ${signal.price_change_1h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.price_change_1h >= 0 ? '+' : ''}{signal.price_change_1h?.toFixed(2)}%
              </div>
            </div>
          )}
          {signal.price_change_24h !== undefined && (
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">24h</div>
              <div className={`text-xs font-bold tabular-nums ${signal.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.price_change_24h >= 0 ? '+' : ''}{signal.price_change_24h?.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {/* Confidence footer */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${signal.confidence === 'high' ? 'bg-emerald-400' : signal.confidence === 'medium' ? 'bg-amber-400' : 'bg-slate-400'}`} />
            <span className="text-xs text-muted-foreground">{confLabel[signal.confidence]} confidence</span>
          </div>
          {!blurred && <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Click for details →</span>}
        </div>
      </div>
    </div>
  );
}

function AISummaryCard({ data }: { data: SignalData }) {
  const fg = data.fear_greed;
  const fgColor = fg ? (fg.value < 25 ? '#ef4444' : fg.value < 45 ? '#f97316' : fg.value < 55 ? '#eab308' : fg.value < 75 ? '#22c55e' : '#10b981') : '#6366f1';
  const trending = data.trending?.slice(0, 5) || [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Market Intelligence</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{data.market_summary}</p>
          </div>
        </div>
        {(fg || trending.length > 0) && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
            {fg && (
              <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fgColor }} />
                <span className="text-xs font-semibold" style={{ color: fgColor }}>Fear & Greed {fg.value}</span>
                <span className="text-xs text-muted-foreground">({fg.classification})</span>
              </div>
            )}
            {trending.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Trending:</span>
                {trending.map(t => (
                  <span key={t} className="text-xs font-semibold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: 'pump' | 'dump' }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${type === 'pump' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        {type === 'pump' ? <TrendingUp className="h-8 w-8 text-emerald-500" /> : <TrendingDown className="h-8 w-8 text-red-500" />}
      </div>
      <h3 className="font-semibold mb-1">No {type === 'pump' ? 'PUMP' : 'DUMP'} signals right now</h3>
      <p className="text-muted-foreground text-sm">AI is analyzing the market. Signals will appear soon.</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-20" /><div className="h-3 bg-muted rounded w-28" /></div></div>
      <div className="h-1.5 bg-muted rounded-full" />
      <div className="h-10 bg-muted rounded-xl" />
      <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg" />)}</div>
    </div>
  );
}

export default function SignalsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextRefresh, setNextRefresh] = useState<number>(3600);
  const [activeTab, setActiveTab] = useState('pump');
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('dump')) setActiveTab('dump');
    else if (location.pathname.includes('history')) setActiveTab('history');
    else setActiveTab('pump');
  }, [location.pathname]);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get('/api/crypto/signals', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) { setData(res.data.data); setNextRefresh(3600); setSubscriptionExpired(false); }
    } catch (err: any) {
      // Check for subscription expiry (402 Payment Required)
      if (err.response?.status === 402) {
        setSubscriptionExpired(true);
      }
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSignals(); const iv = setInterval(fetchSignals, 3600000); return () => clearInterval(iv); }, [fetchSignals]);
  useEffect(() => { const t = setInterval(() => setNextRefresh(p => Math.max(0, p - 1)), 1000); return () => clearInterval(t); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const fmtTime = (ts: string | null) => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const pump = data?.pump_signals || [];
  const dump = data?.dump_signals || [];
  const hasAccess = data?.has_full_access !== false;
  const FREE_LIMIT = 3;

  // Show subscription expired banner
  if (subscriptionExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8" data-testid="subscription-expired">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Free Trial Has Expired</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your 24-hour free trial has ended. Subscribe to Pro to continue receiving AI-powered PUMP & DUMP signals.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg" 
            onClick={() => navigate('/subscription')}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400"
            data-testid="upgrade-btn"
          >
            <Zap className="h-5 w-5 mr-2" />
            Upgrade to Pro
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl">
          {[
            { title: 'All Signals', desc: 'Access all PUMP & DUMP signals without limits' },
            { title: 'Real-time AI', desc: 'Hourly AI analysis with Gemini' },
            { title: 'Priority Support', desc: 'Get help when you need it' },
          ].map((f, i) => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border">
              <div className="font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="signals-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Crypto Signals
          </h1>
          <p className="text-muted-foreground text-sm">Pump & Dump detection powered by Gemini AI · LunarCrush + CoinGecko data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
            <Clock className="h-3.5 w-3.5" />Next update: {fmt(nextRefresh)}
          </div>
          <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading} data-testid="refresh-btn">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp className="h-4 w-4" />, value: pump.length, label: 'PUMP Signals', color: 'text-emerald-500', bg: 'bg-emerald-500/10', testid: 'pump-count' },
          { icon: <TrendingDown className="h-4 w-4" />, value: dump.length, label: 'DUMP Signals', color: 'text-red-500', bg: 'bg-red-500/10', testid: 'dump-count' },
          { icon: <BarChart3 className="h-4 w-4" />, value: data?.coins_analyzed || 0, label: 'Coins Analyzed', color: 'text-blue-500', bg: 'bg-blue-500/10', testid: 'coins-count' },
          { icon: <Activity className="h-4 w-4" />, value: fmtTime(data?.last_updated || null), label: 'Last Update', color: 'text-purple-500', bg: 'bg-purple-500/10', testid: 'last-update' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} flex-shrink-0`}>{s.icon}</div>
                <div><div className={`text-xl font-bold tabular-nums ${s.color}`} data-testid={s.testid}>{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Market Intelligence card */}
      {data?.market_summary && <AISummaryCard data={data} />}

      {/* Upgrade Banner */}
      {!hasAccess && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div><p className="font-semibold text-sm">Free Trial Expired</p><p className="text-xs text-muted-foreground">Upgrade to Pro for full access to all signals</p></div>
          </div>
          <Button size="sm" onClick={() => navigate('/pages/pricing')} data-testid="upgrade-btn">
            <Zap className="h-4 w-4 mr-2" />Upgrade to Pro
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10">
          <TabsTrigger value="pump" data-testid="tab-pump" className="gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />PUMP <span className="bg-emerald-500/15 text-emerald-500 text-xs font-bold px-1.5 rounded-full">{pump.length}</span>
          </TabsTrigger>
          <TabsTrigger value="dump" data-testid="tab-dump" className="gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-red-500" />DUMP <span className="bg-red-500/15 text-red-500 text-xs font-bold px-1.5 rounded-full">{dump.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all" className="text-sm">
            All <span className="bg-muted text-muted-foreground text-xs font-bold px-1.5 rounded-full ml-1">{pump.length + dump.length}</span>
          </TabsTrigger>
        </TabsList>

        {(['pump', 'dump', 'all'] as const).map(tab => {
          const signals = tab === 'pump' ? pump : tab === 'dump' ? dump : [...pump, ...dump];
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {loading
                ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
                : signals.length === 0
                  ? <EmptyState type={tab === 'all' ? 'pump' : tab} />
                  : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {signals.map((s, i) => <SignalCard key={`${s.signal_type}-${s.symbol}`} signal={s} blurred={!hasAccess && i >= FREE_LIMIT} onNavigate={navigate} />)}
                    </div>
              }
            </TabsContent>
          );
        })}
      </Tabs>

      <p className="text-xs text-muted-foreground text-center pb-2 flex items-center justify-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Signals are AI-generated from market data. Not financial advice. Invest responsibly.
      </p>
    </div>
  );
}
