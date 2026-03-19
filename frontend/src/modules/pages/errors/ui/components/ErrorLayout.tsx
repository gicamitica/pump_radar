import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, RefreshCw, HelpCircle, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';

export type ErrorCode = '401' | '403' | '404' | '500' | '503';

export interface ErrorLayoutProps {
  code: ErrorCode;
  title: string;
  description: string;
  icon: LucideIcon;
  variant: 'error' | 'warning' | 'info';
  showReload?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
  showHelp?: boolean;
  helpUrl?: string;
}

const variantStyles = {
  error: {
    iconBg: 'bg-red-500/10 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    codeBg: 'bg-red-500/5',
    codeColor: 'text-red-600/80 dark:text-red-400/80',
  },
  warning: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    codeBg: 'bg-amber-500/5',
    codeColor: 'text-amber-600/80 dark:text-amber-400/80',
  },
  info: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    codeBg: 'bg-blue-500/5',
    codeColor: 'text-blue-600/80 dark:text-blue-400/80',
  },
};

export function ErrorLayout({
  code,
  title,
  description,
  icon: Icon,
  variant,
  showReload = true,
  showGoBack = true,
  showGoHome = true,
  showHelp = false,
  helpUrl = '/help',
}: ErrorLayoutProps) {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();
  const styles = variantStyles[variant];

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {/* Large error code display */}
      <div className={cn('inline-flex items-center justify-center rounded-2xl px-6 py-2 mb-6', styles.codeBg)}>
        <span className={cn('text-7xl sm:text-8xl font-bold tracking-tighter', styles.codeColor)}>
          {code}
        </span>
      </div>

      {/* Icon */}
      <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center mb-6', styles.iconBg)}>
        <Icon className={cn('h-8 w-8', styles.iconColor)} />
      </div>

      {/* Title & description */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm sm:text-base leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-10">
        {showGoBack && (
          <Button size="lg" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('actions.goBack')}
          </Button>
        )}

        {showGoHome && (
          <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" />
            {t('actions.goHome')}
          </Button>
        )}

        {showReload && (
          <Button variant="secondary" size="lg" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            {t('actions.reload')}
          </Button>
        )}

        {showHelp && (
          <Button variant="ghost" size="lg" className="gap-2" onClick={() => navigate(helpUrl)}>
            <HelpCircle className="h-4 w-4" />
            {t('actions.getHelp')}
          </Button>
        )}
      </div>

      {/* Subtle hint that user is still logged in */}
      <p className="text-xs text-muted-foreground/60 mt-12">
        {t('labels.stillLoggedIn', "You're still logged in. Your session is safe.")}
      </p>
    </div>
  );
}
