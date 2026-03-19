import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, TrendingDown, Brain, ExternalLink, Loader2, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

interface CoinDetail {
  symbol: string; name: string; image?: string; price: number; price_change_1h: number;
  price_change_24h: number; price_change_7d: number; volume_24h: number; market_cap: number;
  signal_type: string; signal_strength: number; reason: string; confidence: string; risk_level: string;
  ai_analysis: string; trend_conclusion: string; exchanges: { name: string; url: string; type: 'dex' | 'cex'; }[];
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

export default function CoinDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const signalType = searchParams.get('type') || 'pump';
  const [data, setData] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/crypto/coin/${symbol}?type=${signalType}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.data.success) setData(res.data.data);
      } catch { setError('Could not load data for this coin.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [symbol, signalType]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (error || !data) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="h-5 w-5" />{error}
    </div>
  );

  const isPump = data.signal_type === 'pump';
  const signalColor = isPump ? 'text-emerald-500' : 'text-red-500';
  const SignalIcon = isPump ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="coin-detail-page">
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
        <div className="text-right">
          <div className="text-3xl font-bold">${data.price > 1 ? data.price.toFixed(2) : data.price.toFixed(6)}</div>
          <div className={`text-sm font-semibold ${data.price_change_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {data.price_change_24h >= 0 ? <ArrowUpRight className="inline h-4 w-4" /> : <ArrowDownRight className="inline h-4 w-4" />}
            {Math.abs(data.price_change_24h).toFixed(2)}% (24h)
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
          <div>
            <div className="text-sm font-semibold mb-2">Main Reasons:</div>
            <p className="text-sm leading-relaxed text-muted-foreground">{data.ai_analysis}</p>
          </div>
          <div className="bg-background rounded-xl p-4 border border-primary/10">
            <div className="text-sm font-semibold text-primary mb-1">Conclusion & Trend:</div>
            <p className="text-sm leading-relaxed">{data.trend_conclusion}</p>
          </div>
        </CardContent>
      </Card>

      {/* Exchanges */}
      <Card>
        <CardHeader><CardTitle>Where to Trade {data.symbol}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.exchanges.map(ex => (
              <a key={ex.name} href={ex.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                data-testid={`exchange-${ex.name}`}>
                <div>
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">{ex.name}</div>
                  <Badge variant="outline" className="text-xs mt-1">{ex.type === 'dex' ? 'DEX' : 'CEX'}</Badge>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
