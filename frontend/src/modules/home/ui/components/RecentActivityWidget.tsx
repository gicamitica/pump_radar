import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shadcn/components/ui/avatar';
import { UserPlus, UsersRound, Bell, LayoutGrid, Settings, ArrowRight, Activity } from 'lucide-react';
import { Timeline, type TimelineItemData } from '@/shared/ui/components/Timeline';
import { cn } from '@/shadcn/lib/utils';
import type { ActivityItem } from '../../domain/models';

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
}

const activityConfig: Record<string, { icon: typeof UserPlus; bg: string; color: string }> = {
  user: { icon: UserPlus, bg: 'bg-blue-500/10', color: 'text-blue-600 dark:text-blue-400' },
  team: { icon: UsersRound, bg: 'bg-purple-500/10', color: 'text-purple-600 dark:text-purple-400' },
  notification: { icon: Bell, bg: 'bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
  app: { icon: LayoutGrid, bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  system: { icon: Settings, bg: 'bg-slate-500/10', color: 'text-slate-600 dark:text-slate-400' },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  // Transform activities to Timeline format
  const timelineItems: TimelineItemData[] = activities.slice(0, 6).map((activity) => {
    const config = activityConfig[activity.type] ?? activityConfig.system;
    const Icon = config.icon;

    return {
      id: activity.id,
      icon: <Icon className={cn('h-4 w-4', config.color)} />,
      iconContainerClassName: config.bg,
      title: (
        <span className="text-sm leading-relaxed">
          <span className="font-medium text-foreground">{activity.actor.name}</span>
          <span className="text-muted-foreground"> {t(`activity.actions.${activity.action}`, activity.description)}</span>
          {activity.target && (
            <span className="font-medium text-foreground"> {activity.target.name}</span>
          )}
        </span>
      ),
      subtitle: formatRelativeTime(activity.timestamp),
      trailing: (
        <Avatar className="h-7 w-7 ring-2 ring-background">
          <AvatarImage src={activity.actor.avatarUrl} alt={activity.actor.name} />
          <AvatarFallback className="text-xs bg-muted">
            {activity.actor.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ),
    };
  });

  return (
    <Card data-tour="activity" className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">{t('activity.title')}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs group"
            onClick={() => navigate('/system/activity')}
          >
            {t('activity.viewAll')}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {activities.length > 0 ? (
          <Timeline
            items={timelineItems}
            gap="sm"
            showLine={false}
            interactive
            animateFirst
          />
        ) : (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">{t('activity.empty')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
