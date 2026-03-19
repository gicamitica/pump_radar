import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Zap, AlertTriangle, Lock, BarChart3, Activity, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

interface Signal {
  symbol: string;
  name: string;
  signal_strength: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  risk_level: 'low' | 'medium' | 'high';
  price?: number;
  price_change_1h?: number;
  price_change_24h?: number;
  volume_24h?: number;
  social_volume?: number;
  sentiment?: number;
  galaxy_score?: number;
  image?: string;
  signal_type: 'pump' | 'dump';
}

interface SignalData {
  pump_signals: Signal[];
  dump_signals: Signal[];
  market_summary: string;
  last_updated: string | null;
  coins_analyzed: number;
  has_full_access: boolean;
}

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

const confidenceColor = { high: 'bg-emerald-500', medium: 'bg-amber-500', low: 'bg-slate-400' };
const confidenceBadge = { high: 'default', medium: 'secondary', low: 'outline' } as const;
const riskColor = { low: 'text-emerald-500', medium: 'text-amber-500', high: 'text-red-500' };

function SignalCard({ signal, blurred, index }: { signal: Signal; blurred: boolean; index: number }) {
  const isPump = signal.signal_type === 'pump';
  const detailUrl = `/coin/${signal.symbol}?type=${signal.signal_type}`;

  const handleClick = () => {
    if (!blurred) window.open(detailUrl, '_blank');
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${blurred ? 'select-none' : 'cursor-pointer'}`}
      data-testid={`signal-card-${signal.symbol}`}
      onClick={handleClick}
    >
      {blurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-background/60 z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Necesită abonament Pro</span>
        </div>
      )}
      <div className={`absolute top-0 left-0 w-1 h-full ${isPump ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {signal.image ? (
              <img src={signal.image} alt={signal.symbol} className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {signal.symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="font-bold text-base flex items-center gap-1">
                {signal.symbol}
                {!blurred && <span className="text-muted-foreground"><svg className="inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>}
              </div>
              <div className="text-xs text-muted-foreground">{signal.name}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={confidenceBadge[signal.confidence]} className="text-xs">
              {signal.confidence === 'high' ? 'Puternic' : signal.confidence === 'medium' ? 'Mediu' : 'Slab'}
            </Badge>
            <span className={`text-xs font-medium ${riskColor[signal.risk_level]}`}>
              Risc: {signal.risk_level === 'low' ? 'Mic' : signal.risk_level === 'medium' ? 'Mediu' : 'Mare'}
            </span>
          </div>
        </div>

        {/* Signal Strength Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Putere semnal</span>
            <span className="font-semibold">{signal.signal_strength}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isPump ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${signal.signal_strength}%` }}
            />
          </div>
        </div>

        {/* AI Reason */}
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{signal.reason}</p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {signal.price !== undefined && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Preț</div>
              <div className="text-sm font-semibold">
                ${signal.price > 1 ? signal.price.toFixed(2) : signal.price.toFixed(6)}
              </div>
            </div>
          )}
          {signal.price_change_1h !== undefined && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">1h</div>
              <div className={`text-sm font-semibold ${signal.price_change_1h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {signal.price_change_1h >= 0 ? '+' : ''}{signal.price_change_1h?.toFixed(2)}%
              </div>
            </div>
          )}
          {signal.price_change_24h !== undefined && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">24h</div>
              <div className={`text-sm font-semibold ${signal.price_change_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {signal.price_change_24h >= 0 ? '+' : ''}{signal.price_change_24h?.toFixed(2)}%
              </div>
            </div>
          )}
          {signal.social_volume !== undefined && signal.social_volume > 0 && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Social Vol</div>
              <div className="text-sm font-semibold">{signal.social_volume.toLocaleString()}</div>
            </div>
          )}
          {signal.galaxy_score !== undefined && signal.galaxy_score > 0 && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Galaxy</div>
              <div className="text-sm font-semibold">{signal.galaxy_score}</div>
            </div>
          )}
          {signal.sentiment !== undefined && signal.sentiment > 0 && (
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Sentiment</div>
              <div className="text-sm font-semibold">{signal.sentiment}%</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: 'pump' | 'dump' }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'pump' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-red-100 dark:bg-red-950'}`}>
        {type === 'pump' ? <TrendingUp className="h-8 w-8 text-emerald-500" /> : <TrendingDown className="h-8 w-8 text-red-500" />}
      </div>
      <h3 className="font-semibold mb-2">Nu există semnale {type === 'pump' ? 'PUMP' : 'DUMP'} momentan</h3>
      <p className="text-muted-foreground text-sm">AI-ul analizează piața. Semnalele vor apărea în curând.</p>
    </div>
  );
}

export default function SignalsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [nextRefresh, setNextRefresh] = useState<number>(3600);
  const [activeTab, setActiveTab] = useState<string>('pump');

  // Determine tab from URL
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
      if (res.data.success) {
        setData(res.data.data);
        setLastRefresh(new Date());
        setNextRefresh(3600);
      }
    } catch (err) {
      console.error('Failed to fetch signals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 3600000); // Hourly
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefresh(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  const pumpSignals = data?.pump_signals || [];
  const dumpSignals = data?.dump_signals || [];
  const hasAccess = data?.has_full_access !== false;
  const FREE_LIMIT = 3;

  return (
    <div className="space-y-6 p-1" data-testid="signals-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Semnale AI Crypto
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pump & Dump signals analizate de AI din LunarCrush + CoinGecko
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Următor: {formatCountdown(nextRefresh)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSignals}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizare
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500" data-testid="pump-count">{pumpSignals.length}</div>
                <div className="text-xs text-muted-foreground">PUMP signals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500" data-testid="dump-count">{dumpSignals.length}</div>
                <div className="text-xs text-muted-foreground">DUMP signals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data?.coins_analyzed || 0}</div>
                <div className="text-xs text-muted-foreground">Monede analizate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-bold">{formatTime(data?.last_updated || null)}</div>
                <div className="text-xs text-muted-foreground">Ultima actualizare</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Market Summary */}
      {data?.market_summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Rezumat AI</div>
                <p className="text-sm leading-relaxed">{data.market_summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Banner */}
      {!hasAccess && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Trial expirat</p>
                <p className="text-xs text-muted-foreground">Upgradează la Pro pentru acces complet la toate semnalele</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/pages/pricing')} data-testid="upgrade-btn">
              <Zap className="h-4 w-4 mr-2" />
              Upgradează la Pro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="pump" data-testid="tab-pump" className="gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            PUMP ({pumpSignals.length})
          </TabsTrigger>
          <TabsTrigger value="dump" data-testid="tab-dump" className="gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            DUMP ({dumpSignals.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Toate ({pumpSignals.length + dumpSignals.length})
          </TabsTrigger>
        </TabsList>

        {/* PUMP Tab */}
        <TabsContent value="pump" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-3 bg-muted rounded w-32" />
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pumpSignals.length === 0 ? (
            <EmptyState type="pump" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pumpSignals.map((signal, i) => (
                <SignalCard key={signal.symbol} signal={signal} blurred={!hasAccess && i >= FREE_LIMIT} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* DUMP Tab */}
        <TabsContent value="dump" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-48 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : dumpSignals.length === 0 ? (
            <EmptyState type="dump" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dumpSignals.map((signal, i) => (
                <SignalCard key={signal.symbol} signal={signal} blurred={!hasAccess && i >= FREE_LIMIT} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ALL Tab */}
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-48 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...pumpSignals, ...dumpSignals].length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nu există semnale disponibile momentan
                </div>
              ) : (
                [...pumpSignals, ...dumpSignals].map((signal, i) => (
                  <SignalCard
                    key={`${signal.signal_type}-${signal.symbol}`}
                    signal={signal}
                    blurred={!hasAccess && i >= FREE_LIMIT * 2}
                    index={i}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center pb-4 border-t pt-4">
        <AlertTriangle className="inline-block h-3 w-3 mr-1" />
        Semnalele sunt generate de AI pe baza datelor de piață și sociale. Nu constituie sfaturi financiare.
        Investiți responsabil.
      </div>
    </div>
  );
}
