import { Card, CardContent, CardHeader } from '@/shared/ui/shadcn/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/shared/ui/shadcn/components/ui/chart';
import { cn } from '@/shadcn/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

export interface TrendMetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string; // e.g. "vh" or "%"
    className?: string; // Optional override for trend colors
  };
  chartConfig: ChartConfig;
  className?: string;
  iconClassName?: string;
  children: ReactElement; // The Chart components (AreaChart, BarChart etc)
}

export function TrendMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  chartConfig,
  className,
  iconClassName,
  children
}: TrendMetricCardProps) {
  return (
    <Card className={cn("overflow-hidden shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", iconClassName)}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full",
              !trend.className && (trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
              trend.direction === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'),
              trend.className
            )}>
              <span>{trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.value}{trend.label}</span>
              {trend.direction === 'up' && <ArrowUpRight className="h-3.5 w-3.5 ml-1" />}
              {trend.direction === 'down' && <ArrowDownRight className="h-3.5 w-3.5 ml-1" />}
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-1 ml-1">{title}</div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-[60px] w-full">
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            {children}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
