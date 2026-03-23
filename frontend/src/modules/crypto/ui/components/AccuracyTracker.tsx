import { useEffect, useState } from 'react';
import axios from 'axios';
import { Target, TrendingUp, TrendingDown, CheckCircle2, Clock, Trophy, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { readStoredToken } from '@/shared/utils/tokenStorage';

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

const getToken = () => readStoredToken();

function getScoreTone(value: number) {
  if (value >= 70) return 'text-emerald-500';
  if (value >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getVerdict(value: number) {
  if (value >= 70) return 'Reliable';
  if (value >= 50) return 'Promising';
  return 'Weak';
}

function ProgressRow({
  label,
  value,
  fillClassName,
  valueClassName,
}: {
  label: string;
  value: number;
  fillClassName: string;
  valueClassName: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${valueClassName}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${fillClassName}`}
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function WindowTrend({
  points,
}: {
  points: Array<{ label: string; value: number; samples: number }>;
}) {
  const validPoints = points.filter(point => point.samples > 0);

  if (validPoints.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="mb-3 text-sm font-semibold">Validation Window Trend</div>
      <div className="flex items-end justify-between gap-3">
        {points.map((point, index) => {
          const height = point.samples > 0 ? Math.max(18, Math.round((point.value / 100) * 96)) : 12;
          const tone = point.samples > 0
            ? point.value >= 70 ? 'bg-emerald-500'
              : point.value >= 50 ? 'bg-amber-500'
              : 'bg-red-500'
            : 'bg-muted';

          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-xs font-semibold text-muted-foreground">
                {point.samples > 0 ? `${point.value}%` : '...'}
              </div>
              <div className="relative flex h-28 w-full items-end justify-center">
                {index < points.length - 1 && (
                  <div className="absolute left-1/2 top-10 h-px w-full bg-border" />
                )}
                <div
                  className={`relative z-10 w-full max-w-[44px] rounded-t-xl transition-all duration-700 ${tone}`}
                  style={{ height }}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold">{point.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {point.samples > 0 ? `${point.samples} samples` : 'Pending'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeframeCard({
  label,
  description,
  data,
  accentClassName,
}: {
  label: string;
  description: string;
  data: AccuracyData;
  accentClassName: string;
}) {
  const hasSamples = data.samples > 0;
  const overallTone = hasSamples ? getScoreTone(data.overall) : 'text-muted-foreground';

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{label}</span>
            <Badge variant="outline" className={accentClassName}>
              {hasSamples ? getVerdict(data.overall) : 'Pending'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black tracking-tight ${overallTone}`}>
            {hasSamples ? `${data.overall}%` : '...'}
          </div>
          <div className="text-xs text-muted-foreground">
            {hasSamples ? `${data.samples} verified signals` : 'Not enough data'}
          </div>
        </div>
      </div>

      {hasSamples ? (
        <div className="space-y-3">
          <ProgressRow
            label="Overall accuracy"
            value={data.overall}
            fillClassName={data.overall >= 70 ? 'bg-emerald-500' : data.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            valueClassName={overallTone}
          />
          <ProgressRow
            label="Pump calls"
            value={data.pump}
            fillClassName="bg-emerald-500"
            valueClassName="text-emerald-500"
          />
          <ProgressRow
            label="Dump calls"
            value={data.dump}
            fillClassName="bg-red-500"
            valueClassName="text-red-500"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
          <Clock className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
          <p className="text-sm font-medium">Waiting for validated outcomes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This window will populate after enough signals complete their evaluation period.
          </p>
        </div>
      )}
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
      } catch {
        setError('Unable to load accuracy data');
      }
      setLoading(false);
    };

    fetchAccuracy();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {error || 'Accuracy data is being collected. Check back in a few hours.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const windows = [
    { key: 'accuracy_1h' as const, label: '1 Hour', description: 'Short-term move validation', accentClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-500' },
    { key: 'accuracy_4h' as const, label: '4 Hours', description: 'Intraday follow-through', accentClassName: 'border-purple-500/20 bg-purple-500/10 text-purple-500' },
    { key: 'accuracy_24h' as const, label: '24 Hours', description: 'Full-day outcome check', accentClassName: 'border-amber-500/20 bg-amber-500/10 text-amber-500' },
  ];

  const validWindows = windows.filter(({ key }) => stats[key].samples > 0);
  const totalSamples = validWindows.reduce((sum, { key }) => sum + stats[key].samples, 0);
  const weightedAccuracy = totalSamples > 0
    ? Math.round(validWindows.reduce((sum, { key }) => sum + (stats[key].overall * stats[key].samples), 0) / totalSamples)
    : 0;
  const bestWindow = validWindows.reduce<{ label: string; overall: number } | null>((best, { key, label }) => {
    if (!best || stats[key].overall > best.overall) {
      return { label, overall: stats[key].overall };
    }
    return best;
  }, null);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background" data-testid="accuracy-tracker">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Signal Accuracy Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {totalSamples === 0 ? (
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-1 font-semibold">Collecting Data</h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              We verify each signal against real market movement after 1 hour, 4 hours, and 24 hours. Results appear as soon as enough signals complete those windows.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.2fr,2fr]">
              <div className="rounded-2xl border border-primary/10 bg-background/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Weighted Model Accuracy
                </div>
                <div className={`text-5xl font-black tracking-tight ${getScoreTone(weightedAccuracy)}`}>
                  {weightedAccuracy}%
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Based only on verified signals, weighted by sample count so tiny windows do not distort the score.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Verified signals
                    </div>
                    <div className="mt-1 text-2xl font-bold">{totalSamples}</div>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      Best window
                    </div>
                    <div className="mt-1 text-lg font-bold">
                      {bestWindow ? `${bestWindow.label}` : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background/60 p-5">
                <div className="mb-2 text-sm font-semibold">How we score it</div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A signal is counted as accurate if price moved in the predicted direction within the selected timeframe. We validate PUMP and DUMP calls separately, then show the combined overall hit rate.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-500/10 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-500">
                      <TrendingUp className="h-4 w-4" />
                      Pump Calls
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tracks whether bullish calls actually moved up in the measured window.
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-500/10 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-500">
                      <TrendingDown className="h-4 w-4" />
                      Dump Calls
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tracks whether bearish warnings actually moved down in the measured window.
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="h-4 w-4" />
                      Overall
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Combined accuracy after enough real outcomes are available to judge performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <WindowTrend
              points={[
                { label: '1H', value: stats.accuracy_1h.overall, samples: stats.accuracy_1h.samples },
                { label: '4H', value: stats.accuracy_4h.overall, samples: stats.accuracy_4h.samples },
                { label: '24H', value: stats.accuracy_24h.overall, samples: stats.accuracy_24h.samples },
              ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {windows.map(({ key, label, description, accentClassName }) => (
                <TimeframeCard
                  key={key}
                  label={label}
                  description={description}
                  data={stats[key]}
                  accentClassName={accentClassName}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Verified against real market outcomes, not simulated backtests.
              </div>
              {stats.last_updated && (
                <span>Updated: {new Date(stats.last_updated).toLocaleTimeString()}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
