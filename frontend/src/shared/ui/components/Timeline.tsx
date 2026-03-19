import type { ReactNode } from 'react';
import { cn } from '@/shadcn/lib/utils';

export interface TimelineItemData {
  /** Unique identifier for the item */
  id: string;
  /** Icon element to display in the timeline marker */
  icon: ReactNode;
  /** Primary text/title for the item */
  title: ReactNode;
  /** Secondary text/subtitle for the item */
  subtitle?: ReactNode;
  /** Optional badge element displayed next to the title */
  badge?: ReactNode;
  /** Optional content displayed on the right side of the item */
  trailing?: ReactNode;
  /** Custom background class for the icon container */
  iconContainerClassName?: string;
  /** Custom class for the timeline line connecting to the next item */
  lineClassName?: string;
  /** Optional click handler for the item */
  onClick?: () => void;
}

interface TimelineProps {
  /** Array of timeline items to render */
  items: TimelineItemData[];
  /** Additional class name for the container */
  className?: string;
  /** Gap between items - defaults to 'md' */
  gap?: 'sm' | 'md' | 'lg';
  /** Whether to show the connecting line - defaults to true */
  showLine?: boolean;
  /** Default line color class - can be overridden per item */
  lineClassName?: string;
  /** Default icon container class - can be overridden per item */
  iconContainerClassName?: string;
  /** Enable hover effects on items */
  interactive?: boolean;
  /** Animate the first item (useful for new items) */
  animateFirst?: boolean;
}

const gapClasses = {
  sm: 'pb-3',
  md: 'pb-4',
  lg: 'pb-5',
};

export function Timeline({
  items,
  className,
  gap = 'md',
  showLine = true,
  lineClassName = 'bg-border',
  iconContainerClassName = 'bg-muted',
  interactive = false,
  animateFirst = false,
}: TimelineProps) {
  return (
    <div className={cn('relative timeline', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;
        const itemLineClass = item.lineClassName ?? lineClassName;
        const itemIconContainerClass = item.iconContainerClassName ?? iconContainerClassName;
        const isInteractive = interactive || !!item.onClick;

        return (
          <div
            key={item.id}
            className={cn(
              'group relative flex gap-4 rounded-lg transition-colors',
              !isLast && gapClasses[gap],
              isInteractive && 'cursor-pointer py-2 px-2 -mx-2 hover:bg-muted/50',
              animateFirst && isFirst && 'animate-in fade-in slide-in-from-top-2 duration-300'
            )}
            onClick={item.onClick}
          >
            {/* Timeline line */}
            {showLine && !isLast && (
              <div
                className={cn(
                  'absolute w-0.5',
                  isInteractive ? 'top-11 h-[calc(100%-24px)] left-[25px]' : 'top-9 h-[calc(100%-20px)] left-[17px]',
                  itemLineClass
                )}
              />
            )}

            {/* Icon container */}
            <div
              className={cn(
                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200',
                itemIconContainerClass,
                isInteractive && 'group-hover:scale-110'
              )}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {typeof item.title === 'string' ? (
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                ) : (
                  item.title
                )}
                {item.badge}
              </div>
              {item.subtitle && (
                <div className="mt-0.5">
                  {typeof item.subtitle === 'string' ? (
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  ) : (
                    item.subtitle
                  )}
                </div>
              )}
            </div>

            {/* Trailing content */}
            {item.trailing && <div className="shrink-0">{item.trailing}</div>}
          </div>
        );
      })}
    </div>
  );
}

export type { TimelineProps };
