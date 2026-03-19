import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';

export interface InlineRevealProps {
  /** Preview content (when collapsed) */
  preview: React.ReactNode;
  /** Full content (when expanded) */
  full: React.ReactNode;
  /** Lines to clamp when collapsed */
  clampLines?: number;
  /** Optional collapsed max-height with animation */
  collapsedMaxHeight?: number;
  /** Animate height between collapsed/expanded */
  animateHeight?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Default expanded (uncontrolled) */
  defaultExpanded?: boolean;
  /** Toggle callback */
  onToggle?: (next: boolean) => void;
  /** Custom toggle labels */
  showMoreLabel?: React.ReactNode;
  showLessLabel?: React.ReactNode;
  /** Show gradient overlay when collapsed */
  showGradient?: boolean;
  /** Height of the gradient overlay */
  gradientHeight?: number;
  /** Custom gradient className */
  gradientClassName?: string;
  /** Optional render to fully control content */
  renderContent?: (isExpanded: boolean) => React.ReactNode;
  /** Button props passthrough */
  toggleProps?: React.ComponentProps<typeof Button>;
  className?: string;
  contentClassName?: string;
}

export function InlineReveal({
  preview,
  full,
  clampLines = 2,
  collapsedMaxHeight = 240,
  animateHeight = false,
  expanded,
  defaultExpanded = false,
  onToggle,
  showMoreLabel = (
    <>
      Show more <ChevronDown className="h-4 w-4 ml-1" />
    </>
  ),
  showLessLabel = (
    <>
      Show less <ChevronUp className="h-4 w-4 ml-1" />
    </>
  ),
  showGradient = false,
  gradientHeight = 48,
  gradientClassName,
  renderContent,
  toggleProps,
  className,
  contentClassName,
}: InlineRevealProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (!isControlled) setInternalExpanded(next);
    onToggle?.(next);
  };

  const content = renderContent ? (
    renderContent(isExpanded)
  ) : (
    <div
      className={cn(
        'text-sm text-muted-foreground transition-all',
        contentClassName
      )}
      style={
        !isExpanded
          ? {
              display: '-webkit-box',
              WebkitLineClamp: clampLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }
          : undefined
      }
    >
      {isExpanded ? full : preview}
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn('relative', animateHeight && 'transition-[max-height] duration-300')}
        style={
          animateHeight
            ? {
                maxHeight: isExpanded ? '999px' : `${collapsedMaxHeight}px`,
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {content}
        {showGradient && !isExpanded && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-0 right-0',
              'bg-gradient-to-b from-transparent to-background',
              gradientClassName
            )}
            style={{ height: gradientHeight }}
            aria-hidden
          />
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-primary"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        {...toggleProps}
      >
        {isExpanded ? showLessLabel : showMoreLabel}
      </Button>
    </div>
  );
}

export default InlineReveal;
