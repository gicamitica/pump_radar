import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Zap, AlertTriangle, Lock, Activity, Sparkles, Brain, ExternalLink, ShieldCheck, Target, Radio, Flame, TimerReset, Info } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/shadcn/components/ui/tooltip';
import { readStoredToken } from '@/shared/utils/tokenStorage';
import AccuracyTracker from '../components/AccuracyTracker';

interface Signal {
  symbol: string; name: string; signal_strength: number; reason: string;
  confidence: 'high' | 'medium' | 'low'; risk_level: 'low' | 'medium' | 'high';
  price?: number; price_change_1h?: number; price_change_24h?: number;
  volume_24h?: number; social_volume?: number; sentiment?: number;
  galaxy_score?: number; image?: string; signal_type: 'pump' | 'dump';
  is_trending?: boolean;
  preferred_venue?: { name: string; type: 'cex' | 'dex' | 'swap'; pair?: string };
  manipulation_profile?: {
    manipulation_score?: number;
    coordinated_hype_score?: number;
    social_burst_score?: number;
    liquidity_trap_score?: number;
    early_entry_score?: number;
    dump_risk_score?: number;
    risk_metric_label?: string;
    stage?: string;
    telegram_mentions?: number;
    telegram_sources?: number;
    warning_flags?: string[];
    summary?: string;
  };
  manipulation_timeline?: {
    phase: string;
    status: string;
    tone: string;
    detail: string;
  }[];
  decision_engine?: {
    trade_readiness?: string;
    execution_score?: number;
    liquidity_score?: number;
    average_spread_pct?: number | null;
    entry_zone?: { low: number; high: number };
    risk_reward?: number;
  };
}
interface SignalData {
  pump_signals: Signal[]; dump_signals: Signal[]; market_summary: string;
  last_updated: string | null; coins_analyzed: number; has_full_access: boolean;
  fear_greed?: { value: number; classification: string }; trending?: string[];
  new_algorithm_signals?: NewAlgorithmSignal[];
}
interface TelegramConsensusSymbol {
  symbol: string;
  mentions: number;
  bullish_mentions: number;
  bearish_mentions: number;
  unique_sources: number;
  avg_score: number;
  stance: 'bullish' | 'bearish' | 'mixed';
  rumor_level: 'low' | 'medium' | 'high';
  source_names: string[];
  latest_posted_at?: string | null;
}

interface TelegramConsensusData {
  headline: string;
  hours: number;
  active_sources: string[];
  signal_count: number;
  bullish_mentions: number;
  bearish_mentions: number;
  hot_symbols: TelegramConsensusSymbol[];
}

interface NewAlgorithmSignal {
  symbol: string;
  name?: string;
  source: 'pump_signal' | 'dump_signal' | 'telegram_early';
  signal_type: 'pump' | 'dump';
  platform_id?: string | null;
  contract_address?: string | null;
  analysis: {
    rule_engine: {
      candidate_id: string;
      token_address: string;
      pair_address: string;
      chain: string;
      action: 'BUY_NOW' | 'WATCH' | 'SELL' | 'AVOID';
      verdict: string;
      score: number;
      features: {
        liquidity_usd?: number;
        safety_score?: number;
        concentration?: number;
        volume_24h_usd?: number | null;
        volume_liquidity_ratio?: number | null;
        buy_sell_ratio?: number | null;
        pair_age_minutes?: number | null;
        social_score?: number | null;
        boost_count?: number | null;
        suspect?: boolean;
        suspect_reasons?: string[];
      };
      risks: string[];
      timestamp?: string;
    };
    ai_judge?: {
      final_action?: 'BUY_NOW' | 'WATCH' | 'SELL' | 'AVOID';
      final_verdict?: string;
      confidence?: number;
      probable_scenario?: string;
      signal_truth?: string;
      timing?: string;
      why_now?: string[];
      red_flags?: string[];
      override_preliminary?: boolean;
      override_reason?: string;
      ai_reasoning_summary?: string;
      source?: string;
    };
    final?: {
      action?: 'BUY_NOW' | 'WATCH' | 'SELL' | 'AVOID';
      verdict?: string;
      confidence?: number;
      signal_truth?: string;
      timing?: string;
    };
  };
}

function deriveConsensusBadge(symbol: TelegramConsensusSymbol): { label: string; className: string } {
  const highBuzz = symbol.rumor_level === 'high' || symbol.mentions >= 4;
  const lowQuality = symbol.avg_score < 45 || symbol.stance === 'mixed';
  const strongBreadth = symbol.unique_sources >= 2;

  if (highBuzz && lowQuality) {
    return { label: 'overhyped', className: 'bg-amber-500/15 text-amber-400' };
  }
  if (lowQuality || symbol.avg_score < 55) {
    return { label: 'risky', className: 'bg-red-500/15 text-red-400' };
  }
  if (strongBreadth && symbol.avg_score >= 55) {
    return { label: 'clean', className: 'bg-emerald-500/15 text-emerald-400' };
  }
  return { label: 'risky', className: 'bg-red-500/15 text-red-400' };
}

interface IntelligenceAlert {
  type: string;
  category?: string;
  severity: 'high' | 'medium' | 'low';
  severity_score?: number;
  symbol?: string;
  signal_type?: 'pump' | 'dump';
  title: string;
  detail: string;
  action?: string;
  evidence?: string[];
}

interface CrossPlatformConsensusCardItem {
  symbol: string;
  signal_type: 'pump' | 'dump';
  consensus_score: number;
  verdict: string;
  badge: string;
  market_score: number;
  telegram_score: number;
  x_score: number;
  narrative_score: number;
  summary: string;
  supportive_signals?: string[];
  conflict_flags?: string[];
  lead_creator?: {
    screen_name?: string;
    trust_score: number;
    trust_badge: string;
  } | null;
}

const getToken = () => readStoredToken();

const confLabel = { high: 'Strong', medium: 'Medium', low: 'Weak' };
const riskColor = { low: 'text-emerald-500', medium: 'text-amber-500', high: 'text-red-500' };
const riskLabel = { low: 'Low', medium: 'Medium', high: 'High' };
const DASHBOARD_SCROLL_KEY = 'pumpradar-dashboard-scroll-y';

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function TickerPill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-bold tracking-wide text-foreground">
      {children}
    </span>
  );
}

function highlightAssetText(text: string, symbol?: string, name?: string) {
  if (!text) return text;

  const tokens = [symbol, name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);

  if (!tokens.length) return text;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = tokens.some(token => new RegExp(`^${token}$`, 'i').test(part));
    if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;

    return (
      <span
        key={`${part}-${index}`}
        className="rounded-md bg-primary/10 px-1 py-0.5 font-semibold text-foreground"
      >
        {part}
      </span>
    );
  });
}

function highlightMarketText(text: string, tickers: string[]) {
  if (!text) return text;

  const tokens = Array.from(
    new Set(
      tickers
        .filter(Boolean)
        .map(token => token.trim())
        .filter(token => /^[A-Z0-9]{2,15}$/.test(token))
    )
  )
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);

  if (!tokens.length) return text;

  const regex = new RegExp(`\\b(${tokens.join('|')})\\b`, 'g');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = tokens.some(token => new RegExp(`^${token}$`).test(part));
    if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;
    return <TickerPill key={`${part}-${index}`}>{part}</TickerPill>;
  });
}

function formatRelativeShort(ts?: string | null) {
  if (!ts) return 'just now';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const mins = Math.floor(diffSeconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function deriveSignalState(signal: Signal): { label: string; tone: string; pulse: string } {
  const oneHour = signal.price_change_1h ?? 0;
  const day = signal.price_change_24h ?? 0;
  const strength = signal.signal_strength ?? 0;
  const risk = signal.risk_level;

  if (signal.signal_type === 'pump') {
    if ((day >= 12 || oneHour >= 3.5) && risk === 'high') {
      return { label: 'Overextended', tone: 'bg-amber-500/15 text-amber-400', pulse: 'bg-amber-400' };
    }
    if (strength >= 75 && oneHour > 0) {
      return { label: 'Confirmed', tone: 'bg-emerald-500/15 text-emerald-400', pulse: 'bg-emerald-400' };
    }
    return { label: 'Emerging', tone: 'bg-sky-500/15 text-sky-400', pulse: 'bg-sky-400' };
  }

  if ((day <= -10 || oneHour <= -3) && risk === 'high') {
    return { label: 'Overextended', tone: 'bg-amber-500/15 text-amber-400', pulse: 'bg-amber-400' };
  }
  if (strength >= 70 && oneHour < 0) {
    return { label: 'Failing', tone: 'bg-red-500/15 text-red-400', pulse: 'bg-red-400' };
  }
  return { label: 'Confirmed', tone: 'bg-orange-500/15 text-orange-400', pulse: 'bg-orange-400' };
}

function buildActivityEvents(data: SignalData | null, telegramConsensus: TelegramConsensusData | null, nextRefresh: number) {
  if (!data) return [];

  const events: { id: string; title: string; meta: string; tone: string; pulseBg: string }[] = [];
  const topPump = data.pump_signals?.[0];
  const topDump = data.dump_signals?.[0];
  const hottestTelegram = telegramConsensus?.hot_symbols?.[0];

  if (topPump) {
    events.push({
      id: `pump-${topPump.symbol}`,
      title: `${topPump.symbol} is climbing the pump board`,
      meta: `${topPump.signal_strength}% score • ${topPump.price_change_1h?.toFixed(2) ?? '0.00'}% in 1h`,
      tone: 'text-emerald-400',
      pulseBg: 'bg-emerald-400',
    });
  }
  if (topDump) {
    events.push({
      id: `dump-${topDump.symbol}`,
      title: `${topDump.symbol} is under dump pressure`,
      meta: `${topDump.signal_strength}% score • ${topDump.price_change_1h?.toFixed(2) ?? '0.00'}% in 1h`,
      tone: 'text-red-400',
      pulseBg: 'bg-red-400',
    });
  }
  if (telegramConsensus?.signal_count) {
    events.push({
      id: 'telegram-buzz',
      title: `Telegram heat across ${telegramConsensus.active_sources.length} signal-grade channels`,
      meta: `${telegramConsensus.signal_count} parsed calls in the last ${telegramConsensus.hours}h`,
      tone: 'text-sky-400',
      pulseBg: 'bg-sky-400',
    });
  }
  if (hottestTelegram) {
    events.push({
      id: `telegram-${hottestTelegram.symbol}`,
      title: `${hottestTelegram.symbol} is the hottest Telegram rumor`,
      meta: `${hottestTelegram.mentions} mentions • ${hottestTelegram.unique_sources} sources`,
      tone: 'text-cyan-400',
      pulseBg: 'bg-cyan-400',
    });
  }
  if (data.fear_greed) {
    const sentimentTone = data.fear_greed.value < 30 ? 'text-red-400' : data.fear_greed.value > 65 ? 'text-emerald-400' : 'text-amber-400';
    const sentimentPulse = data.fear_greed.value < 30 ? 'bg-red-400' : data.fear_greed.value > 65 ? 'bg-emerald-400' : 'bg-amber-400';
    events.push({
      id: 'fear-greed',
      title: `Fear & Greed sits at ${data.fear_greed.value}`,
      meta: data.fear_greed.classification,
      tone: sentimentTone,
      pulseBg: sentimentPulse,
    });
  }
  events.push({
    id: 'refresh',
    title: 'Next full market scan',
    meta: `${Math.floor(nextRefresh / 60)}m ${String(nextRefresh % 60).padStart(2, '0')}s`,
    tone: 'text-indigo-400',
    pulseBg: 'bg-indigo-400',
  });

  return events.slice(0, 5);
}

function LivePulseBar({ data, nextRefresh, telegramConsensus }: { data: SignalData; nextRefresh: number; telegramConsensus: TelegramConsensusData | null }) {
  const lastUpdated = data.last_updated;
  const topPump = data.pump_signals?.[0];
  const topDump = data.dump_signals?.[0];
  const hottestTelegram = telegramConsensus?.hot_symbols?.[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-background via-primary/5 to-background px-4 py-3">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary/10 to-transparent" />
      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Live Signal Pulse
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                live
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last refresh {formatRelativeShort(lastUpdated)}. Next scan in {Math.floor(nextRefresh / 60)}m {String(nextRefresh % 60).padStart(2, '0')}s.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[560px]">
          <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Pump</div>
            <div className="mt-1 text-sm font-bold text-emerald-400">{topPump?.symbol || 'n/a'}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Dump</div>
            <div className="mt-1 text-sm font-bold text-red-400">{topDump?.symbol || 'n/a'}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fear & Greed</div>
            <div className="mt-1 text-sm font-bold">{data.fear_greed ? `${data.fear_greed.value} ${data.fear_greed.classification}` : 'n/a'}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Telegram Heat</div>
              <div className="mt-1 text-sm font-bold text-sky-400">{hottestTelegram ? `${hottestTelegram.symbol} ×${hottestTelegram.mentions}` : 'quiet'}</div>
            </div>
        </div>
      </div>
    </div>
  );
}

function MarketHeatStrip({ data, telegramConsensus, onOpenCoin }: { data: SignalData; telegramConsensus: TelegramConsensusData | null; onOpenCoin: (symbol: string, type: 'pump' | 'dump') => void }) {
  const items: { key: string; label: string; value: string; tone: string; onClick?: () => void }[] = [];

  data.pump_signals.slice(0, 3).forEach((signal) => {
    items.push({
      key: `pump-${signal.symbol}`,
      label: `${signal.symbol} pump`,
      value: `${signal.signal_strength}%`,
      tone: 'text-emerald-400',
      onClick: () => onOpenCoin(signal.symbol, 'pump'),
    });
  });
  data.dump_signals.slice(0, 2).forEach((signal) => {
    items.push({
      key: `dump-${signal.symbol}`,
      label: `${signal.symbol} dump`,
      value: `${signal.signal_strength}%`,
      tone: 'text-red-400',
      onClick: () => onOpenCoin(signal.symbol, 'dump'),
    });
  });
  (telegramConsensus?.hot_symbols || []).slice(0, 3).forEach((symbol) => {
    items.push({
      key: `tg-${symbol.symbol}`,
      label: `${symbol.symbol} chatter`,
      value: `${symbol.mentions} mentions`,
      tone: 'text-sky-400',
    });
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
          <Flame className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-semibold">Live Market Heat <InfoHint text="Fast scan of what is moving right now: pump activity, chatter, early setup, and reversal risk." /></div>
          <div className="text-xs text-muted-foreground">Fast scan of what is moving or breaking down right now.</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-left transition hover:border-primary/30 hover:bg-muted/60"
          >
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <span className={`ml-2 text-xs font-bold ${item.tone}`}>{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityRail({ events }: { events: { id: string; title: string; meta: string; tone: string; pulseBg: string }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
          <TimerReset className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-sm font-semibold">Live Activity Rail <InfoHint text="Short feed of the most recent system changes: new signals, sentiment updates, and important events." /></div>
          <div className="text-xs text-muted-foreground">A quick stream of what changed most recently across the system.</div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {events.map((event) => (
          <div key={event.id} className="relative rounded-xl border border-border/70 bg-muted/20 p-3 pl-5">
            <span className={`absolute left-2 top-4 h-2 w-2 rounded-full animate-pulse ${event.pulseBg}`} />
            <div className={`text-sm font-semibold ${event.tone}`}>{highlightMarketText(event.title, event.title.match(/\b[A-Z0-9]{2,15}\b/g) || [])}</div>
            <div className="mt-1 text-xs text-muted-foreground">{highlightMarketText(event.meta, event.meta.match(/\b[A-Z0-9]{2,15}\b/g) || [])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManipulationIntelStrip({ pump, dump }: { pump: Signal[]; dump: Signal[] }) {
  const stealthBuild = [...pump]
    .sort((a, b) => (b.manipulation_profile?.early_entry_score ?? 0) - (a.manipulation_profile?.early_entry_score ?? 0))[0];
  const coordinated = [...pump, ...dump]
    .sort((a, b) => (b.manipulation_profile?.coordinated_hype_score ?? 0) - (a.manipulation_profile?.coordinated_hype_score ?? 0))[0];
  const dumpRisk = [...pump, ...dump]
    .sort((a, b) => (b.manipulation_profile?.dump_risk_score ?? 0) - (a.manipulation_profile?.dump_risk_score ?? 0))[0];

  const cards = [
    {
      label: 'Early Setup',
      symbol: stealthBuild?.symbol || 'n/a',
      value: `${stealthBuild?.manipulation_profile?.early_entry_score ?? 0}%`,
      meta: stealthBuild?.manipulation_profile?.stage || 'No setup yet',
      tone: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Coordination Risk',
      symbol: coordinated?.symbol || 'n/a',
      value: `${coordinated?.manipulation_profile?.coordinated_hype_score ?? 0}%`,
      meta: coordinated?.manipulation_profile?.telegram_mentions ? `${coordinated.manipulation_profile.telegram_mentions} mentions` : 'No chatter yet',
      tone: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Reversal Risk',
      symbol: dumpRisk?.symbol || 'n/a',
      value: `${dumpRisk?.manipulation_profile?.dump_risk_score ?? 0}%`,
      meta: dumpRisk?.manipulation_profile?.stage || 'Stable',
      tone: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <TickerPill>{card.symbol}</TickerPill>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground"></span>
              </div>
            </div>
            <div className={`rounded-xl px-3 py-2 ${card.bg}`}>
              <div className={`text-base font-bold ${card.tone}`}>{card.value}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{card.meta}</div>
        </div>
      ))}
    </div>
  );
}

function IntelligenceAlertsCard({ alerts, onOpenCoin }: { alerts: IntelligenceAlert[]; onOpenCoin: (symbol: string, type: 'pump' | 'dump') => void }) {
  if (!alerts.length) return null;
  const groups = [
    { key: 'high', label: 'High Priority' },
    { key: 'medium', label: 'Watch Closely' },
    { key: 'low', label: 'Background' },
  ] as const;
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-background to-background">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <div className="text-sm font-semibold">Fresh Manipulation Alerts</div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">What looks coordinated, early, or dangerous right now.</div>
      </div>
      <div className="space-y-4 p-4">
        {groups.map((group) => {
          const scoped = alerts.filter((alert) => alert.severity === group.key);
          if (!scoped.length) return null;
          return (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group.label}</div>
                <Badge variant="outline" className="text-[10px]">{scoped.length}</Badge>
              </div>
              {scoped.map((alert, index) => (
                <button
                  key={`${alert.type}-${alert.symbol || index}`}
                  type="button"
                  onClick={() => alert.symbol && onOpenCoin(alert.symbol, alert.signal_type || 'pump')}
                  className="w-full rounded-xl border border-border bg-background/70 p-3 text-left transition hover:border-primary/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{highlightMarketText(alert.title, alert.symbol ? [alert.symbol] : [])}</div>
                    <div className="flex items-center gap-2">
                      {typeof alert.severity_score === 'number' && (
                        <Badge variant="outline" className="text-[10px]">
                          {alert.severity_score}/100
                        </Badge>
                      )}
                      <Badge className={
                        alert.severity === 'high'
                          ? 'bg-red-500/15 text-red-500'
                          : alert.severity === 'medium'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-slate-500/15 text-slate-400'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                  {alert.category && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {alert.category}
                      </Badge>
                    </div>
                  )}
                  <div className="mt-1 text-sm text-muted-foreground">{highlightMarketText(alert.detail, alert.symbol ? [alert.symbol] : [])}</div>
                  {alert.action && (
                    <div className="mt-2 text-xs font-medium text-foreground/80">
                      Action: {highlightMarketText(alert.action, alert.symbol ? [alert.symbol] : [])}
                    </div>
                  )}
                  {!!alert.evidence?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {alert.evidence.slice(0, 3).map((item) => (
                        <span key={`${alert.title}-${item}`} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                          {highlightMarketText(item, alert.symbol ? [alert.symbol] : [])}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrossPlatformConsensusPanel({
  cards,
  onOpenCoin,
}: {
  cards: CrossPlatformConsensusCardItem[];
  onOpenCoin: (symbol: string, type: 'pump' | 'dump') => void;
}) {
  if (!cards.length) return null;

  const badgeStyles: Record<string, string> = {
    aligned: 'bg-emerald-500/15 text-emerald-400',
    building: 'bg-sky-500/15 text-sky-400',
    speculative: 'bg-amber-500/15 text-amber-400',
    thin: 'bg-slate-500/15 text-slate-300',
  };

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-background to-background">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <div className="inline-flex items-center gap-2 text-sm font-semibold">Cross-Platform Signal Check <InfoHint text="Compares signal strength across market structure, Telegram, X, and narrative momentum for the highlighted coin." /></div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Market structure, Telegram chatter, X activity, and narrative momentum ranked together.
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={`${card.symbol}-${card.signal_type}`}
            type="button"
            onClick={() => onOpenCoin(card.symbol, card.signal_type)}
            className="rounded-xl border border-border bg-background/70 p-4 text-left transition hover:border-primary/30"
          >
            <div className="flex items-center justify-between gap-3">
              <TickerPill>{card.symbol}</TickerPill>
              <Badge className={badgeStyles[card.badge] || badgeStyles.thin}>
                {card.verdict}
              </Badge>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Consensus</div>
                <div className="text-2xl font-bold">{card.consensus_score}%</div>
              </div>
              <div className={`text-xs font-semibold ${card.signal_type === 'pump' ? 'text-emerald-400' : 'text-red-400'}`}>
                {card.signal_type.toUpperCase()}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">Market</div>
                <div className="font-semibold">{card.market_score}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">Telegram</div>
                <div className="font-semibold">{card.telegram_score}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">X</div>
                <div className="font-semibold">{card.x_score}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">Narrative</div>
                <div className="font-semibold">{card.narrative_score}</div>
              </div>
            </div>
            <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {highlightMarketText(card.summary, [card.symbol])}
            </div>
            {card.lead_creator?.screen_name && (
              <div className="mt-3">
                <Badge variant="outline" className="text-[10px]">
                  @{card.lead_creator.screen_name} · {card.lead_creator.trust_badge} · {card.lead_creator.trust_score}/100
                </Badge>
              </div>
            )}
            {!!card.supportive_signals?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {card.supportive_signals.slice(0, 2).map((item) => (
                  <span key={`${card.symbol}-${item}`} className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
                    {highlightMarketText(item, [card.symbol])}
                  </span>
                ))}
              </div>
            )}
            {!!card.conflict_flags?.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {card.conflict_flags.slice(0, 2).map((item) => (
                  <span key={`${card.symbol}-conflict-${item}`} className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
                    {highlightMarketText(item, [card.symbol])}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SignalCard({ signal, blurred, onNavigate, snapshotUpdatedAt, flash }: { signal: Signal; blurred: boolean; onNavigate: (url: string) => void; snapshotUpdatedAt?: string | null; flash?: boolean }) {
  const isPump = signal.signal_type === 'pump';
  const detailUrl = `/coin/${signal.symbol}?type=${signal.signal_type}`;
  const tradeReadiness = signal.decision_engine?.trade_readiness ?? 'Pending';
  const preferredVenue = signal.preferred_venue?.name || 'Venue check';
  const entryZone = signal.decision_engine?.entry_zone;
  const spread = signal.decision_engine?.average_spread_pct;
  const signalState = deriveSignalState(signal);
  const manipulation = signal.manipulation_profile;

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${blurred ? 'select-none cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'} ${flash && !blurred ? 'ring-2 ring-sky-500/30 shadow-[0_0_0_1px_rgba(14,165,233,0.15),0_0_28px_rgba(14,165,233,0.18)]' : ''} ${isPump ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-background to-background' : 'border-red-500/20 hover:border-red-500/40 bg-gradient-to-br from-red-950/30 via-background to-background'}`}
      data-testid={`signal-card-${signal.symbol}`}
      onClick={() => !blurred && onNavigate(detailUrl)}
      style={flash && !blurred ? { animation: 'signalFlash 1.25s ease-out 2' } : undefined}
    >
      {/* Glow line top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPump ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-red-500 to-transparent'}`} />
      {flash && !blurred && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/12 to-sky-500/0 animate-pulse" />
          <div className="pointer-events-none absolute -inset-6 rounded-[28px] border border-sky-400/25 animate-ping" />
        </>
      )}

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
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${signalState.tone}`}>{signalState.label}</span>
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
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
          {highlightAssetText(signal.reason, signal.symbol, signal.name)}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/40 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <ShieldCheck className="h-3 w-3" />
              Manipulation
            </div>
            <div className="text-xs font-bold">{manipulation?.manipulation_score ?? 0}%</div>
            <div className="text-[10px] text-muted-foreground">{manipulation?.stage || tradeReadiness}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              {manipulation?.risk_metric_label || (isPump ? 'Reversal Risk' : 'Dump Risk')}
            </div>
            <div className="text-xs font-bold truncate">{manipulation?.dump_risk_score ?? 0}%</div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {manipulation?.telegram_mentions ? `${manipulation.telegram_mentions} mentions` : preferredVenue}
            </div>
          </div>
        </div>

        {manipulation?.summary && (
          <div className="mb-3 rounded-lg border border-border/60 bg-background/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Manipulation Read</div>
            <div className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
              {highlightAssetText(manipulation.summary, signal.symbol, signal.name)}
            </div>
          </div>
        )}

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
          {entryZone && (
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Entry Zone</div>
              <div className="text-[11px] font-bold tabular-nums">
                ${entryZone.low > 1 ? entryZone.low.toFixed(2) : entryZone.low.toFixed(5)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                to ${entryZone.high > 1 ? entryZone.high.toFixed(2) : entryZone.high.toFixed(5)}
              </div>
            </div>
          )}
        </div>

        {(spread !== undefined || signal.decision_engine?.risk_reward !== undefined) && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Spread {spread != null ? `${spread.toFixed(3)}%` : 'n/a'}</span>
            <span>R/R {signal.decision_engine?.risk_reward?.toFixed(2) ?? 'n/a'}</span>
          </div>
        )}

        {/* Confidence footer */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${signalState.pulse}`} />
            <span className="text-xs text-muted-foreground">{confLabel[signal.confidence]} confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Updated {formatRelativeShort(snapshotUpdatedAt)}</span>
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
  const summaryTickers = Array.from(new Set([
    ...trending,
    ...data.pump_signals.slice(0, 6).map(signal => signal.symbol),
    ...data.dump_signals.slice(0, 4).map(signal => signal.symbol),
  ]));

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
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Market Intelligence <span className="text-foreground"><InfoHint text="Summary of the current scan. If AI is unavailable, this block shows the quantitative fallback and overall market context." /></span></span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{highlightMarketText(data.market_summary, summaryTickers)}</p>
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

function TelegramConsensusCard({ data, onOpenFeed }: { data: TelegramConsensusData; onOpenFeed: () => void }) {
  const topSymbols = data.hot_symbols.slice(0, 4);
  const headlineTickers = data.hot_symbols.map(symbol => symbol.symbol);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/30 via-background to-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <div className="relative p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-400">Telegram Signal Check <InfoHint text="Shows which coins are being pushed across active Telegram sources, how many mentions exist, and whether the chatter looks repeated or still thin." /></div>
              <p className="text-sm text-foreground/90 mt-1">{highlightMarketText(data.headline, headlineTickers)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenFeed}>
            Open Feed
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Signal-Grade Channels</div>
            <div className="text-lg font-bold">{data.active_sources.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Parsed Mentions</div>
            <div className="text-lg font-bold">{data.signal_count}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Bullish Chatter</div>
            <div className="text-lg font-bold text-emerald-400">{data.bullish_mentions}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Bearish Chatter</div>
            <div className="text-lg font-bold text-red-400">{data.bearish_mentions}</div>
          </div>
        </div>

        {topSymbols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topSymbols.map(symbol => {
              const qualityBadge = deriveConsensusBadge(symbol);
              return (
              <div key={symbol.symbol} className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{symbol.symbol}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        symbol.stance === 'bullish'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : symbol.stance === 'bearish'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {symbol.stance.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${qualityBadge.className}`}>
                        {qualityBadge.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {symbol.mentions} mentions across {symbol.unique_sources} source{symbol.unique_sources === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    symbol.rumor_level === 'high'
                      ? 'bg-sky-500/15 text-sky-400'
                      : symbol.rumor_level === 'medium'
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {symbol.rumor_level} buzz
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Bull {symbol.bullish_mentions} / Bear {symbol.bearish_mentions}</span>
                  <span>Avg score {symbol.avg_score.toFixed(0)}</span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
                  {symbol.source_names.join(', ')}
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
            No repeated Telegram coin chatter yet. As new messages arrive from the active Telegram sources, this block will summarize what is being pushed hardest.
          </div>
        )}
      </div>
    </div>
  );
}

function NarrativeBurstCard({
  data,
  telegramConsensus,
  alerts,
  onOpenCoin,
}: {
  data: SignalData;
  telegramConsensus: TelegramConsensusData | null;
  alerts: IntelligenceAlert[];
  onOpenCoin: (symbol: string, type: 'pump' | 'dump') => void;
}) {
  const bullishRumor = telegramConsensus?.hot_symbols.find((item) => item.stance === 'bullish');
  const bearishRumor = telegramConsensus?.hot_symbols.find((item) => item.stance === 'bearish');
  const topAlert = alerts[0];
  const narrativeTokens = Array.from(
    new Set([
      ...(data.trending || []).slice(0, 5),
      ...(telegramConsensus?.hot_symbols || []).slice(0, 4).map((item) => item.symbol),
      ...alerts.map((alert) => alert.symbol).filter(Boolean) as string[],
    ])
  );

  const cards = [
    {
      label: 'Trending Narrative',
      symbol: data.trending?.[0] || 'quiet',
      detail: data.trending?.length
        ? `${data.trending.slice(0, 4).join(', ')} are leading the broader attention layer.`
        : 'No strong trend cluster detected right now.',
      tone: 'text-amber-400',
      bg: 'bg-amber-500/10',
      type: 'pump' as const,
    },
    {
      label: 'Bullish Chatter',
      symbol: bullishRumor?.symbol || 'quiet',
      detail: bullishRumor
        ? `${bullishRumor.symbol} is getting ${bullishRumor.mentions} bullish mentions across ${bullishRumor.unique_sources} source${bullishRumor.unique_sources === 1 ? '' : 's'}.`
        : 'No convincing bullish rumor cluster yet.',
      tone: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      type: 'pump' as const,
    },
    {
      label: 'Risk Narrative',
      symbol: bearishRumor?.symbol || topAlert?.symbol || 'quiet',
      detail: bearishRumor
        ? `${bearishRumor.symbol} is skewing bearish across watched channels.`
        : topAlert
          ? topAlert.detail
          : 'No urgent narrative breakdown detected.',
      tone: 'text-rose-400',
      bg: 'bg-rose-500/10',
      type: bearishRumor?.stance === 'bearish' || topAlert?.signal_type === 'dump' ? 'dump' as const : 'pump' as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/25 via-background to-background">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-fuchsia-400" />
          <div className="text-sm font-semibold">Narrative Burst <InfoHint text="Summary of the dominant narrative: which ticker is attracting attention, where bullish chatter exists, and where narrative risk is rising." /></div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {highlightMarketText('Cross-checking trend, Telegram chatter, and live alert context.', narrativeTokens)}
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => card.symbol !== 'quiet' && onOpenCoin(card.symbol, card.type)}
            className="rounded-xl border border-border bg-background/70 p-4 text-left transition hover:border-primary/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</div>
              <div className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${card.bg} ${card.tone}`}>
                {card.symbol}
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {highlightMarketText(card.detail, narrativeTokens)}
            </div>
          </button>
        ))}
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

function NewAlgorithmSignalsTable({
  rows,
  onOpenCoin,
}: {
  rows: NewAlgorithmSignal[];
  onOpenCoin: (symbol: string, type: 'pump' | 'dump') => void;
}) {
  if (!rows.length) return null;

  const fmtCompact = (value?: number | null) => {
    if (value == null || Number.isNaN(Number(value))) return 'n/a';
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(value));
  };

  const fmtRatio = (value?: number | null) => {
    if (value == null || Number.isNaN(Number(value))) return 'n/a';
    return Number(value).toFixed(2);
  };

  const getFinalVerdict = (row: NewAlgorithmSignal) =>
    row.analysis.final?.verdict || row.analysis.ai_judge?.final_verdict || row.analysis.rule_engine.verdict || 'Noise';

  const getFinalAction = (row: NewAlgorithmSignal) =>
    row.analysis.final?.action || row.analysis.ai_judge?.final_action || row.analysis.rule_engine.action || 'WATCH';

  const getConfidence = (row: NewAlgorithmSignal) =>
    row.analysis.final?.confidence ?? row.analysis.ai_judge?.confidence ?? 0;

  const getTiming = (row: NewAlgorithmSignal) => {
    const raw = row.analysis.final?.timing || row.analysis.ai_judge?.timing || 'n/a';
    return String(raw).replace(/_/g, ' ');
  };

  const getSignalQuality = (row: NewAlgorithmSignal) =>
    row.analysis.rule_engine.features?.suspect ? 'Suspect' : 'Clean';

  const getSignalQualityClass = (row: NewAlgorithmSignal) =>
    row.analysis.rule_engine.features?.suspect
      ? 'bg-amber-500/15 text-amber-400'
      : 'bg-emerald-500/15 text-emerald-400';

  const getWalletStructure = (row: NewAlgorithmSignal) => {
    const reasons = row.analysis.rule_engine.features?.suspect_reasons || [];
    if (reasons.includes('holder_concentration_high')) return 'Distribution risk';
    if (reasons.includes('holder_concentration_elevated')) return 'Concentrated';
    return 'Clean structure';
  };

  const getWalletStructureClass = (label: string) => {
    if (label === 'Distribution risk') return 'bg-orange-500/15 text-orange-400';
    if (label === 'Concentrated') return 'bg-amber-500/15 text-amber-400';
    return 'bg-emerald-500/15 text-emerald-400';
  };

  const isTechnicalAiError = (value: unknown) => {
    const text = String(value || '').toLowerCase();
    return (
      text.includes('openai error') ||
      text.includes('apistatuserror') ||
      text.includes('api status error') ||
      text.includes('insufficient_quota') ||
      text.includes('rate limit') ||
      text.includes('quota') ||
      text.includes('429')
    );
  };

  const cleanTextList = (values?: unknown[]) =>
    (values || [])
      .map((value) => String(value || '').trim())
      .filter((value) => value && !isTechnicalAiError(value));

  const getTrigger = (row: NewAlgorithmSignal) => {
    const whyNow = cleanTextList(row.analysis.ai_judge?.why_now);
    if (whyNow.length) return whyNow[0];

    const risks = cleanTextList(row.analysis.rule_engine.risks);
    if (risks.includes('holder_concentration_high')) return 'holder concentration';
    if (risks.includes('low_safety_score')) return 'low safety score';
    if (risks.includes('seller_pressure')) return 'seller pressure';
    if (risks.includes('weak_turnover')) return 'weak turnover';
    if (risks.includes('stale_pair')) return 'stale pair';
    if (risks.includes('hard_veto')) return 'hard veto';
    return 'signal setup';
  };

  const formatRiskLabel = (risk: string) => {
    const value = String(risk || '').trim().toLowerCase();
    if (!value) return '';

    const map: Record<string, string> = {
      holder_concentration_high: 'Holder concentration',
      holder_concentration_elevated: 'Concentrated holders',
      single_holder_dominance: 'Single holder dominance',
      distribution_risk: 'Distribution risk',
      seller_pressure: 'Seller pressure',
      low_safety_score: 'Low safety score',
      weak_turnover: 'Weak turnover',
      stale_pair: 'Stale pair',
      hard_veto: 'Hard veto',
      proxy_contract: 'Proxy contract',
      honeypot_error: 'Honeypot check error',
      honeypot_unsupported_chain: 'Honeypot unsupported chain',
      goplus_unsupported_chain: 'GoPlus unsupported chain',
      safety_heuristic_only: 'Safety heuristic only',
      rugpull_risk: 'Rugpull risk',
      exit_liquidity: 'Exit liquidity risk',
    };

    if (map[value]) return map[value];

    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const formatRiskList = (risks: string[]) => {
    const cleaned = risks
      .map((risk) => formatRiskLabel(risk))
      .filter(Boolean);

    return cleaned.length ? cleaned.slice(0, 2).join(' • ') : 'Clean';
  };

  const verdictClass = (verdict: string) => {
    const value = verdict.toLowerCase();
    if (value.includes('strong pump')) return 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-400';
    if (value.includes('pump watch')) return 'border border-sky-500/20 bg-sky-500/15 text-sky-400';
    if (value.includes('distribution')) return 'border border-orange-500/20 bg-orange-500/15 text-orange-400';
    if (value.includes('rug') || value.includes('dump')) return 'border border-red-500/20 bg-red-500/15 text-red-400';
    return 'border border-border bg-muted text-muted-foreground';
  };

  const actionClass = (action: string) => {
    const value = action.toUpperCase();
    if (value === 'BUY_NOW') return 'text-emerald-400';
    if (value === 'WATCH') return 'text-sky-400';
    if (value === 'SELL') return 'text-orange-400';
    if (value === 'AVOID' || value === 'NO_ACTION') return 'text-red-400';
    return 'text-foreground';
  };

  return (
    <Card className="overflow-hidden border border-border/70">
      <CardContent className="p-0">
        <div className="border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold">Decision Table <InfoHint text="Main decision table. Shows the final verdict, action, signal quality, timing, holder structure, trigger, and red flags." /></div>

            </div>
            <Badge className="border border-primary/20 bg-primary/10 text-primary">
              {rows.length} signals
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background/95 text-[11px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 text-left font-medium">Coin</th>
                <th className="px-4 py-3 text-left font-medium">Verdict</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Signal Quality</th>
                <th className="px-4 py-3 text-left font-medium">Confidence</th>
                <th className="px-4 py-3 text-left font-medium">Timing</th>
                <th className="px-4 py-3 text-left font-medium">Wallet / Structure</th>
                <th className="px-4 py-3 text-left font-medium">Trigger</th>
                <th className="px-4 py-3 text-left font-medium">24h Volume</th>
                <th className="px-4 py-3 text-left font-medium">B/S Ratio</th>
                <th className="px-4 py-3 text-left font-medium">Red Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const features = row.analysis.rule_engine.features || {};
                const verdict = getFinalVerdict(row);
                const action = getFinalAction(row);
                const walletStructure = getWalletStructure(row);
                const aiRedFlags = cleanTextList(row.analysis.ai_judge?.red_flags);
                const ruleRisks = cleanTextList(row.analysis.rule_engine.risks);
                const risks = (aiRedFlags.length ? aiRedFlags : ruleRisks).slice(0, 3);

                return (
                  <tr
                    key={`${row.symbol}-${row.analysis.rule_engine.candidate_id}`}
                    className="border-t border-border/60 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenCoin(row.symbol, row.signal_type)}
                        className="group flex items-start gap-2 text-left transition hover:text-primary"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TickerPill>{row.symbol}</TickerPill>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.analysis.rule_engine.chain}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge className={verdictClass(verdict)}>{verdict}</Badge>
                    </td>
                    <td className={`px-4 py-3 align-top font-semibold ${actionClass(action)}`}>{action}</td>
                    <td className="px-4 py-3 align-top">
                      <Badge className={getSignalQualityClass(row)}>{getSignalQuality(row)}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top font-semibold">{getConfidence(row)}%</td>
                    <td className="px-4 py-3 align-top capitalize text-muted-foreground">{getTiming(row)}</td>
                    <td className="px-4 py-3 align-top">
                      <Badge className={getWalletStructureClass(walletStructure)}>{walletStructure}</Badge>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 align-top whitespace-normal text-muted-foreground">
                      {getTrigger(row)}
                    </td>
                    <td className="px-4 py-3 align-top font-medium">{fmtCompact(features.volume_24h_usd)}</td>
                    <td className="px-4 py-3 align-top font-medium">{fmtRatio(features.buy_sell_ratio)}</td>
                    <td className="max-w-[280px] px-4 py-3 align-top whitespace-normal text-xs text-muted-foreground">
                      {formatRiskList(risks)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


function InfoHint({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition hover:border-primary/40 hover:text-primary align-middle"
            aria-label="More information"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

interface SignalsDashboardProps {
  forcedTab?: 'pump' | 'dump' | 'all';
}

export default function SignalsDashboard({ forcedTab }: SignalsDashboardProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefresh, setNextRefresh] = useState<number>(3600);
  const [activeTab, setActiveTab] = useState('pump');
  const [subscriptionState, setSubscriptionState] = useState<'expired' | 'required' | null>(null);
  const [telegramConsensus, setTelegramConsensus] = useState<TelegramConsensusData | null>(null);
  const [intelligenceAlerts, setIntelligenceAlerts] = useState<IntelligenceAlert[]>([]);
  const [crossPlatformCards, setCrossPlatformCards] = useState<CrossPlatformConsensusCardItem[]>([]);
  const [lastManualRefreshAt, setLastManualRefreshAt] = useState<string | null>(null);
  const [flashSignals, setFlashSignals] = useState(false);

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
      return;
    }

    if (location.pathname.includes('/dashboard/dump')) setActiveTab('dump');
    else if (location.pathname.includes('/dashboard/pump')) setActiveTab('pump');
    else setActiveTab('all');
  }, [forcedTab, location.pathname]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(DASHBOARD_SCROLL_KEY);
    if (!savedScroll) return;

    sessionStorage.removeItem(DASHBOARD_SCROLL_KEY);
    const top = Number(savedScroll);
    if (Number.isNaN(top)) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: 'auto' });
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!flashSignals) return;
    const timer = window.setTimeout(() => setFlashSignals(false), 2200);
    return () => window.clearTimeout(timer);
  }, [flashSignals]);

  const handleTabChange = (tab: string) => {
    sessionStorage.setItem(DASHBOARD_SCROLL_KEY, String(window.scrollY));
    setActiveTab(tab);
    if (tab === 'pump') navigate('/dashboard/pump');
    else if (tab === 'dump') navigate('/dashboard/dump');
    else navigate('/dashboard');
  };


  const fetchSignals = useCallback(async (options?: { manual?: boolean }) => {
    const isManual = Boolean(options?.manual);
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = isManual ? { _ts: Date.now() } : undefined;
      const [signalsRes] = await Promise.all([
        axios.get('/api/crypto/signals', { headers, params }),
        token ? axios.get('/api/user/subscription', { headers, params }).catch(() => null) : Promise.resolve(null),
      ]);
      if (signalsRes.data.success) {
        const signalsData = signalsRes.data.data;
        setData(signalsData);
        setNextRefresh(3600);
        setSubscriptionState(null);
        setTelegramConsensus(signalsData.telegram_consensus || null);
        setIntelligenceAlerts(signalsData.fresh_manipulation_alerts || []);
        setCrossPlatformCards(signalsData.cross_platform_consensus || []);
        if (isManual) {
          setLastManualRefreshAt(new Date().toISOString());
          setFlashSignals(true);
        }
      }
      if (!token) {
        setTelegramConsensus(null);
        setIntelligenceAlerts([]);
        setCrossPlatformCards([]);
      }
    } catch (err: any) {
      if (err.response?.status === 402) {
        const code = err.response?.data?.detail?.error?.code;
        setSubscriptionState(code === 'SUBSCRIPTION_EXPIRED' ? 'expired' : 'required');
      }
    }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSignals(); const iv = setInterval(fetchSignals, 3600000); return () => clearInterval(iv); }, [fetchSignals]);
  useEffect(() => { const t = setInterval(() => setNextRefresh(p => Math.max(0, p - 1)), 1000); return () => clearInterval(t); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const fmtTime = (ts: string | null) => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const openCoinDetail = (symbol: string, type: 'pump' | 'dump') => {
    window.location.assign(`/coin/${symbol}?type=${type}`);
  };

  const pump = data?.pump_signals || [];
  const dump = data?.dump_signals || [];
  const newAlgorithmSignals = data?.new_algorithm_signals || [];
  const riskSignals = newAlgorithmSignals.filter((row) => {
    const r = row as any;
    const verdict = String(r.verdict || r.final_verdict || r.analysis?.final?.verdict || '').toLowerCase();
    const action = String(r.action || r.final_action || r.analysis?.final?.action || '').toLowerCase();
    const signalQuality = String(r.signal_quality || r.analysis?.rule_engine?.features?.signal_quality || '').toLowerCase();
    const walletStructure = String(r.wallet_structure || r.analysis?.rule_engine?.features?.wallet_structure || '').toLowerCase();
    const trigger = String(r.trigger || r.analysis?.final?.trigger || '').toLowerCase();
    const risk = String(r.risk || r.analysis?.final?.risk || '').toLowerCase();
    const redFlags = JSON.stringify(r.red_flags || r.analysis?.final?.red_flags || []).toLowerCase();
    const text = [verdict, action, signalQuality, walletStructure, trigger, risk, redFlags].join(' ');

    return (
      text.includes('distribution') ||
      text.includes('high-risk') ||
      text.includes('dump risk') ||
      text.includes('avoid') ||
      text.includes('suspect') ||
      text.includes('holder concentration') ||
      text.includes('single_holder_dominance') ||
      text.includes('single holder dominance') ||
      text.includes('rug') ||
      text.includes('exit liquidity')
    );
  });
  const hasAccess = data?.has_full_access !== false;
  const FREE_LIMIT = 3;
  const showAccuracyTracker = !forcedTab && location.pathname === '/dashboard';
  const activityEvents = buildActivityEvents(data, telegramConsensus, nextRefresh);
  const countdownTone =
    nextRefresh <= 60
      ? {
          wrap: 'border-red-500/25 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-background text-red-500',
          pulse: 'bg-red-500',
          icon: 'text-red-500',
        }
      : nextRefresh <= 300
        ? {
            wrap: 'border-amber-500/25 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-background text-amber-500',
            pulse: 'bg-amber-500',
            icon: 'text-amber-500',
          }
        : {
            wrap: 'border-sky-500/25 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-background text-sky-500',
            pulse: 'bg-sky-500',
            icon: 'text-sky-500',
          };

  // Show subscription expired banner
  if (subscriptionState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8" data-testid="subscription-expired">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {subscriptionState === 'expired' ? 'Your Free Trial Has Expired' : 'Start Your Free 7-Day Trial'}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {subscriptionState === 'expired'
            ? 'Your 7-day free trial has ended. Subscribe to Pro to continue receiving AI-powered PUMP & DUMP signals.'
            : 'Unlock the full signal feed with a 7-day free trial. Stripe collects billing details at checkout and billing starts only if you keep the plan active after the trial.'}
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
            { title: 'Card-Backed Trial', desc: 'Stripe collects card and billing details securely at checkout' },
            { title: 'Reminder Email', desc: 'Users get an email before the trial converts to paid' },
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
      <style>{`
        @keyframes signalFlash {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(14,165,233,0); }
          30% { transform: scale(1.015); box-shadow: 0 0 0 2px rgba(14,165,233,0.22), 0 0 32px rgba(14,165,233,0.22); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(14,165,233,0); }
        }
      `}</style>
      {data && <LivePulseBar data={data} nextRefresh={nextRefresh} telegramConsensus={telegramConsensus} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Signal Integrity <InfoHint text="Quick live summary of market context, Telegram flow, and manipulation risk for active signals." />
          </h1>
          <p className="text-muted-foreground text-sm">Live market + Telegram + risk analysis for early coordinated moves, manipulation risk, and signal quality.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${countdownTone.wrap}`}>
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-background/70">
              <span className={`absolute inline-flex h-3 w-3 rounded-full ${countdownTone.pulse} animate-ping opacity-75`} />
              <TimerReset className={`relative h-4 w-4 ${countdownTone.icon}`} />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next market scan</div>
              <div className="text-base font-black tabular-nums">{fmt(nextRefresh)}</div>
            </div>
          </div>
          {lastManualRefreshAt && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Activity className="h-3.5 w-3.5" />
              Updated {formatRelativeShort(lastManualRefreshAt)}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchSignals({ manual: true })} disabled={loading || refreshing} data-testid="refresh-btn">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {data && (
        <MarketHeatStrip
          data={data}
          telegramConsensus={telegramConsensus}
          onOpenCoin={openCoinDetail}
        />
      )}

      <ManipulationIntelStrip pump={pump} dump={dump} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp className="h-4 w-4" />, value: pump.length, label: 'PUMP Signals', color: 'text-emerald-500', bg: 'bg-emerald-500/10', testid: 'pump-count', onClick: () => navigate('/dashboard/pump') },
          { icon: <TrendingDown className="h-4 w-4" />, value: dump.length, label: 'DUMP Signals', color: 'text-red-500', bg: 'bg-red-500/10', testid: 'dump-count', onClick: () => navigate('/dashboard/dump') },
          { icon: <AlertTriangle className="h-4 w-4" />, value: riskSignals.length, label: 'RISK Signals', color: 'text-amber-500', bg: 'bg-amber-500/10', testid: 'risk-count', onClick: () => setActiveTab('risk') },
          { icon: <Activity className="h-4 w-4" />, value: fmtTime(data?.last_updated || null), label: 'Last Update', color: 'text-purple-500', bg: 'bg-purple-500/10', testid: 'last-update', onClick: () => navigate('/history') },
        ].map(s => (
          <Card
            key={s.label}
            className="cursor-pointer transition hover:border-primary/30 hover:shadow-sm"
            onClick={s.onClick}
            data-testid={`dashboard-stat-${s.testid}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} flex-shrink-0`}>{s.icon}</div>
                <div><div className={`text-xl font-bold tabular-nums ${s.color}`} data-testid={s.testid}>{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <div className="space-y-5">
          {data && newAlgorithmSignals.length > 0 && (
            <NewAlgorithmSignalsTable
              rows={newAlgorithmSignals}
              onOpenCoin={openCoinDetail}
            />
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-11 rounded-2xl border border-border/70 bg-background/80 p-1 backdrop-blur">
              <TabsTrigger
                value="pump"
                data-testid="tab-pump"
                className="gap-2 rounded-xl px-4 text-sm transition-all duration-200 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4 text-emerald-500" />PUMP <span className="bg-emerald-500/15 text-emerald-500 text-xs font-bold px-1.5 rounded-full">{pump.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="dump"
                data-testid="tab-dump"
                className="gap-2 rounded-xl px-4 text-sm transition-all duration-200 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 data-[state=active]:shadow-sm"
              >
                <TrendingDown className="h-4 w-4 text-red-500" />DUMP <span className="bg-red-500/15 text-red-500 text-xs font-bold px-1.5 rounded-full">{dump.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                data-testid="tab-risk"
                className="gap-2 rounded-xl px-4 text-sm transition-all duration-200 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />RISK <span className="bg-amber-500/15 text-amber-500 text-xs font-bold px-1.5 rounded-full">{riskSignals.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                data-testid="tab-all"
                className="rounded-xl px-4 text-sm transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm"
              >
                Cards <span className="bg-muted text-muted-foreground text-xs font-bold px-1.5 rounded-full ml-1">{pump.length + dump.length}</span>
              </TabsTrigger>
            </TabsList>

            {(['pump', 'dump', 'risk', 'all'] as const).map(tab => {
              const signals = tab === 'pump' ? pump : tab === 'dump' ? dump : tab === 'risk' ? [] : [...pump, ...dump];
              return (
                <TabsContent key={tab} value={tab} className="mt-4">
                  {loading
                    ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
                    : signals.length === 0
                      ? <EmptyState type={tab === 'dump' ? 'dump' : 'pump'} />
                      : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                          {signals.map((s, i) => <SignalCard key={`${s.signal_type}-${s.symbol}`} signal={s} blurred={!hasAccess && i >= FREE_LIMIT} onNavigate={(url) => window.location.assign(url)} snapshotUpdatedAt={data?.last_updated} flash={flashSignals} />)}
                        </div>
                  }
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <div className="space-y-5">
          {data?.market_summary && <AISummaryCard data={data} />}

          {data && (
            <NarrativeBurstCard
              data={data}
              telegramConsensus={telegramConsensus}
              alerts={intelligenceAlerts}
              onOpenCoin={openCoinDetail}
            />
          )}

          {!!crossPlatformCards.length && (
            <CrossPlatformConsensusPanel
              cards={crossPlatformCards}
              onOpenCoin={openCoinDetail}
            />
          )}

          {showAccuracyTracker && telegramConsensus && (
            <TelegramConsensusCard
              data={telegramConsensus}
              onOpenFeed={() => navigate('/telegram-signals')}
            />
          )}

          {!!intelligenceAlerts.length && (
            <IntelligenceAlertsCard
              alerts={intelligenceAlerts}
              onOpenCoin={openCoinDetail}
            />
          )}

          {showAccuracyTracker && <AccuracyTracker />}

          {data && activityEvents.length > 0 && <ActivityRail events={activityEvents} />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pb-2 flex items-center justify-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Signals are AI-generated from market data. Not financial advice. Invest responsibly.
      </p>
    </div>
  );
}
