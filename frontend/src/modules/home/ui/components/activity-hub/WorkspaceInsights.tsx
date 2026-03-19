import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

interface InsightItem {
  id: string;
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  bg: string;
}

export function WorkspaceInsights() {
  const { t } = useTranslation('activityHub');

  const insights: InsightItem[] = [
    {
      id: 'active-users',
      icon: Users,
      label: t('insights.activeUsers', 'Active Users'),
      value: '89%',
      subtext: t('insights.activeUsersSubtext', 'Last 7 days'),
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'avg-response',
      icon: Clock,
      label: t('insights.avgResponse', 'Avg. Response'),
      value: '2.4h',
      subtext: t('insights.avgResponseSubtext', 'This week'),
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'tasks-completed',
      icon: CheckCircle2,
      label: t('insights.tasksCompleted', 'Tasks Done'),
      value: '156',
      subtext: t('insights.tasksCompletedSubtext', 'This month'),
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'growth',
      icon: TrendingUp,
      label: t('insights.growth', 'Growth'),
      value: '+12%',
      subtext: t('insights.growthSubtext', 'vs last month'),
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <Card className="h-full flex flex-col" data-tour="workspace-insights">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t('insights.title', 'Workspace Insights')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3 h-full">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.id}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-transparent hover:border-muted-foreground/10 transition-colors text-center"
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-2', insight.bg)}>
                  <Icon className={cn('h-5 w-5', insight.color)} />
                </div>
                <p className="text-xl font-bold tracking-tight">{insight.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{insight.label}</p>
                {insight.subtext && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{insight.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
