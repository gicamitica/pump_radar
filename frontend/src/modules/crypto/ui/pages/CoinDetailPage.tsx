import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, Brain, ExternalLink, Loader2, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight, ArrowLeft, ShieldCheck, Target, TriangleAlert, Activity, Eye, Zap, Radio, Info, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const getToken = () => readStoredToken();

interface CoinDetail {
  symbol: string; name: string; image?: string; price: number; price_change_1h: number;
  price_change_24h: number; price_change_7d: number; volume_24h: number; market_cap: number;
  signal_type: string; signal_strength: number; reason: string; confidence: string; risk_level: string;
  ai_analysis: string; trend_conclusion: string;
  analysis_sections?: { title: string; body: string }[];
  exchanges: {
    name: string;
    url: string;
    type: 'dex' | 'cex' | 'swap';
    pair?: string;
    volume_usd?: number;
    trust_score?: string;
    logo?: string;
    source?: string;
  }[];
  preferred_venue?: {
    name: string;
    type: 'dex' | 'cex' | 'swap';
    pair?: string;
    volume_usd?: number;
    spread_pct?: number | null;
    logo?: string;
  };
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
    bullish_mentions?: number;
    bearish_mentions?: number;
    warning_flags?: string[];
    summary?: string;
  };
  manipulation_timeline?: {
    phase: string;
    status: string;
    tone: string;
    detail: string;
  }[];
  case_replay?: {
    timestamp: string;
    signal_type: 'pump' | 'dump';
    signal_strength: number;
    price_change_1h: number;
    price_change_24h: number;
    stage: string;
    manipulation_score: number;
    dump_risk_score: number;
    telegram_mentions: number;
    summary: string;
  }[];
  decision_engine?: {
    setup_bias?: string;
    trade_readiness?: string;
    execution_score?: number;
    liquidity_score?: number;
    venue_quality_score?: number;
    spread_score?: number;
    average_spread_pct?: number | null;
    volume_market_cap_ratio?: number;
    venue_count?: number;
    preferred_venue?: {
      name: string;
      type: 'dex' | 'cex' | 'swap';
      pair?: string;
      volume_usd?: number;
      spread_pct?: number | null;
      logo?: string;
    };
    entry_zone?: { low: number; high: number };
    stop_loss?: number;
    targets?: number[];
    risk_reward?: number;
    invalidation?: string;
    warning_flags?: string[];
    position_sizing_note?: string;
  };
  market_microstructure?: {
    available: boolean;
    pair?: string;
    spread_pct?: number | null;
    bid_depth_1pct_usd?: number;
    ask_depth_1pct_usd?: number;
    slippage_buy?: { usd_size: number; slippage_pct: number; fully_filled: boolean }[];
    slippage_sell?: { usd_size: number; slippage_pct: number; fully_filled: boolean }[];
    source?: string;
  };
  derivatives_data?: {
    available: boolean;
    pair?: string;
    open_interest_usd?: number | null;
    funding_rate_pct?: number | null;
    next_funding_time?: string | null;
    source?: string;
  };
  tokenomics?: {
    circulating_supply?: number | null;
    total_supply?: number | null;
    max_supply?: number | null;
    fdv_usd?: number | null;
    market_cap_usd?: number | null;
    circulating_ratio_pct?: number | null;
    dilution_gap_pct?: number | null;
    unlock_risk?: string;
    warnings?: string[];
    source?: string;
  };
  wallet_concentration?: {
    available?: boolean;
    holder_count?: number | null;
    top_10_pct?: number | null;
    next_bucket_pct?: number | null;
    owner_pct?: number | null;
    creator_pct?: number | null;
    warnings?: string[];
    source?: string;
  };
  wallet_cluster_intelligence?: {
    available?: boolean;
    cluster_risk_score?: number | null;
    cluster_risk_level?: string | null;
    insider_control_score?: number | null;
    distribution_quality_score?: number | null;
    distribution_quality?: string | null;
    holder_count?: number | null;
    top_10_pct?: number | null;
    next_10_pct?: number | null;
    next_20_pct?: number | null;
    next_60_pct?: number | null;
    long_tail_pct?: number | null;
    owner_pct?: number | null;
    creator_pct?: number | null;
    combined_insider_pct?: number | null;
    summary?: string;
    warnings?: string[];
    evidence?: string[];
    buckets?: { label: string; key: string; pct: number; tone: string }[];
    source?: string;
  };
  contract_risk?: {
    available?: boolean;
    platform?: string;
    contract_address?: string;
    risk_score?: number;
    risk_level?: string;
    buy_tax_pct?: number | null;
    sell_tax_pct?: number | null;
    warnings?: string[];
    source?: string;
  };
  lunarcrush_topic?: {
    title?: string;
    topic?: string;
    summary?: string;
    price_usd?: number | null;
    alt_rank?: number | null;
    galaxy_score?: number | null;
    engagements_24h?: number | null;
    mentions_24h?: number | null;
    creators_24h?: number | null;
    sentiment_pct?: number | null;
    social_dominance_pct?: number | null;
    insights?: string[];
    supportive_themes?: string[];
    critical_themes?: string[];
    top_news?: { text: string; label: string; url: string; meta: string }[];
    top_social_posts?: { text: string; label: string; url: string; meta: string }[];
    source?: string;
    limited_mode?: boolean;
  };
  lunarcrush_creators?: {
    title?: string;
    screen_name?: string;
    summary?: string;
    engagements?: number | null;
    mentions?: number | null;
    followers?: number | null;
    creator_rank?: number | null;
    influence_topics?: string[];
    top_assets?: string[];
    top_social_posts?: { text: string; label: string; url: string; meta: string }[];
    source?: string;
    limited_mode?: boolean;
    trust_score?: number;
    trust_badge?: string;
    influence_tier?: string;
    engagement_rate_pct?: number;
    asset_focus_score?: number;
    crypto_focus_score?: number;
    risk_flags?: string[];
  }[];
  cross_platform_consensus?: {
    score: number;
    verdict: string;
    badge: string;
    summary: string;
    platform_breakdown: {
      market: number;
      telegram: number;
      x: number;
      narrative: number;
    };
    supportive_signals: string[];
    conflict_flags: string[];
    aligned_creators: { screen_name?: string; trust_score: number; trust_badge: string }[];
  };
  platform_id?: string | null;
  contract_address?: string | null;
  chart_data: { time: string; price: number; volume: number; open: number; high: number; low: number; close: number; }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

const MetricInfoButton = ({ help }: { help: string }) => {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label={help}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <div className="pointer-events-none absolute right-0 top-7 z-20 w-52 rounded-xl border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {help}
      </div>
    </div>
  );
};

const TokenomicsRing = ({
  label,
  value,
  accentClass,
}: {
  label: string;
  value?: number | null;
  accentClass: string;
}) => {
  const normalized = Math.max(0, Math.min(100, value ?? 0));
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4 flex flex-col items-center justify-center text-center">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
          <circle
            cx="50"
            cy="50"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={accentClass}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">{value != null ? `${value.toFixed(2)}%` : 'n/a'}</div>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold">{label}</div>
    </div>
  );
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightAssetText = (text: string, symbol?: string, name?: string) => {
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
      <span key={`${part}-${index}`} className="rounded-md bg-primary/10 px-1 py-0.5 font-semibold text-foreground">
        {part}
      </span>
    );
  });
};

const SetupStatusVisual = ({
  signalType,
  signalStrength,
  analysisSections,
  manipulation,
}: {
  signalType: string;
  signalStrength: number;
  analysisSections: { title: string; body: string }[];
  manipulation?: CoinDetail['manipulation_profile'];
}) => {
  const isPump = signalType === 'pump';
  const stage = (manipulation?.stage || '').toLowerCase();
  const dumpRisk = manipulation?.dump_risk_score ?? 0;
  const riskMetricLabel = manipulation?.risk_metric_label || (isPump ? 'Reversal Risk' : 'Dump Risk');
  const coordination = manipulation?.coordinated_hype_score ?? 0;
  const earlyEntry = manipulation?.early_entry_score ?? 0;
  const hasNoActiveSignal = signalStrength <= 0 || analysisSections.some(section => section.title.toLowerCase().includes('no active signal'));

  let title = 'Momentum Building';
  let subtitle = 'The setup is forming, but still needs confirmation before it becomes a high-conviction trade.';
  let badge = 'Monitor';
  let toneClass = 'from-sky-500/15 via-cyan-500/10 to-background border-sky-500/20';
  let iconWrapClass = 'bg-sky-500/15 text-sky-500';
  let glowClass = 'bg-sky-500/25';
  let meterClass = 'bg-sky-500';
  let Icon = Activity;
  let iconAnimationClass = 'animate-pulse';

  if (hasNoActiveSignal) {
    title = 'Watchlist Only';
    subtitle = 'No live high-conviction signal is active. Treat this as a monitored asset and wait for fresh volume, price acceleration, or new social coordination.';
    badge = 'No Active Signal';
    toneClass = 'from-slate-500/10 via-cyan-500/10 to-background border-cyan-500/20';
    iconWrapClass = 'bg-cyan-500/15 text-cyan-500';
    glowClass = 'bg-cyan-500/25';
    meterClass = 'bg-cyan-500';
    Icon = Eye;
  } else if (stage.includes('unwind') || stage.includes('breakdown') || (!isPump && signalStrength >= 60)) {
    title = 'Unwind Active';
    subtitle = 'The move looks vulnerable to follow-through selling. Execution should favor defense and fast invalidation rather than aggressive chasing.';
    badge = 'Breakdown Pressure';
    toneClass = 'from-red-500/15 via-rose-500/10 to-background border-red-500/20';
    iconWrapClass = 'bg-red-500/15 text-red-500';
    glowClass = 'bg-red-500/25';
    meterClass = 'bg-red-500';
    Icon = TrendingDown;
    iconAnimationClass = 'animate-bounce';
  } else if ((isPump && (stage.includes('blow-off') || dumpRisk >= 76)) || stage.includes('exhaust')) {
    title = 'Exhaustion Risk';
    subtitle = 'This pump is no longer in the clean breakout phase. The move is stretched enough that aggressive chasing is exposed to a sharp reversal.';
    badge = 'Fast Reversal Risk';
    toneClass = 'from-amber-500/15 via-orange-500/10 to-background border-amber-500/20';
    iconWrapClass = 'bg-amber-500/15 text-amber-500';
    glowClass = 'bg-amber-500/25';
    meterClass = 'bg-amber-500';
    Icon = TriangleAlert;
    iconAnimationClass = 'animate-pulse';
  } else if (isPump && stage.includes('extended')) {
    title = 'Extended Breakout';
    subtitle = 'Momentum is still active, but the move is already stretched. Treat this as a continuation setup with late-entry risk, not as a fresh breakout from the base.';
    badge = 'Late Entry Risk';
    toneClass = 'from-amber-500/15 via-yellow-500/10 to-background border-amber-500/20';
    iconWrapClass = 'bg-amber-500/15 text-amber-500';
    glowClass = 'bg-amber-500/25';
    meterClass = 'bg-amber-500';
    Icon = Zap;
  } else if (stage.includes('coordinated') || coordination >= 65) {
    title = 'Coordinated Hype';
    subtitle = 'Multiple signals are lining up at once. The move is gaining traction across watchers, but that can also accelerate crowding and exit risk.';
    badge = 'Social Coordination';
    toneClass = 'from-violet-500/15 via-fuchsia-500/10 to-background border-violet-500/20';
    iconWrapClass = 'bg-violet-500/15 text-violet-500';
    glowClass = 'bg-violet-500/25';
    meterClass = 'bg-violet-500';
    Icon = Zap;
  } else if (stage.includes('breakout') || signalStrength >= 70) {
    title = isPump ? 'Breakout Active' : 'Breakdown Active';
    subtitle = isPump
      ? 'Momentum and participation are aligned right now. This is an actionable phase, but only while volume keeps confirming the move.'
      : 'The move is actively breaking lower. If selling pressure persists, downside continuation is more likely than a quick recovery.';
    badge = isPump ? 'Live Setup' : 'Live Breakdown';
    toneClass = isPump ? 'from-emerald-500/15 via-lime-500/10 to-background border-emerald-500/20' : 'from-red-500/15 via-rose-500/10 to-background border-red-500/20';
    iconWrapClass = isPump ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500';
    glowClass = isPump ? 'bg-emerald-500/25' : 'bg-red-500/25';
    meterClass = isPump ? 'bg-emerald-500' : 'bg-red-500';
    Icon = isPump ? TrendingUp : TrendingDown;
    iconAnimationClass = 'animate-bounce';
  } else if (stage.includes('stealth') || stage.includes('early') || earlyEntry >= 65) {
    title = 'Early Setup';
    subtitle = 'This looks like a build phase rather than a finished move. It is interesting because the opportunity is early, not because it is already confirmed.';
    badge = 'Early Signal';
    toneClass = 'from-cyan-500/15 via-sky-500/10 to-background border-cyan-500/20';
    iconWrapClass = 'bg-cyan-500/15 text-cyan-500';
    glowClass = 'bg-cyan-500/25';
    meterClass = 'bg-cyan-500';
    Icon = Eye;
  }

  const meterItems = [
    { label: 'Signal', value: signalStrength },
    { label: 'Manipulation', value: manipulation?.manipulation_score ?? 0 },
    { label: riskMetricLabel, value: dumpRisk },
  ];

  return (
    <Card className={`overflow-hidden border bg-gradient-to-br ${toneClass}`}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative mt-0.5 h-16 w-16 flex-shrink-0">
              <div className={`absolute inset-0 rounded-2xl blur-xl ${glowClass} animate-pulse`} />
              <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 ${iconWrapClass}`}>
                <Icon className={`h-8 w-8 ${iconAnimationClass}`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-background/60">
                  Setup Status
                </Badge>
                <Badge className={`${iconWrapClass} border-0`}>
                  {badge}
                </Badge>
              </div>
              <div>
                <div className="text-xl font-bold">{title}</div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="grid min-w-full grid-cols-3 gap-3 md:min-w-[320px] md:max-w-[360px]">
            {meterItems.map(item => (
              <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</div>
                <div className="mt-1 text-lg font-bold">{item.value}%</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${meterClass}`} style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CoinDetailPage() {
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const signalType = searchParams.get('type') || 'pump';
  const [data, setData] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(signalType === 'dump' ? '/dashboard/dump' : signalType === 'pump' ? '/dashboard/pump' : '/dashboard');
  };

  const fetchCoinDetail = async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const res = await axios.get(`/api/crypto/coin/${symbol}`, {
        params: {
          type: signalType,
          ...(manualRefresh ? { refresh: true, _ts: Date.now() } : {}),
        },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) setData(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 402) {
        navigate('/subscription', { replace: true });
        return;
      }
      const errorMsg = err.response?.data?.detail?.error?.message ||
                      err.response?.data?.detail ||
                      'Could not load data for this coin.';
      setError(errorMsg);
    } finally {
      if (manualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchCoinDetail(false);
  }, [symbol, signalType]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Coin Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-md">{error || 'This coin does not exist or has been delisted.'}</p>
      </div>
      <Button onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Button>
    </div>
  );

  const isPump = data.signal_type === 'pump';
  const signalColor = isPump ? 'text-emerald-500' : 'text-red-500';
  const SignalIcon = isPump ? TrendingUp : TrendingDown;
  const analysisSections = data.analysis_sections?.length
    ? data.analysis_sections
    : [
        { title: 'Main Reasons', body: data.ai_analysis },
      ];
  const exchangeGroups = [
    { type: 'cex' as const, title: 'CEX', description: 'Centralized exchanges with spot order books.' },
    { type: 'dex' as const, title: 'DEX', description: 'Decentralized venues and onchain order book markets.' },
    { type: 'swap' as const, title: 'Swap', description: 'Swap routes and AMM venues for meme coin access.' },
  ].map(group => {
    const items = data.exchanges.filter(exchange => exchange.type === group.type);
    const maxVolume = Math.max(...items.map(item => item.volume_usd || 0), 0);
    const maxTrust = Math.max(...items.map(item => {
      const trust = (item.trust_score || '').toLowerCase();
      if (trust === 'green') return 100;
      if (trust === 'yellow') return 65;
      if (trust === 'red') return 25;
      if (trust === 'high' || trust === 'strong') return 85;
      if (trust === 'medium' || trust === 'ok') return 60;
      if (trust === 'onchain') return 55;
      if (trust === 'low' || trust === 'weak') return 35;
      return 0;
    }), 0);
    const retailExchangeNames = ['binance', 'coinbase', 'kraken', 'kucoin', 'okx', 'bybit', 'bitmart', 'mexc', 'upbit', 'whitebit', 'gate'];
    const retailDexNames = ['uniswap', 'pancakeswap', 'raydium', 'jupiter', 'orca', 'meteora'];

    return {
      ...group,
      items,
      maxVolume,
      maxTrust,
      getBadges: (exchange: CoinDetail['exchanges'][number]) => {
        const badges: { label: string; className: string }[] = [];
        const trust = (exchange.trust_score || '').toLowerCase();
        const trustScore =
          trust === 'green' ? 100 :
          trust === 'yellow' ? 65 :
          trust === 'red' ? 25 :
          trust === 'high' || trust === 'strong' ? 85 :
          trust === 'medium' || trust === 'ok' ? 60 :
          trust === 'onchain' ? 55 :
          trust === 'low' || trust === 'weak' ? 35 : 0;

        if ((exchange.volume_usd || 0) > 0 && exchange.volume_usd === maxVolume) {
          badges.push({ label: 'Top Liquidity', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' });
        }
        if (trustScore > 0 && trustScore === maxTrust) {
          badges.push({ label: 'Best Trust', className: 'bg-sky-500/15 text-sky-600 border-sky-500/20' });
        }

        const name = exchange.name.toLowerCase();
        const isRetail =
          group.type === 'cex'
            ? retailExchangeNames.some(item => name.includes(item))
            : retailDexNames.some(item => name.includes(item));
        if (isRetail) {
          badges.push({ label: 'Best Retail Access', className: 'bg-amber-500/15 text-amber-700 border-amber-500/20' });
        }

        return badges.slice(0, 3);
      },
    };
  }).filter(group => group.items.length > 0);
  const formatVenueVolume = (value?: number) => {
    if (!value) return 'Volume n/a';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };
  const getVenueInitials = (name: string) =>
    name
      .split(/[\s().-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || '')
      .join('') || 'EX';
  const execution = data.decision_engine;
  const manipulation = data.manipulation_profile;
  const preferredVenue = execution?.preferred_venue || data.preferred_venue;
  const lunarTopic = data.lunarcrush_topic;
  const lunarCreators = data.lunarcrush_creators || [];
  const crossPlatform = data.cross_platform_consensus;
  const hasWalletData = Boolean(
    data.wallet_concentration?.available &&
    (
      data.wallet_concentration?.top_10_pct != null ||
      data.wallet_concentration?.owner_pct != null ||
      data.wallet_concentration?.creator_pct != null ||
      data.wallet_concentration?.holder_count != null
    )
  );
  const walletCluster = data.wallet_cluster_intelligence;
  const hasClusterData = Boolean(walletCluster?.available);
  const hasContractRiskData = Boolean(data.contract_risk?.available);
  const supportedOnchainVenuePlatforms = new Set([
    'ethereum',
    'binance-smart-chain',
    'polygon-pos',
    'arbitrum-one',
    'optimistic-ethereum',
    'avalanche',
    'base',
    'solana',
  ]);
  const hasUnsupportedOnchainPlatform = Boolean(
    data.platform_id && !supportedOnchainVenuePlatforms.has(data.platform_id)
  );
  const noVenueTitle = hasUnsupportedOnchainPlatform
    ? `Venue discovery is limited for ${data.name}`
    : `No verified venues found yet for ${data.symbol}`;
  const noVenueBody = hasUnsupportedOnchainPlatform
    ? `${data.symbol} is tracked as a native ${data.platform_id} asset, and PumpRadar's onchain venue mapper does not fully cover that network yet. We hide unverified exchanges instead of guessing.`
    : `PumpRadar only shows exchanges and swap routes that we can verify from current market data for this specific coin.`;
  const noVenueExtra = data.derivatives_data?.available
    ? `We can still confirm derivatives activity on ${data.derivatives_data.pair}, but the spot/swap venue feed did not return a verified list right now.`
    : `This usually means the current spot venue feed did not return a clean, verified market list for this asset.`;
  const formatPrice = (value?: number) => {
    if (value == null) return 'n/a';
    return value > 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(6)}`;
  };
  const formatCompactNumber = (value?: number | null) => {
    if (value == null) return 'n/a';
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };
  const clusterToneMap: Record<string, string> = {
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-500',
  };
  const clusterRiskBadgeClass =
    walletCluster?.cluster_risk_level === 'High'
      ? 'bg-rose-500/15 text-rose-600 border-0'
      : walletCluster?.cluster_risk_level === 'Medium'
        ? 'bg-amber-500/15 text-amber-700 border-0'
        : walletCluster?.cluster_risk_level === 'Low'
          ? 'bg-emerald-500/15 text-emerald-600 border-0'
          : 'bg-slate-500/15 text-slate-600 border-0';
  const ownerWalletDisplay = hasWalletData && (data.wallet_concentration?.owner_pct ?? 0) > 0
    ? `${data.wallet_concentration!.owner_pct!.toFixed(2)}%`
    : 'n/a';
  const insiderControlDisplay = (walletCluster?.insider_control_score ?? 0) > 0
    ? `${walletCluster!.insider_control_score}%`
    : 'n/a';
  const combinedInsiderDisplay = (walletCluster?.combined_insider_pct ?? 0) > 0
    ? `${walletCluster!.combined_insider_pct!.toFixed(2)}%`
    : 'n/a';
  const clusterEvidence = (walletCluster?.evidence || []).filter((item) => !/0\.00% combined/i.test(item));

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="coin-detail-page">
      <div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleBack} data-testid="coin-detail-back">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {data.image && <img src={data.image} alt={data.symbol} className="w-14 h-14 rounded-full" />}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{data.symbol}</h1>
              <Badge className={`${isPump ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-500'} gap-1`}>
                <SignalIcon className="h-3 w-3" />{isPump ? 'PUMP' : 'DUMP'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{data.name}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void fetchCoinDetail(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="text-right">
            <div className="text-3xl font-bold">${data.price > 1 ? data.price.toFixed(2) : data.price.toFixed(6)}</div>
            <div className={`text-sm font-semibold ${data.price_change_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.price_change_24h >= 0 ? <ArrowUpRight className="inline h-4 w-4" /> : <ArrowDownRight className="inline h-4 w-4" />}
              {Math.abs(data.price_change_24h).toFixed(2)}% (24h)
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '1h', val: data.price_change_1h, pct: true },
          { label: '24h', val: data.price_change_24h, pct: true },
          { label: '7d', val: data.price_change_7d, pct: true },
          { label: 'Volume 24h', val: data.volume_24h, pct: false },
        ].map(({ label, val, pct }) => (
          <Card key={label}><CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={`text-base font-bold ${pct ? (val >= 0 ? 'text-emerald-500' : 'text-red-500') : ''}`}>
              {pct ? `${val >= 0 ? '+' : ''}${val?.toFixed(2)}%` : `$${(val / 1e6).toFixed(1)}M`}
            </div>
          </CardContent></Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Price & Volume (Last 24h)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.chart_data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="price" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} />
              <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="vol" dataKey="volume" name="Volume" fill={isPump ? '#10b981' : '#ef4444'} opacity={0.4} />
              <Line yAxisId="price" type="monotone" dataKey="price" name="Price $" stroke="#6366f1" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SetupStatusVisual
        signalType={data.signal_type}
        signalStrength={data.signal_strength}
        analysisSections={analysisSections}
        manipulation={manipulation}
      />

      {/* AI Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Detailed AI Analysis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Signal Strength</div>
              <div className={`text-xl font-bold ${signalColor}`}>{data.signal_strength}%</div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${isPump ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${data.signal_strength}%` }} />
              </div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Confidence</div>
              <div className="text-xl font-bold capitalize">{data.confidence === 'high' ? 'High' : data.confidence === 'medium' ? 'Medium' : 'Low'}</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Risk</div>
              <div className={`text-xl font-bold ${data.risk_level === 'low' ? 'text-emerald-500' : data.risk_level === 'medium' ? 'text-amber-500' : 'text-red-500'}`}>
                {data.risk_level === 'low' ? 'Low' : data.risk_level === 'medium' ? 'Medium' : 'High'}
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {analysisSections.map(section => (
              <div key={section.title} className="bg-background rounded-xl border border-border p-4">
                <div className="text-sm font-semibold mb-2">{section.title}</div>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {highlightAssetText(section.body, data.symbol, data.name)}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-background rounded-xl p-4 border border-primary/10">
            <div className="text-sm font-semibold text-primary mb-1">Conclusion & Trend:</div>
            <p className="text-sm leading-relaxed">{highlightAssetText(data.trend_conclusion, data.symbol, data.name)}</p>
          </div>
        </CardContent>
      </Card>

      {manipulation && (
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sky-500" />
              Manipulation Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Manipulation Score',
                  value: `${manipulation.manipulation_score ?? 0}%`,
                  help: 'Overall intelligence score for how coordinated, unusual, or manipulation-like this move looks right now.',
                },
                {
                  label: 'Coordination',
                  value: `${manipulation.coordinated_hype_score ?? 0}%`,
                  help: 'Measures whether Telegram, social activity, and crowd behavior suggest a coordinated push rather than an isolated move.',
                },
                {
                  label: 'Early Entry',
                  value: `${manipulation.early_entry_score ?? 0}%`,
                  help: 'Higher means the setup still looks relatively early. Lower means the move is already mature or crowded.',
                },
                {
                  label: manipulation.risk_metric_label || (isPump ? 'Reversal Risk' : 'Dump Risk'),
                  value: `${manipulation.dump_risk_score ?? 0}%`,
                  help: isPump
                    ? 'For pump setups this measures how exposed the move is to a sharp reversal if traders chase too late.'
                    : 'For dump setups this measures how likely the downside move is to keep unwinding with further pressure.',
                },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <MetricInfoButton help={item.help} />
                  </div>
                  <div className="text-sm font-bold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-2">Current Read</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {highlightAssetText(manipulation.summary || '', data.symbol, data.name)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{manipulation.stage || 'n/a'}</Badge>
                  <Badge variant="outline">{manipulation.telegram_mentions ?? 0} Telegram mentions</Badge>
                  <Badge variant="outline">{manipulation.telegram_sources ?? 0} watched sources</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-2">Telegram Split</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Bullish mentions</div>
                    <div className="text-lg font-bold text-emerald-500">{manipulation.bullish_mentions ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Bearish mentions</div>
                    <div className="text-lg font-bold text-red-500">{manipulation.bearish_mentions ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Social burst</div>
                    <div className="text-lg font-bold">{manipulation.social_burst_score ?? 0}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Liquidity trap</div>
                    <div className="text-lg font-bold">{manipulation.liquidity_trap_score ?? 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            {!!data.manipulation_timeline?.length && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Manipulation Timeline</div>
                <div className="space-y-3">
                  {data.manipulation_timeline.map(event => (
                    <div key={`${event.phase}-${event.detail}`} className="relative pl-5">
                      <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                        event.tone === 'sky' ? 'bg-sky-500' :
                        event.tone === 'violet' ? 'bg-violet-500' :
                        event.tone === 'emerald' ? 'bg-emerald-500' :
                        event.tone === 'rose' ? 'bg-rose-500' :
                        event.tone === 'amber' ? 'bg-amber-500' :
                        event.tone === 'cyan' ? 'bg-cyan-500' :
                        event.tone === 'indigo' ? 'bg-indigo-500' :
                        event.tone === 'red' ? 'bg-red-500' :
                        event.tone === 'orange' ? 'bg-orange-500' : 'bg-slate-500'
                      }`} />
                      <div className="text-sm font-semibold">{event.phase}</div>
                      <div className="text-sm text-muted-foreground">{highlightAssetText(event.detail, data.symbol, data.name)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!data.case_replay?.length && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Case Replay</div>
                <div className="space-y-3">
                  {data.case_replay.map(entry => (
                    <div key={`${entry.timestamp}-${entry.signal_type}`} className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold">
                          {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={entry.signal_type === 'pump' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}>
                            {entry.signal_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{entry.stage}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Signal</div>
                          <div className="font-semibold">{entry.signal_strength}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Manipulation</div>
                          <div className="font-semibold">{entry.manipulation_score}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{manipulation.risk_metric_label || (isPump ? 'Reversal Risk' : 'Dump Risk')}</div>
                          <div className="font-semibold">{entry.dump_risk_score}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Telegram</div>
                          <div className="font-semibold">{entry.telegram_mentions}</div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{highlightAssetText(entry.summary, data.symbol, data.name)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!manipulation.warning_flags?.length && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="text-sm font-semibold mb-2">Manipulation Warnings</div>
                <div className="space-y-1">
                  {manipulation.warning_flags.map(flag => (
                    <div key={flag} className="text-sm text-muted-foreground">{flag}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {crossPlatform && (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-cyan-500" />
              Cross-Platform Consensus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Consensus', value: `${crossPlatform.score}%` },
                { label: 'Market', value: `${crossPlatform.platform_breakdown.market}%` },
                { label: 'Telegram', value: `${crossPlatform.platform_breakdown.telegram}%` },
                { label: 'X', value: `${crossPlatform.platform_breakdown.x}%` },
                { label: 'Narrative', value: `${crossPlatform.platform_breakdown.narrative}%` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-bold">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-cyan-500/15 text-cyan-600">{crossPlatform.verdict}</Badge>
                <Badge variant="outline">{crossPlatform.badge}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {highlightAssetText(crossPlatform.summary, data.symbol, data.name)}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Supportive Signals</div>
                {crossPlatform.supportive_signals?.length ? (
                  <div className="space-y-2">
                    {crossPlatform.supportive_signals.map((item) => (
                      <div key={item} className="text-sm text-muted-foreground">{highlightAssetText(item, data.symbol, data.name)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No strong supportive alignment yet.</div>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Conflict Flags</div>
                {crossPlatform.conflict_flags?.length ? (
                  <div className="space-y-2">
                    {crossPlatform.conflict_flags.map((item) => (
                      <div key={item} className="text-sm text-muted-foreground">{highlightAssetText(item, data.symbol, data.name)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No major conflict flags between the tracked channels right now.</div>
                )}
              </div>
            </div>
            {!!crossPlatform.aligned_creators?.length && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Aligned X Voices</div>
                <div className="flex flex-wrap gap-2">
                  {crossPlatform.aligned_creators.map((creator) => (
                    <Badge key={`${creator.screen_name}-${creator.trust_score}`} variant="outline">
                      @{creator.screen_name} · {creator.trust_badge} · {creator.trust_score}/100
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {lunarTopic && (
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              Social Narrative Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Social Dominance', value: lunarTopic.social_dominance_pct != null ? `${lunarTopic.social_dominance_pct.toFixed(2)}%` : 'n/a' },
                { label: 'Sentiment', value: lunarTopic.sentiment_pct != null ? `${lunarTopic.sentiment_pct}%` : 'n/a' },
                { label: 'Mentions 24h', value: formatCompactNumber(lunarTopic.mentions_24h) },
                { label: 'Creators 24h', value: formatCompactNumber(lunarTopic.creators_24h) },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-bold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{lunarTopic.source || 'LunarCrush AI'}</Badge>
                {lunarTopic.topic && <Badge variant="outline">topic: {lunarTopic.topic}</Badge>}
                {lunarTopic.limited_mode && <Badge className="bg-amber-500/15 text-amber-600">limited mode</Badge>}
              </div>
              {lunarTopic.summary && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {highlightAssetText(lunarTopic.summary, data.symbol, data.name)}
                </p>
              )}
              {!!lunarTopic.insights?.length && (
                <div className="mt-3 space-y-1">
                  {lunarTopic.insights.slice(0, 4).map(item => (
                    <div key={item} className="text-sm text-muted-foreground">
                      {highlightAssetText(item, data.symbol, data.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Supportive Themes</div>
                {lunarTopic.supportive_themes?.length ? (
                  <div className="space-y-2">
                    {lunarTopic.supportive_themes.slice(0, 3).map(theme => (
                      <div key={theme} className="text-sm text-muted-foreground">
                        {highlightAssetText(theme, data.symbol, data.name)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No supportive themes extracted yet.</div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Critical Themes</div>
                {lunarTopic.critical_themes?.length ? (
                  <div className="space-y-2">
                    {lunarTopic.critical_themes.slice(0, 3).map(theme => (
                      <div key={theme} className="text-sm text-muted-foreground">
                        {highlightAssetText(theme, data.symbol, data.name)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No critical themes extracted yet.</div>
                )}
              </div>
            </div>

            {!!lunarTopic.top_social_posts?.length && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Top Social Posts</div>
                <div className="space-y-3">
                  {lunarTopic.top_social_posts.slice(0, 3).map(post => (
                    <a key={`${post.url}-${post.text}`} href={post.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-border/70 bg-background p-3 transition hover:border-primary/30">
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {highlightAssetText(post.text, data.symbol, data.name)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{post.label} · {post.meta}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!!lunarTopic.top_news?.length && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Top News Drivers</div>
                <div className="space-y-3">
                  {lunarTopic.top_news.slice(0, 3).map(post => (
                    <a
                      key={`${post.url}-${post.text}`}
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-border/70 bg-background p-3 transition hover:border-primary/30"
                    >
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {highlightAssetText(post.text, data.symbol, data.name)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{post.label} · {post.meta}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!!lunarCreators.length && (
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-500" />
              X / Creator Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {lunarCreators.map((creator) => (
                <div key={creator.screen_name || creator.title} className="rounded-2xl border border-border bg-background/70 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {creator.screen_name ? `@${creator.screen_name}` : creator.title || 'Creator'}
                      </div>
                      {creator.summary && (
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {highlightAssetText(creator.summary, data.symbol, data.name)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{creator.source || 'LunarCrush AI'}</Badge>
                      {creator.limited_mode && <Badge className="bg-amber-500/15 text-amber-600">limited mode</Badge>}
                      {creator.trust_badge && <Badge className="bg-sky-500/15 text-sky-600">{creator.trust_badge}</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Followers', value: formatCompactNumber(creator.followers) },
                      { label: 'Engagements', value: formatCompactNumber(creator.engagements) },
                      { label: 'Mentions', value: formatCompactNumber(creator.mentions) },
                      { label: 'Trust', value: creator.trust_score != null ? `${creator.trust_score}/100` : 'n/a' },
                    ].map((item) => (
                      <div key={`${creator.screen_name}-${item.label}`} className="rounded-xl border border-border/70 bg-background p-3">
                        <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                        <div className="text-sm font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-2">Influence Topics</div>
                      {creator.influence_topics?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {creator.influence_topics.slice(0, 6).map((topic) => (
                            <Badge key={`${creator.screen_name}-${topic}`} variant="outline">{topic}</Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No topic influence extracted yet.</div>
                      )}
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-2">Top Assets Mentioned</div>
                      {creator.top_assets?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {creator.top_assets.slice(0, 6).map((asset) => (
                            <Badge key={`${creator.screen_name}-${asset}`} variant="outline">
                              {highlightAssetText(asset, data.symbol, data.name)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No asset list extracted yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-2">Engagement Quality</div>
                      <div className="text-sm font-bold">{creator.engagement_rate_pct != null ? `${creator.engagement_rate_pct.toFixed(2)}%` : 'n/a'}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-2">Asset Focus</div>
                      <div className="text-sm font-bold">{creator.asset_focus_score != null ? `${creator.asset_focus_score}/12` : 'n/a'}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-2">Influence Tier</div>
                      <div className="text-sm font-bold capitalize">{creator.influence_tier || 'n/a'}</div>
                    </div>
                  </div>

                  {!!creator.risk_flags?.length && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="text-sm font-semibold mb-2">Creator Risk Flags</div>
                      <div className="space-y-1">
                        {creator.risk_flags.map((flag) => (
                          <div key={`${creator.screen_name}-${flag}`} className="text-sm text-muted-foreground">
                            {highlightAssetText(flag, data.symbol, data.name)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!creator.top_social_posts?.length && (
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <div className="text-sm font-semibold mb-3">Recent High-Impact Posts</div>
                      <div className="space-y-3">
                        {creator.top_social_posts.slice(0, 2).map((post) => (
                          <a
                            key={`${creator.screen_name}-${post.url}`}
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border border-border/70 bg-background/70 p-3 transition hover:border-primary/30"
                          >
                            <div className="text-sm text-muted-foreground line-clamp-3">
                              {highlightAssetText(post.text, data.symbol, data.name)}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">{post.label} · {post.meta}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {execution && (
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Execution Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Execution Score', value: `${execution.execution_score ?? 0}%` },
                { label: 'Liquidity', value: `${execution.liquidity_score ?? 0}%` },
                { label: 'Venue Quality', value: `${execution.venue_quality_score ?? 0}%` },
                { label: 'Trade Readiness', value: execution.trade_readiness || 'n/a' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-bold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-primary" />
                  Execution Levels
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Entry Zone</div>
                    <div className="font-semibold">
                      {formatPrice(execution.entry_zone?.low)} to {formatPrice(execution.entry_zone?.high)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Stop Loss</div>
                    <div className="font-semibold">{formatPrice(execution.stop_loss)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target 1</div>
                    <div className="font-semibold">{formatPrice(execution.targets?.[0])}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target 2</div>
                    <div className="font-semibold">{formatPrice(execution.targets?.[1])}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Risk/Reward: <span className="font-semibold text-foreground">{execution.risk_reward?.toFixed(2) ?? 'n/a'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Market Quality
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Setup Bias</div>
                    <div className="font-semibold capitalize">{execution.setup_bias || 'n/a'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Spread</div>
                    <div className="font-semibold">{execution.average_spread_pct != null ? `${execution.average_spread_pct.toFixed(3)}%` : 'n/a'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Vol/Mcap Ratio</div>
                    <div className="font-semibold">{execution.volume_market_cap_ratio != null ? `${execution.volume_market_cap_ratio.toFixed(2)}%` : 'n/a'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Venue Count</div>
                    <div className="font-semibold">{execution.venue_count ?? 0}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{execution.position_sizing_note}</p>
              </div>
            </div>

            {preferredVenue && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-3">Preferred Execution Venue</div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                    {preferredVenue.logo ? (
                      <img src={preferredVenue.logo} alt={preferredVenue.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{preferredVenue.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{preferredVenue.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preferredVenue.pair || `${data.symbol} market`} · {preferredVenue.type.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preferredVenue.spread_pct != null ? `Spread ${preferredVenue.spread_pct.toFixed(3)}%` : 'Spread n/a'}
                      {preferredVenue.volume_usd ? ` · ${formatVenueVolume(preferredVenue.volume_usd)}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-sm font-semibold mb-2">Invalidation</div>
              <p className="text-sm text-muted-foreground">{execution.invalidation}</p>
            </div>

            {!!execution.warning_flags?.length && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <TriangleAlert className="h-4 w-4 text-amber-500" />
                  Execution Risks
                </div>
                <div className="space-y-1">
                  {execution.warning_flags.map(flag => (
                    <div key={flag} className="text-sm text-muted-foreground">{flag}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Book & Slippage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.market_microstructure?.available ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Pair</div>
                    <div className="text-sm font-bold">{data.market_microstructure.pair}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Spread</div>
                    <div className="text-sm font-bold">
                      {data.market_microstructure.spread_pct != null ? `${data.market_microstructure.spread_pct.toFixed(3)}%` : 'n/a'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Bid Depth 1%</div>
                    <div className="text-sm font-bold">${formatCompactNumber(data.market_microstructure.bid_depth_1pct_usd)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Ask Depth 1%</div>
                    <div className="text-sm font-bold">${formatCompactNumber(data.market_microstructure.ask_depth_1pct_usd)}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-sm font-semibold mb-3">Buy Slippage</div>
                    <div className="space-y-2">
                      {data.market_microstructure.slippage_buy?.map(item => (
                        <div key={`buy-${item.usd_size}`} className="flex items-center justify-between text-sm">
                          <span>${formatCompactNumber(item.usd_size)}</span>
                          <span className="font-semibold">{item.slippage_pct.toFixed(3)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-sm font-semibold mb-3">Sell Slippage</div>
                    <div className="space-y-2">
                      {data.market_microstructure.slippage_sell?.map(item => (
                        <div key={`sell-${item.usd_size}`} className="flex items-center justify-between text-sm">
                          <span>${formatCompactNumber(item.usd_size)}</span>
                          <span className="font-semibold">{item.slippage_pct.toFixed(3)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Source: {data.market_microstructure.source}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Live order book depth is not available for this coin on the currently supported venue feed.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derivatives Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.derivatives_data?.available ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Perp Pair</div>
                    <div className="text-sm font-bold">{data.derivatives_data.pair}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Open Interest</div>
                    <div className="text-sm font-bold">${formatCompactNumber(data.derivatives_data.open_interest_usd)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Funding</div>
                    <div className="text-sm font-bold">
                      {data.derivatives_data.funding_rate_pct != null ? `${data.derivatives_data.funding_rate_pct.toFixed(4)}%` : 'n/a'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Next Funding</div>
                    <div className="text-sm font-bold">
                      {data.derivatives_data.next_funding_time ? new Date(data.derivatives_data.next_funding_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'n/a'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Source: {data.derivatives_data.source}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Open interest and funding data are not available for this coin on the supported futures feed.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tokenomics & Unlock Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Circulating</div>
                <div className="text-sm font-bold">{formatCompactNumber(data.tokenomics?.circulating_supply)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-sm font-bold">{formatCompactNumber(data.tokenomics?.total_supply)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Max</div>
                <div className="text-sm font-bold">{formatCompactNumber(data.tokenomics?.max_supply)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Unlock Risk</div>
                <div className="text-sm font-bold">{data.tokenomics?.unlock_risk || 'Unknown'}</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <TokenomicsRing
                label="Circulating Ratio"
                value={data.tokenomics?.circulating_ratio_pct}
                accentClass="text-emerald-500"
              />
              <TokenomicsRing
                label="Dilution Gap"
                value={data.tokenomics?.dilution_gap_pct}
                accentClass="text-amber-500"
              />
            </div>
            {!!data.tokenomics?.warnings?.length && (
              <div className="space-y-1">
                {data.tokenomics.warnings.map(item => (
                  <div key={item} className="text-sm text-muted-foreground">{item}</div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Source: {data.tokenomics?.source}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Concentration & Contract Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Top 10 Holders</div>
                <div className="text-sm font-bold">{hasWalletData && data.wallet_concentration?.top_10_pct != null ? `${data.wallet_concentration.top_10_pct.toFixed(2)}%` : 'n/a'}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Owner Wallet</div>
                <div className="text-sm font-bold">{ownerWalletDisplay}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Contract Risk</div>
                <div className="text-sm font-bold">{hasContractRiskData ? (data.contract_risk?.risk_level || 'n/a') : 'n/a'}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Risk Score</div>
                <div className="text-sm font-bold">{hasContractRiskData ? (data.contract_risk?.risk_score ?? 'n/a') : 'n/a'}</div>
              </div>
            </div>

            {hasClusterData && (
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-background to-background p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">Wallet Cluster Intelligence</div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {walletCluster?.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={clusterRiskBadgeClass}>
                      Cluster Risk {walletCluster?.cluster_risk_level || 'n/a'}
                    </Badge>
                    <Badge variant="outline">
                      Distribution {walletCluster?.distribution_quality || 'n/a'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Cluster Risk</div>
                    <div className="text-sm font-bold">
                      {walletCluster?.cluster_risk_score != null ? `${walletCluster.cluster_risk_score}%` : 'n/a'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Insider Control</div>
                    <div className="text-sm font-bold">{insiderControlDisplay}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Distribution Quality</div>
                    <div className="text-sm font-bold">
                      {walletCluster?.distribution_quality_score != null ? `${walletCluster.distribution_quality_score}%` : 'n/a'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Combined Insider</div>
                    <div className="text-sm font-bold">{combinedInsiderDisplay}</div>
                  </div>
                </div>

                {!!walletCluster?.buckets?.length && (
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Supply Distribution Map</div>
                      <div className="text-xs text-muted-foreground">
                        Holder count: {walletCluster?.holder_count != null ? formatCompactNumber(walletCluster.holder_count) : 'n/a'}
                      </div>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      {walletCluster.buckets.map((bucket) => (
                        <div
                          key={bucket.key}
                          className={clusterToneMap[bucket.tone] || 'bg-slate-500'}
                          style={{ width: `${Math.max(0, Math.min(100, bucket.pct))}%` }}
                          title={`${bucket.label}: ${bucket.pct.toFixed(2)}%`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {walletCluster.buckets.map((bucket) => (
                        <div key={bucket.key} className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${clusterToneMap[bucket.tone] || 'bg-slate-500'}`} />
                            <span>{bucket.label}</span>
                          </div>
                          <span className="font-semibold">{bucket.pct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {!!clusterEvidence.length && (
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-sm font-semibold mb-3">Evidence</div>
                      <div className="space-y-2">
                        {clusterEvidence.map((item) => (
                          <div key={item} className="text-sm text-muted-foreground">{item}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!!walletCluster?.warnings?.length && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="text-sm font-semibold mb-3">Cluster Warnings</div>
                      <div className="space-y-2">
                        {walletCluster.warnings.map((item) => (
                          <div key={item} className="text-sm text-muted-foreground">{item}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Platform</div>
                <div className="text-sm font-bold">{hasContractRiskData ? (data.contract_risk?.platform || data.platform_id || 'n/a') : (data.platform_id || 'n/a')}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Taxes</div>
                <div className="text-sm font-bold">
                  {hasContractRiskData && (data.contract_risk?.buy_tax_pct != null || data.contract_risk?.sell_tax_pct != null)
                    ? `${data.contract_risk?.buy_tax_pct?.toFixed(2) ?? '0.00'}% / ${data.contract_risk?.sell_tax_pct?.toFixed(2) ?? '0.00'}%`
                    : 'n/a'}
                </div>
              </div>
            </div>

            {!hasWalletData && !hasContractRiskData && !hasClusterData && (
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="text-sm font-semibold mb-1">No verified holder or contract risk data yet</div>
                <p className="text-sm text-muted-foreground">
                  This section only populates when we can verify holder concentration or contract security from supported onchain sources.
                </p>
              </div>
            )}

            {!!data.wallet_concentration?.warnings?.length && (
              <div className="space-y-1">
                {data.wallet_concentration.warnings.map(item => (
                  <div key={item} className="text-sm text-muted-foreground">{item}</div>
                ))}
              </div>
            )}
            {!!data.contract_risk?.warnings?.length && (
              <div className="space-y-1">
                {data.contract_risk.warnings.map(item => (
                  <div key={item} className="text-sm text-muted-foreground">{item}</div>
                ))}
              </div>
            )}

            {walletCluster?.source && hasClusterData && (
              <p className="text-xs text-muted-foreground">Cluster source: {walletCluster.source}</p>
            )}

            {data.contract_address && (
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="text-xs text-muted-foreground mb-1">Contract</div>
                <div className="text-sm font-mono break-all">{data.contract_address}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exchanges */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Trading Venues For {data.symbol}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Only real venues returned by current market data are shown here. If a venue is missing, we did not verify active trading for this coin there.
          </p>
        </CardHeader>
        <CardContent>
          {exchangeGroups.length > 0 ? (
            <div className="space-y-6">
              {exchangeGroups.map(group => (
                <div key={group.type} className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold">{group.title}</div>
                    <div className="text-xs text-muted-foreground">{group.description}</div>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map(ex => (
                      <a key={`${group.type}-${ex.name}-${ex.pair || 'pair'}`} href={ex.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                        data-testid={`exchange-${ex.name}`}>
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl border border-border bg-background/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {ex.logo ? (
                              <img src={ex.logo} alt={ex.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">
                                {getVenueInitials(ex.name)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors">{ex.name}</div>
                            <Badge variant="outline" className="text-[10px] uppercase">{group.title}</Badge>
                            {ex.trust_score && ex.trust_score !== 'unknown' && (
                              <Badge variant="secondary" className="text-[10px]">Trust: {ex.trust_score}</Badge>
                            )}
                            {group.getBadges(ex).map(badge => (
                              <Badge key={`${ex.name}-${badge.label}`} variant="outline" className={`text-[10px] ${badge.className}`}>
                                {badge.label}
                              </Badge>
                            ))}
                            <div className="w-full mt-1 text-xs text-muted-foreground">
                              {ex.pair || `${data.symbol} market`}
                            </div>
                            <div className="w-full mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>{formatVenueVolume(ex.volume_usd)}</span>
                              {ex.source && <span>{ex.source}</span>}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-sm font-semibold mb-1">{noVenueTitle}</div>
              <p className="text-sm text-muted-foreground">
                {noVenueBody}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {noVenueExtra}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
