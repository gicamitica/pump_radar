import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { cn } from '@/shadcn/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChartContainer,
  type ChartConfig,
} from '@/shared/ui/shadcn/components/ui/chart';

// ============================================================================
// Types
// ============================================================================

/** Layout variants control the structural arrangement */
export type MetricCardLayout = 'compact' | 'standard' | 'split' | 'centered' | 'inline';

/** Appearance variants control the visual skin */
export type MetricCardAppearance = 'soft' | 'solid' | 'gradient' | 'glass' | 'dark';

/** Semantic color variants */
export type MetricCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'info';

/** Trend indicator data */
export interface MetricCardTrend {
  /** Percentage or numeric change value */
  value: number;
  /** Direction of the trend */
  direction: 'up' | 'down';
  /** Optional label (e.g., "vs last week") */
  label?: string;
}

/** Progress indicator data */
export interface MetricCardProgress {
  /** Current progress value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
}

/** Mini chart data */
export interface MetricCardChart {
  /** Chart type */
  type: 'bar' | 'line' | 'area';
  /** Data points */
  data: number[];
  /** Chart color (uses variant color if not specified) */
  color?: string;
}

export interface MetricCardProps {
  /** Title/label for the metric */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or additional context */
  subtitle?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Additional class for the icon container */
  iconClassName?: string;
  /** Semantic color variant */
  variant?: MetricCardVariant;
  /** Layout structure */
  layout?: MetricCardLayout;
  /** Visual appearance */
  appearance?: MetricCardAppearance;
  /** Trend indicator */
  trend?: MetricCardTrend;
  /** Progress indicator */
  progress?: MetricCardProgress;
  /** Mini chart */
  chart?: MetricCardChart;
  /** Optional action link text */
  actionLabel?: string;
  /** Optional action click handler */
  onAction?: () => void;
  /** Additional class for the card container */
  className?: string;
  /** Children for custom content in split layout */
  children?: ReactNode;
}

// ============================================================================
// Style Configuration
// ============================================================================

const variantColors = {
  default: {
    base: 'text-muted-foreground',
    accent: 'text-foreground',
    icon: 'bg-muted text-muted-foreground',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-primary',
    chart: 'fill-primary stroke-primary',
  },
  primary: {
    base: 'text-primary/70',
    accent: 'text-primary',
    icon: 'bg-primary/20 text-primary',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-primary',
    chart: 'fill-primary stroke-primary',
  },
  success: {
    base: 'text-success/70',
    accent: 'text-success',
    icon: 'bg-success/20 text-success',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-success',
    chart: 'fill-success stroke-success',
  },
  warning: {
    base: 'text-warning/70',
    accent: 'text-warning',
    icon: 'bg-warning/20 text-warning',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-warning',
    chart: 'fill-warning stroke-warning',
  },
  danger: {
    base: 'text-destructive/70',
    accent: 'text-destructive',
    icon: 'bg-destructive/20 text-destructive',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-destructive',
    chart: 'fill-destructive stroke-destructive',
  },
  info: {
    base: 'text-blue-500/70',
    accent: 'text-blue-600',
    icon: 'bg-blue-500/20 text-blue-500',
    trend: { up: 'text-success', down: 'text-destructive' },
    progress: 'bg-blue-500',
    chart: 'fill-blue-500 stroke-blue-500',
  },
};

const appearanceStyles = {
  soft: {
    default: 'bg-card border',
    primary: 'bg-primary/8 border-primary/20',
    success: 'bg-success/8 border-success/20',
    warning: 'bg-warning/8 border-warning/20',
    danger: 'bg-destructive/5 border-destructive/20',
    info: 'bg-blue-500/5 border-blue-500/20',
  },
  solid: {
    default: 'bg-muted border-0',
    primary: 'bg-primary/10 border-0',
    success: 'bg-success/10 border-0',
    warning: 'bg-warning/10 border-0',
    danger: 'bg-destructive/10 border-0',
    info: 'bg-blue-500/10 border-0',
  },
  gradient: {
    default: 'bg-gradient-to-br from-muted/50 to-muted border',
    primary: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
    success: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
    warning: 'bg-gradient-to-br from-warning/15 to-warning/5 border-warning/20',
    danger: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
    info: 'bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20',
  },
  glass: {
    default: 'bg-background/60 backdrop-blur-xl border border-white/20 shadow-lg',
    primary: 'bg-primary/10 backdrop-blur-xl border border-primary/30 shadow-lg',
    success: 'bg-success/20 backdrop-blur-xl border border-success/50 shadow-lg',
    warning: 'bg-warning/20 backdrop-blur-xl border border-warning/50 shadow-lg',
    danger: 'bg-destructive/10 backdrop-blur-xl border border-destructive/30 shadow-lg',
    info: 'bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 shadow-lg',
  },
  dark: {
    default: 'bg-slate-900 border-slate-700 text-white',
    primary: 'bg-slate-900 border-primary/40 text-white shadow-primary/20 shadow-lg',
    success: 'bg-slate-900 border-success/40 text-white shadow-success/20 shadow-lg',
    warning: 'bg-slate-900 border-warning/40 text-white shadow-warning/20 shadow-lg',
    danger: 'bg-slate-900 border-destructive/40 text-white shadow-destructive/20 shadow-lg',
    info: 'bg-slate-900 border-blue-500/40 text-white shadow-blue-500/20 shadow-lg',
  },
};

// ============================================================================
// Sub-components
// ============================================================================

function TrendIndicator({ trend, variant, appearance }: { 
  trend: MetricCardTrend; 
  variant: MetricCardVariant;
  appearance: MetricCardAppearance;
}) {
  const colors = variantColors[variant];
  const TrendIcon = trend.direction === 'up' ? TrendingUp : TrendingDown;
  const trendColor = colors.trend[trend.direction];
  const isDark = appearance === 'dark';
  
  return (
    <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
      <TrendIcon className="h-4 w-4" />
      <span className={isDark ? 'text-white' : ''}>
        {trend.direction === 'up' ? '+' : ''}{trend.value}%
      </span>
      {trend.label && (
        <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
          {trend.label}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ progress, variant }: { 
  progress: MetricCardProgress; 
  variant: MetricCardVariant;
}) {
  const colors = variantColors[variant];
  const max = progress.max ?? 100;
  const percentage = Math.min(100, (progress.value / max) * 100);
  
  return (
    <div className="w-full mt-3">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', colors.progress)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {progress.showLabel && (
        <p className="text-xs text-muted-foreground mt-1">
          {progress.value} / {max} ({Math.round(percentage)}%)
        </p>
      )}
    </div>
  );
}

function MiniChart({ chart, variant }: { 
  chart: MetricCardChart; 
  variant: MetricCardVariant;
  appearance: MetricCardAppearance;
}) {
  const { data, type, color } = chart;
  
  // Transform data array to recharts format
  const chartData = data.map((value, index) => ({ index, value }));
  
  // Get color based on variant or custom color
  const variantColorMap: Record<MetricCardVariant, string> = {
    default: 'var(--primary)',
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--destructive)',
    info: 'var(--chart-1)',
  };
  
  const chartColor = color || variantColorMap[variant];
  
  const chartConfig = {
    value: {
      label: 'Value',
      color: chartColor,
    },
  } satisfies ChartConfig;
  
  if (type === 'bar') {
    return (
      <ChartContainer config={chartConfig} className="h-8 w-20">
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    );
  }
  
  if (type === 'line') {
    return (
      <ChartContainer config={chartConfig} className="h-8 w-20">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    );
  }
  
  if (type === 'area') {
    return (
      <ChartContainer config={chartConfig} className="h-8 w-20">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            fill="var(--color-value)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    );
  }
  
  return null;
}

// ============================================================================
// Layout Renderers
// ============================================================================

function CompactLayout({
  title, value, icon: Icon, trend, variant, appearance, colors, iconClassName,
}: MetricCardProps & { colors: typeof variantColors.default }) {
  const isDark = appearance === 'dark';
  
  return (
    <div className="flex items-center gap-3 p-3">
      {Icon && (
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.icon, iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
          {title}
        </p>
        <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-foreground')}>
          {value}
        </p>
      </div>
      {trend && <TrendIndicator trend={trend} variant={variant!} appearance={appearance!} />}
    </div>
  );
}

function StandardLayout({
  title, value, subtitle, icon: Icon, trend, progress, chart, variant, appearance, colors, iconClassName, actionLabel, onAction,
}: MetricCardProps & { colors: typeof variantColors.default }) {
  const isDark = appearance === 'dark';
  
  return (
    <CardContent>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-foreground')}>
              {value}
            </p>
            {trend && <TrendIndicator trend={trend} variant={variant!} appearance={appearance!} />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {chart && <MiniChart chart={chart} variant={variant!} appearance={appearance!} />}
          {Icon && (
            <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', colors.icon, iconClassName)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
      {progress && <ProgressBar progress={progress} variant={variant!} />}
      {subtitle && (
        <p className={cn('text-xs mt-2', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
          {subtitle}
        </p>
      )}
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className={cn('text-xs font-medium mt-2 hover:underline', colors.accent)}
        >
          {actionLabel}
        </button>
      )}
    </CardContent>
  );
}

function SplitLayout({
  title, value, subtitle, icon: Icon, trend, chart, children, variant, appearance, colors, iconClassName,
}: MetricCardProps & { colors: typeof variantColors.default }) {
  const isDark = appearance === 'dark';
  
  return (
    <CardContent>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colors.icon, iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
              {title}
            </p>
          </div>
          <p className={cn('text-3xl font-bold mt-2', isDark ? 'text-white' : 'text-foreground')}>
            {value}
          </p>
          {trend && (
            <div className="mt-1">
              <TrendIndicator trend={trend} variant={variant!} appearance={appearance!} />
            </div>
          )}
          {subtitle && (
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {chart && <MiniChart chart={chart} variant={variant!} appearance={appearance!} />}
          {children}
        </div>
      </div>
    </CardContent>
  );
}

function CenteredLayout({
  title, value, subtitle, icon: Icon, trend, progress, variant, appearance, colors, iconClassName,
}: MetricCardProps & { colors: typeof variantColors.default }) {
  const isDark = appearance === 'dark';
  
  return (
    <CardContent>
      <div className="flex flex-col items-center text-center">
        {Icon && (
          <div className={cn('h-14 w-14 rounded-full flex items-center justify-center mb-3', colors.icon, iconClassName)}>
            <Icon className="h-7 w-7" />
          </div>
        )}
        <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
          {title}
        </p>
        <p className={cn('text-4xl font-bold mt-1', isDark ? 'text-white' : 'text-foreground')}>
          {value}
        </p>
        {trend && (
          <div className="mt-2">
            <TrendIndicator trend={trend} variant={variant!} appearance={appearance!} />
          </div>
        )}
        {progress && <ProgressBar progress={progress} variant={variant!} />}
        {subtitle && (
          <p className={cn('text-xs mt-2', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
            {subtitle}
          </p>
        )}
      </div>
    </CardContent>
  );
}

function InlineLayout({
  title, value, icon: Icon, trend, variant, appearance, colors, iconClassName,
}: MetricCardProps & { colors: typeof variantColors.default }) {
  const isDark = appearance === 'dark';
  
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colors.icon, iconClassName)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-foreground')}>
          {title}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-foreground')}>
          {value}
        </p>
        {trend && <TrendIndicator trend={trend} variant={variant!} appearance={appearance!} />}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MetricCard - A versatile card component for displaying metrics/statistics
 * 
 * Supports multiple layouts (compact, standard, split, centered, inline),
 * appearances (soft, solid, gradient, glass, dark), and data enhancers
 * (trend indicators, progress bars, mini charts).
 * 
 * @example
 * // Basic usage
 * <MetricCard
 *   title="Total Users"
 *   value={1234}
 *   icon={Users}
 *   variant="success"
 * />
 * 
 * @example
 * // With trend and chart
 * <MetricCard
 *   title="Revenue"
 *   value="$45,678"
 *   icon={DollarSign}
 *   layout="split"
 *   appearance="gradient"
 *   trend={{ value: 12.5, direction: 'up', label: 'vs last month' }}
 *   chart={{ type: 'area', data: [10, 25, 15, 30, 45, 35, 50] }}
 * />
 * 
 * @example
 * // Centered with progress
 * <MetricCard
 *   title="Goal Progress"
 *   value="67%"
 *   layout="centered"
 *   appearance="glass"
 *   progress={{ value: 67, max: 100, showLabel: true }}
 * />
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
  variant = 'default',
  layout = 'standard',
  appearance = 'soft',
  trend,
  progress,
  chart,
  actionLabel,
  onAction,
  className,
  children,
}: MetricCardProps) {
  const colors = variantColors[variant];
  const containerStyle = appearanceStyles[appearance][variant];
  
  const layoutProps = {
    title,
    value,
    subtitle,
    icon,
    iconClassName,
    variant,
    appearance,
    trend,
    progress,
    chart,
    actionLabel,
    onAction,
    colors,
    children,
  };

  const renderLayout = () => {
    switch (layout) {
      case 'compact':
        return <CompactLayout {...layoutProps} />;
      case 'split':
        return <SplitLayout {...layoutProps} />;
      case 'centered':
        return <CenteredLayout {...layoutProps} />;
      case 'inline':
        return <InlineLayout {...layoutProps} />;
      case 'standard':
      default:
        return <StandardLayout {...layoutProps} />;
    }
  };

  return (
    <Card className={cn(containerStyle, className)}>
      {renderLayout()}
    </Card>
  );
}

export default MetricCard;
