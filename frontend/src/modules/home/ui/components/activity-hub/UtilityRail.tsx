import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
  Command,
  Search,
  Settings,
  HelpCircle,
  Star,
  Keyboard,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Gauge,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { QuickStat, RecentModule, ShortcutItem } from '../../../domain/models';

interface UtilityRailProps {
  stats: QuickStat[];
  recentModules: RecentModule[];
  shortcuts: ShortcutItem[];
  onModuleClick?: (moduleId: string) => void;
  onToggleFavorite?: (shortcutId: string) => void;
}

const statConfig: Record<string, { icon: typeof Users; color: string; bg: string; hoverText: string }> = {
  'stat-users': { icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', hoverText: 'View users' },
  'stat-teams': { icon: UsersRound, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', hoverText: 'Open teams' },
  'stat-invites': { icon: Mail, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', hoverText: 'View invites' },
};

const moduleIconMap: Record<string, typeof Users> = {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
};

const shortcutIconMap: Record<string, typeof Command> = {
  Command,
  Search,
  Users,
  UsersRound,
  Settings,
  HelpCircle,
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function UtilityRail({ 
  stats, 
  recentModules, 
  shortcuts, 
  onModuleClick,
  onToggleFavorite,
}: UtilityRailProps) {
  const { t } = useTranslation('activityHub');
  const navigate = useNavigate();

  const favorites = shortcuts.filter((s) => s.isFavorite);
  const others = shortcuts.filter((s) => !s.isFavorite);

  const handleModuleClick = (module: RecentModule) => {
    onModuleClick?.(module.id);
    navigate(module.path);
  };

  return (
    <aside className="space-y-8" data-tour="utility-rail">
      {/* System Snapshot */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t('utility.snapshot', 'System Snapshot')}</h3>
        </div>
        <div className="space-y-2">
          {stats.map((stat) => {
            const config = statConfig[stat.id] ?? { 
              icon: Users, 
              color: 'text-muted-foreground', 
              bg: 'bg-muted',
              hoverText: 'View details'
            };
            const Icon = config.icon;

            return (
              <button
                key={stat.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 hover:border-muted-foreground/20 transition-all duration-200 group text-left"
                onClick={() => {
                  if (stat.id === 'stat-users') navigate('/');
                  else if (stat.id === 'stat-teams') navigate('/');
                  else if (stat.id === 'stat-invites') navigate('/');
                }}
              >
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', config.bg)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold tracking-tight">{stat.value}</p>
                </div>
                {stat.change !== undefined && stat.changeDirection && (
                  <div
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full',
                      stat.changeDirection === 'up' 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                        : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                    )}
                  >
                    {stat.changeDirection === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{stat.changeDirection === 'up' ? '+' : '-'}{stat.change}</span>
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Recently Used */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t('utility.recentlyUsed', 'Recently Used')}</h3>
        </div>
        <div className="space-y-1">
          {recentModules.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {t('recentModules.empty', 'No recent modules')}
            </p>
          ) : (
            recentModules.slice(0, 5).map((module) => {
              const Icon = moduleIconMap[module.icon] ?? Users;

              return (
                <button
                  key={module.id}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{module.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(module.lastVisitedAt)}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                    {module.visitCount}×
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Shortcuts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t('utility.shortcuts', 'Shortcuts')}</h3>
        </div>
        <div className="space-y-6">
          {favorites.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                {t('shortcuts.favorites', 'Favorites')}
              </p>
              {favorites.map((shortcut) => {
                const Icon = shortcutIconMap[shortcut.icon] ?? Command;
                return (
                  <div
                    key={shortcut.id}
                    className="flex items-center gap-2 py-1.5 px-1"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 text-sm">{shortcut.label}</span>
                    {shortcut.shortcut && (
                      <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {shortcut.shortcut}
                      </kbd>
                    )}
                    {onToggleFavorite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onToggleFavorite(shortcut.id)}
                      >
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                {t('shortcuts.all', 'All Shortcuts')}
              </p>
              {others.slice(0, 3).map((shortcut) => {
                const Icon = shortcutIconMap[shortcut.icon] ?? Command;
                return (
                  <div
                    key={shortcut.id}
                    className="flex items-center gap-2 py-1.5 px-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 text-sm">{shortcut.label}</span>
                    {shortcut.shortcut && (
                      <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {shortcut.shortcut}
                      </kbd>
                    )}
                    {onToggleFavorite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onToggleFavorite(shortcut.id)}
                      >
                        <Star className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground pt-2 border-t">
            {t('shortcuts.hint', 'Press ? to see all keyboard shortcuts')}
          </p>
        </div>
      </section>
    </aside>
  );
}
