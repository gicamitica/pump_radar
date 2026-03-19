import React from 'react';
import { cn } from '@/shadcn/lib/utils';

export interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
  timestamp?: string;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ActivityItem({
  icon,
  iconBg = 'bg-muted',
  iconColor = 'text-muted-foreground',
  children,
  timestamp,
  action,
  avatar,
  className,
  onClick,
}: ActivityItemProps) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg transition-colors duration-150',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          iconBg
        )}
      >
        {React.isValidElement(icon) &&
          React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: cn('h-4 w-4', iconColor),
          })}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {timestamp && (
          <span className="text-xs text-muted-foreground/70 tabular-nums">{timestamp}</span>
        )}
        {action && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {action}
          </div>
        )}
        {avatar && <div className="shrink-0">{avatar}</div>}
      </div>
    </div>
  );
}

export interface ActivityItemTextProps {
  actor?: string;
  action: string;
  target?: string;
  className?: string;
}

export function ActivityItemText({ actor, action, target, className }: ActivityItemTextProps) {
  return (
    <span className={cn('text-muted-foreground', className)}>
      {actor && <span className="font-medium text-foreground">{actor}</span>}{' '}
      {action}
      {target && (
        <>
          {' '}
          <span className="font-medium text-foreground">{target}</span>
        </>
      )}
    </span>
  );
}
