import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { UserPlus, UsersRound, Bell, LayoutGrid, Settings, Activity, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { ActivityStreamItem } from '../../../domain/models';

interface ActivityStreamProps {
  items: ActivityStreamItem[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: ActivityStreamItem) => void;
}

const typeConfig = {
  user: { icon: UserPlus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', emphasis: true },
  team: { icon: UsersRound, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', emphasis: true },
  notification: { icon: Bell, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', emphasis: true },
  app: { icon: LayoutGrid, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', emphasis: false },
  system: { icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10', emphasis: false },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function isToday(timestamp: string): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

interface GroupedActivities {
  today: ActivityStreamItem[];
  earlier: ActivityStreamItem[];
}

export function ActivityStream({ items, hasMore, isLoadingMore, onLoadMore, onItemClick }: ActivityStreamProps) {
  const { t } = useTranslation('activityHub');

  const grouped = useMemo<GroupedActivities>(() => {
    const today: ActivityStreamItem[] = [];
    const earlier: ActivityStreamItem[] = [];
    
    items.forEach(item => {
      if (isToday(item.timestamp)) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    });
    
    return { today, earlier };
  }, [items]);

  const renderActivityItem = (item: ActivityStreamItem) => {
    const config = typeConfig[item.type];
    const Icon = config.icon;
    const isClickable = !!onItemClick;

    return (
      <button
        key={item.id}
        className={cn(
          "flex items-start gap-3 w-full p-2.5 rounded-lg text-left transition-all duration-150 group",
          isClickable && "hover:bg-muted/50 cursor-pointer",
          !config.emphasis && "opacity-70"
        )}
        onClick={() => onItemClick?.(item)}
        disabled={!isClickable}
      >
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform',
            config.bg,
            isClickable && 'group-hover:scale-105'
          )}
        >
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={cn(
            "text-sm leading-snug",
            config.emphasis ? "text-foreground" : "text-muted-foreground"
          )}>
            {item.summary}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {formatRelativeTime(item.timestamp)}
          </p>
        </div>
        {isClickable && (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        )}
      </button>
    );
  };

  return (
    <Card data-tour="activity-stream" className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{t('activity.title', 'Activity Insights')}</CardTitle>
            <CardDescription className="text-xs">
              {t('activity.subtitle', 'Recent actions in your workspace')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('activity.empty', 'No recent activity')}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Today's activities */}
            {grouped.today.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 px-1">
                  {t('activity.today', 'Today')}
                </p>
                <div className="space-y-0.5">
                  {grouped.today.map(renderActivityItem)}
                </div>
              </div>
            )}

            {/* Earlier activities */}
            {grouped.earlier.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  {t('activity.earlier', 'Earlier')}
                </p>
                <div className="space-y-0.5">
                  {grouped.earlier.map(renderActivityItem)}
                </div>
              </div>
            )}
          </div>
        )}

        {hasMore && onLoadMore && (
          <div className="pt-3 border-t mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  {t('activity.loading', 'Loading...')}
                </>
              ) : (
                t('activity.loadMore', 'Load more')
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
