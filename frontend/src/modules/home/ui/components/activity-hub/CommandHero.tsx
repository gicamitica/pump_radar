import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import {
  Search,
  UserPlus,
  UsersRound,
  Mail,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import SpotlightCard from '../SpotlightCard';
import { CardContent } from '@/shared/ui/shadcn/components/ui/card';

interface CommandHeroProps {
  showPowerTips?: boolean;
  onStartTour?: () => void;
}

const quickActions = [
  { id: 'invite', icon: UserPlus, label: 'Invite user', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', hoverBg: 'hover:bg-blue-500/20' },
  { id: 'team', icon: UsersRound, label: 'Create team', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', hoverBg: 'hover:bg-purple-500/20' },
  { id: 'email', icon: Mail, label: 'Send test email', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', hoverBg: 'hover:bg-emerald-500/20' },
];

export function CommandHero({ showPowerTips, onStartTour }: CommandHeroProps) {
  const { t } = useTranslation('activityHub');

  // Trigger global command palette with Cmd+K (handled by GlobalCommandPalette in TopBar)
  // This button just provides a visual trigger in the hero section
  const handleOpenPalette = useCallback(() => {
    // Dispatch a keyboard event to trigger the global command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  return (
    <SpotlightCard data-tour="command-hero">
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('command.heroTitle', 'Command Center')}</h1>
              <p className="text-sm text-muted-foreground">{t('command.heroSubtitle', 'Search, navigate, or take action')}</p>
            </div>
          </div>
          
          {showPowerTips && onStartTour && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onStartTour}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {t('powerTips.trigger', 'Power Tips')}
            </Button>
          )}
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={handleOpenPalette}
          className="w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border bg-background/80 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 hover:bg-background transition-all duration-200 text-left group"
        >
          <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 text-sm text-muted-foreground">
            {t('command.placeholder', 'Search or type a command...')}
          </span>
          <kbd className="hidden sm:inline-flex h-7 select-none items-center gap-1 rounded-lg border bg-muted/80 px-2.5 font-mono text-xs font-medium text-muted-foreground">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Quick Actions */}
        <div className="flex sm:flex-row flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">{t('command.quickActions', 'Quick actions:')}</span>

          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2 text-xs font-medium transition-all duration-200 border-transparent',
                    action.bg,
                    action.hoverBg,
                    action.color
                  )}
                  onClick={() => {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </SpotlightCard>
  );
}
