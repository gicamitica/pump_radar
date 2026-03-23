import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { History, TrendingUp, TrendingDown, Clock, BarChart2, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const getToken = () => readStoredToken();

interface HistoryEntry {
  timestamp: string;
  pump_count: number;
  dump_count: number;
  market_summary: string;
  coins_analyzed: number;
}

interface SnapshotSignal {
  symbol: string;
  name?: string;
  signal_strength?: number;
  reason?: string;
  confidence?: 'high' | 'medium' | 'low';
  price?: number;
}

interface SnapshotEntry extends HistoryEntry {
  pump_signals: SnapshotSignal[];
  dump_signals: SnapshotSignal[];
}

interface ReplayEntry {
  timestamp: string;
  symbol: string;
  name?: string;
  signal_type: 'pump' | 'dump';
  signal_strength: number;
  price_change_1h: number;
  price_change_24h: number;
  stage: string;
  manipulation_score: number;
  dump_risk_score: number;
  telegram_mentions: number;
  replay_label: string;
  replay_type?: string;
  action?: string;
  evidence?: string[];
  summary: string;
}

const formatTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [replays, setReplays] = useState<ReplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'timeline' | 'replay'>('chart');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch history summary
      const histRes = await axios.get('/api/crypto/history?limit=48', { headers });
      if (histRes.data.success) {
        setHistory(histRes.data.data.history || []);
      }
      
      const [snapRes, replayRes] = await Promise.all([
        axios.get('/api/crypto/snapshots?limit=24', { headers }),
        axios.get('/api/crypto/replays?limit=36', { headers }),
      ]);
      if (snapRes.data.success) setSnapshots(snapRes.data.data.snapshots || []);
      if (replayRes.data.success) setReplays(replayRes.data.data.replays || []);
    } catch (err: any) {
      if (err.response?.status === 402) {
        navigate('/subscription', { replace: true });
        return;
      }
      console.error('Failed to fetch history', err);
    }
    setLoading(false);
  };

  // Prepare chart data
  const chartData = [...history].reverse().map(h => ({
    time: formatTime(h.timestamp),
    fullTime: formatDate(h.timestamp),
    pumps: h.pump_count,
    dumps: h.dump_count,
    total: h.pump_count + h.dump_count,
    analyzed: h.coins_analyzed,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-lg">
        <p className="font-semibold mb-2">{data?.fullTime}</p>
        <div className="space-y-1">
          <p className="text-emerald-500">Pump candidates detected: {data?.pumps}</p>
          <p className="text-red-500">Dump candidates detected: {data?.dumps}</p>
          <p className="text-muted-foreground">Coins Analyzed: {data?.analyzed}</p>
        </div>
        <p className="mt-2 text-muted-foreground">
          This chart shows how many signals PumpRadar found in that hourly snapshot.
        </p>
      </div>
    );
  };

  const openSignalDetail = (symbol: string, signalType: 'pump' | 'dump') => {
    navigate(`/coin/${symbol}?type=${signalType}`);
  };

  const renderSignalChip = (signal: SnapshotSignal, signalType: 'pump' | 'dump') => {
    const toneClasses = signalType === 'pump'
      ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
      : 'border-red-500/20 bg-red-500/5 hover:border-red-500/40';
    const badgeClasses = signalType === 'pump'
      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
      : 'bg-red-500/15 text-red-500 border-red-500/20';

    return (
      <button
        key={`${signalType}-${signal.symbol}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openSignalDetail(signal.symbol, signalType);
        }}
        className={`w-full rounded-xl border p-3 text-left transition ${toneClasses}`}
        data-testid={`history-signal-${signalType}-${signal.symbol}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{signal.symbol}</span>
              <Badge variant="outline" className={badgeClasses}>
                {signalType.toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {signal.name || 'Open detailed analysis'}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {typeof signal.signal_strength === 'number' && (
              <span className="text-xs font-semibold">{signal.signal_strength}%</span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        {signal.reason && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {signal.reason}
          </p>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6" data-testid="history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
            <History className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Signal History</h1>
            <p className="text-xs text-muted-foreground">Last 48 hours of pump/dump signals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'chart' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('replay')}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'replay' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Radio className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {history.reduce((sum, h) => sum + h.pump_count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total PUMP Signals (48h)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">
              {history.reduce((sum, h) => sum + h.dump_count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total DUMP Signals (48h)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(history.reduce((sum, h) => sum + h.pump_count, 0) / Math.max(history.length, 1))}
            </div>
            <div className="text-xs text-muted-foreground">Avg PUMP/Hour</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {history.length}
            </div>
            <div className="text-xs text-muted-foreground">Snapshots Analyzed</div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'chart' ? (
        /* Chart View */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signals Detected Per Snapshot (Last 48h)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Green shows how many pump candidates were detected in each hourly snapshot. Red shows dump candidates.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No historical data available yet
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">What this means:</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Pump candidates detected
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Dump candidates detected
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barCategoryGap={10}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="pumps" name="Pump candidates" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="dumps" name="Dump candidates" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No historical data available yet
              </div>
            ) : (
              snapshots.map((snapshot, idx) => (
                <div 
                  key={idx}
                  className="border border-border rounded-lg p-3 hover:border-primary/30 transition cursor-pointer"
                  onClick={() => setExpandedSnapshot(expandedSnapshot === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-32">
                        {formatDate(snapshot.timestamp)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {snapshot.pump_count} PUMP
                        </Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {snapshot.dump_count} DUMP
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{snapshot.coins_analyzed} coins</span>
                      {expandedSnapshot === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedSnapshot === idx && (
                    <div className="mt-3 space-y-4 pt-3 border-t border-border">
                      {snapshot.market_summary && (
                        <p className="text-sm text-muted-foreground">{snapshot.market_summary}</p>
                      )}

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-semibold">PUMP Signals</h3>
                          </div>
                          {snapshot.pump_signals.length > 0 ? (
                            <div className="space-y-2">
                              {snapshot.pump_signals.map((signal) => renderSignalChip(signal, 'pump'))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No PUMP signals in this snapshot.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <h3 className="text-sm font-semibold">DUMP Signals</h3>
                          </div>
                          {snapshot.dump_signals.length > 0 ? (
                            <div className="space-y-2">
                              {snapshot.dump_signals.map((signal) => renderSignalChip(signal, 'dump'))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No DUMP signals in this snapshot.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manipulation Case Replay</CardTitle>
            <p className="text-sm text-muted-foreground">
              Structured replay of recent setups so you can see what matured cleanly, what got crowded, and what moved into unwind risk.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : replays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No replay data available yet
              </div>
            ) : (
              replays.map((entry) => (
                <button
                  key={`${entry.timestamp}-${entry.symbol}-${entry.signal_type}`}
                  type="button"
                  onClick={() => openSignalDetail(entry.symbol, entry.signal_type)}
                  className="w-full rounded-xl border border-border bg-background/70 p-4 text-left transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{entry.symbol}</span>
                        <Badge className={entry.signal_type === 'pump' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}>
                          {entry.signal_type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {entry.stage}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.name || entry.symbol} · {formatDate(entry.timestamp)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.replay_type && (
                        <Badge variant="outline" className="text-[10px]">
                          {entry.replay_type}
                        </Badge>
                      )}
                      <div className="text-xs font-semibold text-muted-foreground">
                        {entry.replay_label}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Signal</div>
                      <div className="font-semibold">{entry.signal_strength}%</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Manipulation</div>
                      <div className="font-semibold">{entry.manipulation_score}%</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Dump Risk</div>
                      <div className="font-semibold">{entry.dump_risk_score}%</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">1h Move</div>
                      <div className={`font-semibold ${entry.price_change_1h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {entry.price_change_1h >= 0 ? '+' : ''}{entry.price_change_1h.toFixed(2)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Telegram</div>
                      <div className="font-semibold">{entry.telegram_mentions}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{entry.summary}</p>
                  {entry.action && (
                    <div className="mt-2 text-xs font-medium text-foreground/80">
                      Action: {entry.action}
                    </div>
                  )}
                  {!!entry.evidence?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.evidence.slice(0, 4).map((item) => (
                        <span key={`${entry.symbol}-${entry.timestamp}-${item}`} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
