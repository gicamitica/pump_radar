import React from 'react';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: StepStatus;
  isExpanded?: boolean;
  isActive?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const statusConfig: Record<StepStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  skipped: { label: 'Skipped', variant: 'outline' },
};

export function StepCard({
  icon,
  title,
  description,
  status,
  isExpanded = false,
  isActive = false,
  onToggle,
  children,
  className,
}: StepCardProps) {
  const config = statusConfig[status];
  const isCompleted = status === 'completed';
  const isSkipped = status === 'skipped';

  return (
    <Card
      className={cn(
        'transition-all duration-300 overflow-hidden',
        isActive && 'ring-2 ring-primary/20 border-primary/30',
        isCompleted && 'bg-muted/30',
        isSkipped && 'opacity-60',
        className
      )}
    >
      <button
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                React.isValidElement(icon) &&
                React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: 'h-5 w-5',
                })
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'font-medium transition-colors',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {title}
                </h3>
                <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                  {status === 'in_progress' && (
                    <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                  )}
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
        </CardContent>
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 border-t">
            <div className="pt-4">{children}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export interface StepCardActionsProps {
  primaryLabel?: string;
  primaryIcon?: React.ReactNode;
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: React.ReactNode;
  onSecondary?: () => void;
  tertiaryLabel?: string;
  onTertiary?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function StepCardActions({
  primaryLabel,
  primaryIcon,
  onPrimary,
  secondaryLabel,
  secondaryIcon,
  onSecondary,
  tertiaryLabel,
  onTertiary,
  isLoading,
  className,
}: StepCardActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {primaryLabel && onPrimary && (
        <Button size="sm" onClick={onPrimary} disabled={isLoading}>
          {primaryIcon}
          {primaryLabel}
        </Button>
      )}
      {secondaryLabel && onSecondary && (
        <Button variant="outline" size="sm" onClick={onSecondary} disabled={isLoading}>
          {secondaryIcon}
          {secondaryLabel}
        </Button>
      )}
      {tertiaryLabel && onTertiary && (
        <Button variant="ghost" size="sm" onClick={onTertiary} disabled={isLoading}>
          {tertiaryLabel}
        </Button>
      )}
    </div>
  );
}
