import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { 
  UserPlus, 
  Calendar, 
  CheckSquare, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Circle,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { FocusItem } from '../../../domain/models';

interface TodaysFocusProps {
  items: FocusItem[];
  onMarkDone?: (itemId: string) => void;
}

const typeConfig = {
  invitation: { icon: UserPlus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', actionLabel: 'Review' },
  event: { icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', actionLabel: 'Open' },
  task: { icon: CheckSquare, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', actionLabel: 'Fix' },
};

const priorityConfig = {
  high: { 
    label: 'High', 
    icon: AlertCircle,
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  medium: { 
    label: 'Medium', 
    icon: Circle,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  low: { 
    label: 'Low', 
    icon: Circle,
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

function formatTimeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) return 'Overdue';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

export function TodaysFocus({ items, onMarkDone }: TodaysFocusProps) {
  const { t } = useTranslation('activityHub');
  const navigate = useNavigate();

  // Sort by priority (high first) then by due date
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority ?? 'low'];
    const bPriority = priorityOrder[b.priority ?? 'low'];
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return 0;
  });

  return (
    <Card data-tour="todays-focus" className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t('focus.title', "Today's Focus")}</CardTitle>
              <CardDescription className="text-xs">
                {items.length > 0 
                  ? t('focus.subtitle', '{{count}} items need attention', { count: items.length })
                  : t('focus.allClear', 'All clear for now')
                }
              </CardDescription>
            </div>
          </div>
          {items.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {items.filter(i => i.priority === 'high').length} urgent
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <PartyPopper className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('focus.emptyTitle', "You're all caught up!")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('focus.emptyDescription', 'No pending items require your attention')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              const priority = item.priority ? priorityConfig[item.priority] : null;
              const PriorityIcon = priority?.icon;
              const overdue = item.dueAt && isOverdue(item.dueAt);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 group",
                    "hover:bg-muted/50 hover:border-muted-foreground/20",
                    overdue && "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      config.bg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{item.title}</p>
                      {priority && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                          priority.className
                        )}>
                          {PriorityIcon && <PriorityIcon className="h-2.5 w-2.5" />}
                          {priority.label}
                        </span>
                      )}
                      {overdue && (
                        <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                          Overdue
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 pt-1">
                      {item.dueAt && !overdue && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeUntil(item.dueAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onMarkDone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onMarkDone(item.id)}
                        title="Mark as done"
                      >
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-emerald-600" />
                      </Button>
                    )}
                    {item.actionPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(item.actionPath!)}
                      >
                        {item.actionLabel ?? config.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
