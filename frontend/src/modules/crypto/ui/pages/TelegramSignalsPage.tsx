import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, RefreshCw, Send, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
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

export default function TelegramSignalsPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<TelegramSource[]>([]);
  const [signals, setSignals] = useState<TelegramSignal[]>([]);
  const [summary, setSummary] = useState<TelegramSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [sourceRes, signalRes] = await Promise.all([
        axios.get('/api/telegram/sources', { headers }),
        axios.get('/api/telegram/signals?limit=40', { headers }),
      ]);

      if (sourceRes.data.success) {
        setSources(sourceRes.data.data.sources || []);
      }
      if (signalRes.data.success) {
        setSignals(signalRes.data.data.signals || []);
        setSummary(signalRes.data.data.summary || null);
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
  const tierStyles: Record<string, string> = {
    elite: 'bg-emerald-500/15 text-emerald-600',
    proven: 'bg-sky-500/15 text-sky-600',
    developing: 'bg-amber-500/15 text-amber-600',
    speculative: 'bg-slate-500/15 text-slate-500',
  };
  const qualityBadgeStyles: Record<string, string> = {
    'High Signal Quality': 'bg-emerald-500/15 text-emerald-600',
    'Fast but Risky': 'bg-amber-500/15 text-amber-600',
    'Mostly Noise': 'bg-red-500/15 text-red-500',
    'Reliable Bearish Source': 'bg-violet-500/15 text-violet-600',
    'Mixed Quality': 'bg-slate-500/15 text-slate-500',
  };

  return (
    <div className="space-y-6" data-testid="telegram-signals-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
            <Send className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Telegram Source Intelligence</h1>
            <p className="text-xs text-muted-foreground">
              Track which channels actually move coins, how clean their calls are, and how often they hold up after the post.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: 'Calls Captured', value: summary?.total ?? 0, tone: 'text-foreground' },
          { label: 'Awaiting Check', value: summary?.pending ?? 0, tone: 'text-amber-500' },
          { label: 'Performance Checked', value: summary?.verified ?? 0, tone: 'text-emerald-500' },
          { label: 'Pump Calls', value: summary?.pump ?? 0, tone: 'text-emerald-500' },
          { label: 'Dump Calls', value: summary?.dump ?? 0, tone: 'text-red-500' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${item.tone}`}>{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Captured means parsed calls from your watched channels. Awaiting Check means the call is too recent to score yet.
        Performance Checked means PumpRadar already compared that call with what the market did after it was posted.
      </p>

      <div className="grid xl:grid-cols-[0.95fr_2.05fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Best Performing Channels
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Reliability ranks how usable a channel is, not just how loud it is. We score structure quality, 4h hit rate, average move after the call, noise ratio, and whether the channel leans pump or dump.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {topSources.length > 0 ? topSources.map(source => (
              <div key={source.id} className="rounded-xl border border-border bg-background/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{source.source_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {source.source_handle ? `@${source.source_handle}` : source.source_type}
                    </div>
                  </div>
                  <Badge className="bg-sky-500/15 text-sky-600 text-[10px]">
                    Reliability {source.source_score}/100
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${tierStyles[source.trust_tier || 'speculative']}`}>
                    {(source.trust_tier || 'speculative').toUpperCase()}
                  </Badge>
                  <Badge className={`text-[10px] ${qualityBadgeStyles[source.quality_badge] || qualityBadgeStyles['Mixed Quality']}`}>
                    {source.quality_badge}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {source.verified_count} checked calls
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {source.quality_summary}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">4h Hit Rate</div>
                    <div className="font-semibold text-sm">{source.accuracy_4h.toFixed(0)}%</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Avg 4h Move</div>
                    <div className="font-semibold text-sm">{source.avg_move_4h_abs.toFixed(2)}%</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Clean Calls</div>
                    <div className="font-semibold text-sm">{source.structured_ratio.toFixed(0)}%</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Noise</div>
                    <div className="font-semibold text-sm">{source.noise_ratio.toFixed(0)}%</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Bias</div>
                    <div className="font-semibold text-sm">{source.bias_label}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Calls</div>
                    <div className="font-semibold text-sm">{source.signal_count}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Parser</div>
                    <div className="font-semibold text-sm">{source.parser_quality_avg.toFixed(0)}%</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Align</div>
                    <div className="font-semibold text-sm">{source.market_alignment_avg.toFixed(0)}%</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600">
                    Pump {source.pump_calls}
                  </span>
                  <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-500">
                    Dump {source.dump_calls}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">
                  Last: {formatDateTime(source.last_signal_at)}
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground sm:col-span-2 xl:col-span-1">
                No active watched channels yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-sky-500" />
              Recent Structured Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {signals.length > 0 ? signals.map(signal => (
              <div key={signal.id} className="rounded-xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={signal.direction === 'pump' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}>
                    {signal.direction === 'pump' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {signal.direction.toUpperCase()}
                  </Badge>
                  {signal.symbol && <Badge variant="outline">{signal.symbol}</Badge>}
                  <Badge variant="outline">{signal.status}</Badge>
                  <Badge className="bg-sky-500/15 text-sky-600">Score {signal.composite_score}</Badge>
                  <span className="text-xs text-muted-foreground">{signal.source_name}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Parser', value: `${signal.parser_confidence}%` },
                    { label: 'Alignment', value: `${signal.market_alignment_score}%` },
                    { label: 'Consensus', value: `${signal.consensus_score}%` },
                    { label: 'Sources', value: signal.cross_source_count },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <div className="text-sm font-bold">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                  {signal.message_text}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Posted: {formatDateTime(signal.posted_at)}</span>
                  {signal.chain && <span>Chain: {signal.chain}</span>}
                  {signal.verification?.one_hour?.checked_at && (
                    <span>1h: {signal.verification.one_hour.return_pct}%</span>
                  )}
                  {signal.verification?.four_hour?.checked_at && (
                    <span>4h: {signal.verification.four_hour.return_pct}%</span>
                  )}
                  {signal.verification?.twenty_four_hour?.checked_at && (
                    <span>24h: {signal.verification.twenty_four_hour.return_pct}%</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-border bg-background/70 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Telegram feed is empty
                </div>
                <p className="text-sm text-muted-foreground">
                  The scoring engine is ready. Once sources are added and messages start ingesting, this page will show parsed pump/dump calls in real time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
