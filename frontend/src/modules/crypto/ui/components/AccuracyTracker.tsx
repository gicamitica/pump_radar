import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, TrendingDown, CheckCircle2, Clock, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';

interface AccuracyData {
  pump: number;
  dump: number;
  overall: number;
  samples: number;
}

interface AccuracyStats {
  accuracy_1h: AccuracyData;
  accuracy_4h: AccuracyData;
  accuracy_24h: AccuracyData;
  last_updated: string | null;
}

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

function AccuracyGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

function TimeframeCard({ 
  timeframe, 
  data,
  icon 
}: { 
  timeframe: string; 
  data: AccuracyData;
  icon: React.ReactNode;
}) {
  const overallColor = data.overall >= 70 ? '#10b981' : data.overall >= 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{timeframe}</span>
        </div>
        <span className="text-xs text-muted-foreground">{data.samples} samples</span>
      </div>
      
      <div className="flex items-center justify-around">
        <AccuracyGauge value={data.overall} label="Overall" color={overallColor} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
          <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-emerald-500">{data.pump}%</div>
          <div className="text-xs text-muted-foreground">PUMP Accuracy</div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2 text-center">
          <TrendingDown className="h-4 w-4 text-red-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-red-500">{data.dump}%</div>
          <div className="text-xs text-muted-foreground">DUMP Accuracy</div>
        </div>
      </div>
    </div>
  );
}

export default function AccuracyTracker() {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccuracy = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/crypto/accuracy', { headers });
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err: any) {
        setError('Unable to load accuracy data');
      }
      setLoading(false);
    };
    
    fetchAccuracy();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {error || 'Accuracy data is being collected. Check back in a few hours.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average overall accuracy
  const avgAccuracy = Math.round(
    (stats.accuracy_1h.overall + stats.accuracy_4h.overall + stats.accuracy_24h.overall) / 3
  );
  
  const hasSamples = stats.accuracy_1h.samples > 0 || stats.accuracy_4h.samples > 0 || stats.accuracy_24h.samples > 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background" data-testid="accuracy-tracker">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Signal Accuracy Tracker
          </div>
          {hasSamples && (
            <div className="flex items-center gap-1.5 text-xs font-normal">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">Avg:</span>
              <span className={`font-bold ${avgAccuracy >= 70 ? 'text-emerald-500' : avgAccuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {avgAccuracy}%
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSamples ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">Collecting Data</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Accuracy tracking requires historical data. Our AI is verifying predictions from the past 1h, 4h, and 24h.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Real-time verification of our AI predictions. We track if PUMP/DUMP signals came true.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TimeframeCard 
                timeframe="1 Hour" 
                data={stats.accuracy_1h}
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <TimeframeCard 
                timeframe="4 Hours" 
                data={stats.accuracy_4h}
                icon={<Clock className="h-4 w-4 text-purple-500" />}
              />
              <TimeframeCard 
                timeframe="24 Hours" 
                data={stats.accuracy_24h}
                icon={<Clock className="h-4 w-4 text-amber-500" />}
              />
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Verified against real market data
              </div>
              {stats.last_updated && (
                <span>
                  Updated: {new Date(stats.last_updated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
