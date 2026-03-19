import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface SectionLabelProps {
  /** The text to display. Can also be passed as children. */
  label?: string;
  /** Same as label, for more flexible JSX usage. */
  children?: React.ReactNode;
  /** Optional Lucide icon to display before the label. */
  icon?: LucideIcon;
  /** Optional content to display on the right side of the header. */
  rightSection?: React.ReactNode;
  /** Additional classes for the container. */
  className?: string;
  /** Additional classes for the icon. */
  iconClassName?: string;
  /** Additional classes for the label text. */
  labelClassName?: string;
}

/**
 * SectionLabel - A standardized small, uppercase header used to label sections
 * within cards, drawers, or content blocks. Supports an optional icon and
 * a right-side slot for badges, buttons, or metadata.
 */
export const SectionLabel: React.FC<SectionLabelProps> = ({
  label,
  children,
  icon: Icon,
  rightSection,
  className,
  iconClassName,
  labelClassName,
}) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            className={cn("h-3.5 w-3.5 text-muted-foreground/60 shrink-0", iconClassName)}
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 leading-none",
            labelClassName
          )}
        >
          {label || children}
        </span>
      </div>
      {rightSection && (
        <div className="flex items-center gap-2 leading-none">
          {rightSection}
        </div>
      )}
    </div>
  );
};
