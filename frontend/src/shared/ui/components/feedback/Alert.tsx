import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

const alertVariants = cva(
  'relative flex items-start gap-4 px-5 py-4 rounded-xl text-sm border shadow-sm transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        warning: 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/25 text-foreground',
        success: 'bg-gradient-to-r from-success/20 to-success/5 border-success/25 text-foreground',
        destructive: 'bg-gradient-to-r from-destructive/20 to-destructive/5 border-destructive/25 text-foreground',
        muted: 'bg-gradient-to-r from-muted/50 to-muted/20 border-border/50 text-muted-foreground',
        info: 'bg-gradient-to-r from-info/20 to-info/5 border-info/25 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIconMap: Record<string, LucideIcon> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  destructive: XCircle,
  muted: Info,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: LucideIcon;
  hideIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      icon,
      hideIcon = false,
      dismissible = false,
      onDismiss,
      autoDismiss = false,
      autoDismissDelay = 5000,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [progress, setProgress] = React.useState(100);

    React.useEffect(() => {
      if (autoDismiss && isVisible) {
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev <= 0) {
              setIsVisible(false);
              onDismiss?.();
              return 0;
            }
            return prev - (100 / (autoDismissDelay / 100));
          });
        }, 100);
        return () => clearInterval(interval);
      }
    }, [autoDismiss, autoDismissDelay, isVisible, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    const IconComponent = icon ?? alertIconMap[variant ?? 'info'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), dismissible && 'pr-12', className)}
        {...props}
      >
        {!hideIcon && (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm backdrop-blur-md',
              variant === 'warning' && 'bg-warning/10 text-warning',
              variant === 'success' && 'bg-success/10 text-success',
              variant === 'destructive' && 'bg-destructive/10 text-destructive',
              variant === 'info' && 'bg-info/10 text-info',
              variant === 'muted' && 'bg-muted/10 text-muted-foreground'
            )}
          >
            <IconComponent className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {autoDismiss && isVisible && (
          <div
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-1 bg-black/10 dark:bg-white/10"
          >
            <div
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                variant === 'success' && 'bg-success/50',
                variant === 'warning' && 'bg-warning/50',
                variant === 'destructive' && 'bg-destructive/50',
                variant === 'info' && 'bg-info/50',
                variant === 'muted' && 'bg-muted-foreground/50'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
);

AlertTitle.displayName = 'AlertTitle';

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-foreground/80 mt-1', className)}
      {...props}
    />
  )
);

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
