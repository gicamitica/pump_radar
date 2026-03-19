import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { UserPlus, UsersRound, Mail, Activity, Calendar, Zap, ArrowUpRight } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export function QuickActionsWidget() {
  const { t } = useTranslation('home');
  
  const actions = [
    {
      id: 'invite-user',
      label: t('quickActions.inviteUser'),
      icon: UserPlus,
      onClick: () => {},
      primary: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary-foreground',
    },
    {
      id: 'create-team',
      label: t('quickActions.createTeam'),
      icon: UsersRound,
      onClick: () => {},
      primary: false,
      color: 'hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30 dark:hover:text-purple-400',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'email-notifications',
      label: t('quickActions.emailNotifications'),
      icon: Mail,
      onClick: () => {},
      primary: false,
      color: 'hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30 dark:hover:text-amber-400',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      navigates: true,
    },
    {
      id: 'activity-log',
      label: t('quickActions.activityLog'),
      icon: Activity,
      onClick: () => {},
      primary: false,
      color: 'hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 dark:hover:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      navigates: true,
    },
    {
      id: 'calendar',
      label: t('quickActions.calendar'),
      icon: Calendar,
      onClick: () => {},
      primary: false,
      color: 'hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 dark:hover:text-blue-400',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      navigates: true,
    },
  ];

  return (
    <>
      <Card data-tour="quick-actions">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">{t('quickActions.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.primary ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'group gap-2 transition-all duration-200',
                    action.primary 
                      ? 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5' 
                      : action.color
                  )}
                  onClick={action.onClick}
                >
                  <span className={cn(
                    'flex items-center justify-center h-5 w-5 rounded transition-transform duration-200 group-hover:scale-110',
                    !action.primary && action.iconBg
                  )}>
                    <Icon className={cn('h-3.5 w-3.5', !action.primary && action.iconColor)} />
                  </span>
                  {action.label}
                  {action.navigates && (
                    <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
