import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, BarChart3, CircleDot, Info, RefreshCw, Search, Send, ShieldCheck, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const getToken = () => readStoredToken();

type TelegramSource = {
  id: string;
  source_name: string;
  source_handle?: string | null;
  source_type: string;
  enabled: boolean;
  signal_count: number;
  verified_count: number;
  accuracy_1h: number;
  accuracy_4h: number;
  accuracy_24h: number;
  avg_move_1h_abs: number;
  avg_move_4h_abs: number;
  avg_move_24h_abs: number;
  parser_quality_avg: number;
  market_alignment_avg: number;
  structured_ratio: number;
  noise_ratio: number;
  pump_calls: number;
  dump_calls: number;
  pump_share: number;
  dump_share: number;
  bias_label: string;
  quality_badge: string;
  quality_summary: string;
  source_score: number;
  trust_tier?: 'elite' | 'proven' | 'developing' | 'speculative';
  last_signal_at?: string | null;
};

type TelegramSignal = {
  id: string;
  source_name: string;
  source_handle?: string | null;
  symbol?: string | null;
  direction: 'pump' | 'dump';
  chain?: string | null;
  parser_confidence: number;
  market_alignment_score: number;
  consensus_score: number;
  cross_source_count: number;
  source_score_at_ingest: number;
  composite_score: number;
  status: string;
  message_text: string;
  posted_at?: string | null;
  quality_judge?: {
    label?: string;
    is_trade_signal?: boolean;
    confidence?: number;
    reasons?: string[];
    classifier?: string;
  } | null;
  verification: Record<string, {
    checked_at?: string | null;
    return_pct?: number | null;
    hit?: boolean | null;
  }>;
};

type TelegramSummary = {
  total: number;
  pending: number;
  verified: number;
  pump: number;
  dump: number;
};

type TelegramConsensusSymbol = {
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
};

type TelegramConsensus = {
  headline: string;
  hours: number;
  active_sources: string[];
  signal_count: number;
  raw_signal_count?: number;
  ignored_by_quality?: number;
  bullish_mentions: number;
  bearish_mentions: number;
  hot_symbols: TelegramConsensusSymbol[];
};

export default function TelegramSignalsPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<TelegramSource[]>([]);
  const [signals, setSignals] = useState<TelegramSignal[]>([]);
  const [summary, setSummary] = useState<TelegramSummary | null>(null);
  const [consensus, setConsensus] = useState<TelegramConsensus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'useful' | 'all' | 'clean' | 'possible' | 'filtered' | 'marketing' | 'noise'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'pump' | 'dump'>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [sourceRes, signalRes, consensusRes] = await Promise.all([
        axios.get('/api/telegram/sources', { headers }),
        axios.get('/api/telegram/signals?limit=40', { headers }),
        axios.get('/api/telegram/consensus?hours=24', { headers }),
      ]);

      if (sourceRes.data.success) {
        setSources(sourceRes.data.data.sources || []);
      }
      if (signalRes.data.success) {
        setSignals(signalRes.data.data.signals || []);
        setSummary(signalRes.data.data.summary || null);
      }
      if (consensusRes.data.success) {
        setConsensus(consensusRes.data.data || null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 402) {
          navigate('/subscription', { replace: true });
          return;
        }
        if (error.response?.status === 401) {
          navigate('/auth/login', { replace: true });
          return;
        }
      }
      console.error('Failed to load telegram signals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSources = sources.filter(source => source.enabled);
  const topSources = activeSources.slice(0, 6);
  const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : 'n/a';
  const qualityBadgeStyles: Record<string, string> = {
    'High Signal Quality': 'bg-emerald-500/15 text-emerald-600',
    'Fast but Risky': 'bg-amber-500/15 text-amber-600',
    'Mostly Noise': 'bg-red-500/15 text-red-500',
    'Reliable Bearish Source': 'bg-violet-500/15 text-violet-600',
    'Mixed Quality': 'bg-slate-500/15 text-slate-500',
  };

  const getDisplayLabel = (signal: TelegramSignal) => {
    const label = signal.quality_judge?.label || signal.status || 'pending';
    if (label === 'real_trade_signal') return 'clean';
    if (label === 'possible_trade_signal') return 'possible';
    if (label === 'performance_proof_or_marketing') return 'marketing';
    if (label === 'noise_false_symbol' || label === 'official_update_or_noise') return 'noise';
    if (signal.quality_judge?.is_trade_signal === false) return 'filtered';
    return 'filtered';
  };

  const filteredSignals = signals
    .filter(signal => {
      const query = searchQuery.trim().toLowerCase();
      const displayLabel = getDisplayLabel(signal);
      const matchesSearch = !query || [
        signal.symbol,
        signal.source_name,
        signal.source_handle,
        signal.message_text,
        signal.quality_judge?.label,
      ].some(value => String(value || '').toLowerCase().includes(query));

      const matchesQuality = qualityFilter === 'all' || (qualityFilter === 'useful' ? ['clean', 'possible'].includes(displayLabel) : displayLabel === qualityFilter);
      const matchesDirection = directionFilter === 'all' || signal.direction === directionFilter;
      return matchesSearch && matchesQuality && matchesDirection;
    })
    .sort((a, b) => {
      const rank = (signal: TelegramSignal) => {
        const label = getDisplayLabel(signal);
        if (label === 'clean') return 0;
        if (label === 'possible') return 1;
        if (label === 'filtered') return 2;
        if (label === 'marketing') return 3;
        if (label === 'noise') return 4;
        return 5;
      };
      return rank(a) - rank(b);
    });

  const tableIgnoredByQuality = signals.filter(s => s.quality_judge?.is_trade_signal === false).length;
  const tableUsableSignals = signals.filter(s => s.quality_judge?.is_trade_signal === true).length;
  const displayedIgnoredByQuality = (consensus?.ignored_by_quality || 0) > 0 ? consensus?.ignored_by_quality || 0 : tableIgnoredByQuality;
  const displayedRawSignals = (consensus?.raw_signal_count || 0) > 0 ? consensus?.raw_signal_count || 0 : signals.length;
  const displayedUsableSignals = (consensus?.signal_count || 0) > 0 ? consensus?.signal_count || 0 : tableUsableSignals;

  return (
    <div className="space-y-5" data-testid="telegram-signals-page">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/30 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
              <Send className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Telegram Signals</h1>
              <p className="text-sm text-slate-400">
                Monitor parsed Telegram chatter, signal quality, and crowd-flow context.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex h-10 min-w-[280px] items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-400">
              <Search className="h-4 w-4" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search channels, symbols, messages..."
                className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 outline-none"
              />
            </div>

            <select
              value={qualityFilter}
              onChange={(event) => setQualityFilter(event.target.value as typeof qualityFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200 outline-none"
              aria-label="Quality filter"
            >
              <option value="useful">Useful only</option>\n              <option value="all">All quality</option>
              <option value="clean">Clean</option>
              <option value="possible">Possible</option>
              <option value="filtered">Filtered</option>
              <option value="marketing">Marketing / Proof</option>
              <option value="noise">Noise</option>
            </select>

            <select
              value={directionFilter}
              onChange={(event) => setDirectionFilter(event.target.value as typeof directionFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200 outline-none"
              aria-label="Direction filter"
            >
              <option value="all">All directions</option>
              <option value="pump">Pump</option>
              <option value="dump">Dump</option>
            </select>

            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-10 gap-2 border-white/10 bg-slate-950/70 text-slate-200">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          {
            label: 'Signal-Grade Channels',
            value: activeSources.length,
            tone: 'text-blue-300',
            icon: Activity,
            help: 'Active Telegram sources currently monitored and eligible for signal-quality analysis.',
          },
          {
            label: 'Parsed Mentions',
            value: summary?.total ?? 0,
            tone: 'text-cyan-300',
            icon: Send,
            help: 'Total Telegram messages parsed into candidate pump/dump mentions by the engine.',
          },
          {
            label: 'Bullish Chatter',
            value: summary?.pump ?? 0,
            tone: 'text-emerald-300',
            icon: TrendingUp,
            help: 'Parsed Telegram mentions classified as bullish, pump-oriented, long, or upside chatter.',
          },
          {
            label: 'Bearish Chatter',
            value: summary?.dump ?? 0,
            tone: 'text-red-300',
            icon: TrendingDown,
            help: 'Parsed Telegram mentions classified as bearish, dump-oriented, short, or downside chatter.',
          },
          {
            label: 'Ignored by Quality',
            value: displayedIgnoredByQuality,
            tone: 'text-purple-300',
            icon: XCircle,
            help: 'Messages kept in the database but excluded from consensus because they look like noise, marketing, false tickers, or non-actionable VIP-locked posts.',
          },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden border-white/10 bg-slate-950/80 shadow-lg shadow-black/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-xl bg-white/5 p-2">
                    <Icon className={`h-4 w-4 ${item.tone}`} />
                  </div>
                  <div className="h-8 w-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/10" />
                </div>
                <div className={`text-2xl font-bold ${item.tone}`}>{item.value}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>{item.label}</span>
                  <span title={item.help} className="inline-flex cursor-help">
                    <Info className="h-3 w-3 text-slate-500" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-300" />
                  <h2 className="text-lg font-semibold text-white">Telegram Signal Check</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Crowd-flow context after quality filtering. Marketing/proof/noise stays in DB but is ignored from consensus.
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                {consensus?.hours ?? 24}h window
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-500/15 via-slate-950/80 to-purple-500/10 p-5 shadow-lg shadow-blue-950/20">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20">
                  <Info className="h-5 w-5 text-blue-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold leading-relaxed text-blue-50 md:text-lg">
                    {(consensus?.signal_count || 0) > 0
                      ? consensus?.headline
                      : displayedUsableSignals > 0
                        ? `No repeated clean Telegram cluster detected in the last 24h. ${displayedUsableSignals} usable messages were found, but they are not yet confirmed across multiple signal-grade sources.`
                        : 'No clean Telegram signal cluster detected in the last 24h.'}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                      <span>Usable: {displayedUsableSignals}</span>
                      <span className="group relative inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-emerald-300/40 text-[10px] text-emerald-100">
                        i
                        <span className="pointer-events-none absolute left-1/2 top-6 z-50 hidden w-72 -translate-x-1/2 rounded-lg border border-emerald-400/30 bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-xl group-hover:block">
                          Messages that passed the quality filter and may be useful as trading context. They are not confirmed trades unless repeated across signal-grade sources.
                        </span>
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/15 px-3 py-1.5 text-sm font-semibold text-blue-200">
                      <span>Raw: {displayedRawSignals}</span>
                      <span className="group relative inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-blue-300/40 text-[10px] text-blue-100">
                        i
                        <span className="pointer-events-none absolute left-1/2 top-6 z-50 hidden w-64 -translate-x-1/2 rounded-lg border border-blue-400/30 bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-xl group-hover:block">
                          Total recent Telegram messages loaded from the feed before quality filtering.
                        </span>
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/15 px-3 py-1.5 text-sm font-semibold text-purple-200">
                      <span>Ignored by quality: {displayedIgnoredByQuality}</span>
                      <span className="group relative inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-purple-300/40 text-[10px] text-purple-100">
                        i
                        <span className="pointer-events-none absolute left-1/2 top-6 z-50 hidden w-80 -translate-x-1/2 rounded-lg border border-purple-400/30 bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-xl group-hover:block">
                          Messages kept in the database but excluded from consensus because they look like noise, marketing, false tickers, VIP-locked posts, or non-actionable chatter.
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-[#07101d] p-4">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:90px_40px]" />
              <svg viewBox="0 0 860 180" className="relative z-10 h-full w-full">
                <path d="M10 135 C80 115 120 138 170 118 C220 95 260 50 310 68 C360 92 390 108 440 100 C500 94 540 128 590 96 C640 68 680 120 725 88 C770 56 815 78 850 30" fill="none" stroke="#38bdf8" strokeWidth="3" />
                <path d="M10 154 C85 132 130 148 180 132 C230 118 260 90 315 98 C370 112 410 128 455 122 C505 116 545 140 595 123 C645 102 690 138 735 111 C785 88 820 108 850 60" fill="none" stroke="#a855f7" strokeWidth="3" />
              </svg>
              <div className="absolute bottom-2 left-4 right-4 z-20 flex justify-between text-[11px] text-slate-500">
                <span>24h</span><span>20h</span><span>16h</span><span>12h</span><span>8h</span><span>4h</span><span>Now</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(consensus?.hot_symbols || []).slice(0, 4).map(item => (
                <div key={item.symbol} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white">{item.symbol}/USDT</div>
                    <Badge className="border border-blue-500/20 bg-blue-500/15 text-blue-200">{item.rumor_level}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{item.mentions} mentions · {item.unique_sources} sources</div>
                  <div className={`mt-2 text-xs font-semibold ${item.stance === 'bearish' ? 'text-red-300' : item.stance === 'mixed' ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {item.stance.toUpperCase()}
                  </div>
                </div>
              ))}
              {(!consensus?.hot_symbols || consensus.hot_symbols.length === 0) && (
                <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">
                  No usable hot symbols after quality filtering.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Active Sources</h3>
                <p className="text-xs text-slate-500">{topSources.length} shown · {activeSources.length} active</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-blue-300" />
            </div>
            <div className="space-y-3">
              {topSources.slice(0, 5).map(source => (
                <div key={source.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                    <Send className="h-4 w-4 text-blue-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{source.source_name}</div>
                    <div className="truncate text-xs text-slate-500">{source.source_handle ? `@${source.source_handle}` : source.source_type}</div>
                  </div>
                  <Badge className={`text-[10px] ${qualityBadgeStyles[source.quality_badge] || qualityBadgeStyles['Mixed Quality']}`}>
                    {source.quality_badge}
                  </Badge>
                  <CircleDot className="h-3 w-3 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-950/80 shadow-xl shadow-black/20">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Telegram Signals</h2>
              <p className="text-sm text-slate-400">
                Parsed Telegram messages with quality classification: real signal, proof marketing, false ticker, or noise.
              </p>
            </div>
            <Badge className="border border-blue-500/20 bg-blue-500/15 text-blue-200">
              {filteredSignals.length} shown / {signals.length} loaded
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Direction</th>
                  <th className="px-4 py-3 text-left">Quality</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Posted</th>
                  <th className="px-4 py-3 text-left">AI Read</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.length > 0 ? filteredSignals.slice(0, 20).map(signal => {
                  const q = signal.quality_judge;
                  const label = q?.label || signal.status || 'pending';
                  const isUseful = q?.is_trade_signal === true;
                  const isNoise = q?.is_trade_signal === false;
                  const displayLabel =
                    label === 'real_trade_signal' ? 'Clean' :
                    label === 'possible_trade_signal' ? 'Possible' :
                    label === 'performance_proof_or_marketing' ? 'Marketing / Proof' :
                    label === 'noise_false_symbol' ? 'Noise' :
                    label === 'official_update_or_noise' ? 'Noise' :
                    isNoise ? 'Filtered' :
                    label.replaceAll('_', ' ');
                  const rawLabel = q?.label || signal.status || 'pending';
                  const professionalReason =
                    rawLabel === 'real_trade_signal'
                      ? 'Clean setup — review levels before action.'
                      : rawLabel === 'possible_trade_signal'
                        ? 'Possible signal — needs confirmation.'
                        : rawLabel === 'vip_locked_not_actionable'
                          ? 'VIP locked — not actionable.'
                          : rawLabel === 'performance_proof_or_marketing'
                            ? 'Marketing proof — not a live setup.'
                            : rawLabel === 'noise_false_symbol'
                              ? 'False ticker — ignored.'
                              : rawLabel === 'official_update_or_noise'
                                ? 'Community update — ignored.'
                                : q?.is_trade_signal === false
                                  ? 'Weak chatter — ignored.'
                                  : 'Needs review.';
                  const shortReason = professionalReason;
                  const qualityClass = isUseful
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                    : isNoise
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/20'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/20';
                  const score = Number(signal.composite_score || 0);

                  return (
                    <tr
                      key={signal.id}
                      className={`border-t border-white/10 hover:bg-white/[0.03] ${
                        isUseful
                          ? 'bg-emerald-500/[0.035] text-slate-200'
                          : label === 'possible_trade_signal'
                            ? 'bg-blue-500/[0.025] text-slate-200'
                            : 'text-slate-500 opacity-75'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-200">
                            {(signal.symbol || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{signal.symbol || 'n/a'} / USDT</div>
                            <div className="text-[11px] text-slate-500">{signal.chain || 'telegram'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge className={signal.direction === 'pump'
                          ? 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-300'
                          : 'border border-red-500/20 bg-red-500/15 text-red-300'}>
                          {signal.direction === 'pump'
                            ? <TrendingUp className="mr-1 h-3 w-3" />
                            : <TrendingDown className="mr-1 h-3 w-3" />}
                          {signal.direction.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge className={`border ${qualityClass}`}>
                          {displayLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{signal.source_name}</div>
                        {signal.source_handle && (
                          <div className="text-[11px] text-slate-500">@{signal.source_handle}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-semibold text-white">{score.toFixed(0)}</span>
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={score >= 60 ? 'h-full bg-emerald-400' : score >= 35 ? 'h-full bg-amber-400' : 'h-full bg-red-400'}
                              style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge className="border border-slate-500/20 bg-slate-500/15 text-slate-300">
                          {displayLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDateTime(signal.posted_at)}
                      </td>

                      <td className="max-w-[300px] truncate px-4 py-3 text-xs text-slate-400">
                        {shortReason}{shortReason.length >= 150 ? '…' : ''}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                      Telegram feed is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}