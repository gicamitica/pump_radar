import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, TrendingUp, TrendingDown, Clock, BarChart2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

interface HistoryEntry {
  timestamp: string;
  pump_count: number;
  dump_count: number;
  market_summary: string;
  coins_analyzed: number;
}

interface SignalSnapshot {
  timestamp: string;
  pump_signals: any[];
  dump_signals: any[];
  market_summary: string;
  fear_greed?: { value: number; classification: string };
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [snapshots, setSnapshots] = useState<SignalSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'timeline'>('chart');

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
      
      // Fetch detailed snapshots
      const snapRes = await axios.get('/api/crypto/snapshots?limit=24', { headers });
      if (snapRes.data.success) {
        setSnapshots(snapRes.data.data.snapshots || []);
      }
    } catch (err) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-lg">
        <p className="font-semibold mb-2">{data?.fullTime}</p>
        <div className="space-y-1">
          <p className="text-emerald-500">PUMP Signals: {data?.pumps}</p>
          <p className="text-red-500">DUMP Signals: {data?.dumps}</p>
          <p className="text-muted-foreground">Coins Analyzed: {data?.analyzed}</p>
        </div>
      </div>
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
            <CardTitle className="text-base">Signal Trend (Last 48h)</CardTitle>
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
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pumpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="dumpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="pumps" name="PUMP" stroke="#10b981" fill="url(#pumpGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="dumps" name="DUMP" stroke="#ef4444" fill="url(#dumpGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ) : (
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
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No historical data available yet
              </div>
            ) : (
              history.map((h, idx) => (
                <div 
                  key={idx}
                  className="border border-border rounded-lg p-3 hover:border-primary/30 transition cursor-pointer"
                  onClick={() => setExpandedSnapshot(expandedSnapshot === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-32">
                        {formatDate(h.timestamp)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {h.pump_count} PUMP
                        </Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {h.dump_count} DUMP
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{h.coins_analyzed} coins</span>
                      {expandedSnapshot === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedSnapshot === idx && h.market_summary && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">{h.market_summary}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
