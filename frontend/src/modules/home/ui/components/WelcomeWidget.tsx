import { useTranslation } from 'react-i18next';
import { CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shadcn/components/ui/avatar';
import { Compass, Users, UsersRound, Globe } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { Environment, SystemStats } from '../../domain/models';
import SpotlightCard from './SpotlightCard';

interface WelcomeWidgetProps {
  userName: string;
  userAvatarUrl?: string;
  workspaceName: string;
  environment: Environment;
  stats: SystemStats;
  tourCompleted: boolean;
  onStartTour: () => void;
}

const environmentConfig: Record<Environment, { label: string; color: string; bg: string }> = {
  development: { label: 'Dev', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  staging: { label: 'Staging', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  production: { label: 'Production', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

export function WelcomeWidget({
  userName,
  userAvatarUrl,
  workspaceName,
  environment,
  stats,
  tourCompleted,
  onStartTour,
}: WelcomeWidgetProps) {
  const { t } = useTranslation('home');
  const envConfig = environmentConfig[environment];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SpotlightCard data-tour="welcome">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
      
      <CardContent className="relative pt-6 pb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 border-2 border-primary/20 ring-4 ring-primary/5 transition-transform duration-300 hover:scale-105">
              <AvatarImage src={userAvatarUrl} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-lg font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background">
              <span className="sr-only">Online</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with greeting and tour button */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {t('welcome.greeting', { name: userName })}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="font-medium">{workspaceName}</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    envConfig.bg,
                    envConfig.color
                  )}>
                    <Globe className="h-3 w-3" />
                    {envConfig.label}
                  </span>
                </div>
              </div>

              {/* Tour button - positioned inline with greeting */}
              <Button 
                onClick={onStartTour} 
                variant={tourCompleted ? "outline" : "default"}
                size="sm"
                className={cn(
                  "shrink-0 gap-2 transition-all duration-300",
                  !tourCompleted && "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                )}
              >
                <Compass className={cn("h-4 w-4", !tourCompleted && "animate-pulse")} />
                {tourCompleted ? t('welcome.retakeTour') : t('welcome.takeTour')}
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold">{stats.totalUsers}</span>
                <span className="text-xs text-muted-foreground">{t('welcome.users')}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
                <div className="h-6 w-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <UsersRound className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold">{stats.activeTeams}</span>
                <span className="text-xs text-muted-foreground">{t('welcome.teams')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </SpotlightCard>
  );
}
