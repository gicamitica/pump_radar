import { cn } from '@/shadcn/lib/utils';
import React from 'react';

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Section title displayed at the top
   */
  title?: string;
  /**
   * Optional description displayed below the title
   */
  description?: string;
  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode;
  /**
   * Visual variant for the content container
   * - default: No distinct background or border
   * - card: Boxed with border, background, and shadow
   * - subtle: Light background, no border
   * @default 'default'
   */
  variant?: 'default' | 'card' | 'subtle';
  /**
   * Layout mode for the section
   * - stack: Header above content (standard)
   * - split: Header on the left, content on the right (sidebar style)
   * @default 'stack'
   */
  layout?: 'stack' | 'split';
  /**
   * Whether to show a separator line after this section
   * @default false
   */
  withDivider?: boolean;
  /**
   * Compact mode reduces spacing
   * @default false
   */
  compact?: boolean;
}

/**
 * FormSection - A layout primitive for grouping related form fields with visual hierarchy.
 * 
 * Use this to create logically and visually separated sections within complex forms.
 * Supports standard vertical stacking and split (sidebar) layouts combined with different visual styles.
 */
export function FormSection({
  title,
  description,
  icon,
  variant = 'default',
  layout = 'stack',
  withDivider = false,
  compact = false,
  className,
  children,
  ...props
}: FormSectionProps) {
  
  const isSplit = layout === 'split';

  return (
    <section
      data-slot="form-section"
      data-variant={variant}
      data-layout={layout}
      className={cn(
        'relative',
        withDivider && 'pb-8 border-b border-border mb-8',
        isSplit && 'grid gap-6 md:grid-cols-12 md:gap-10',
        className
      )}
      {...props}
    >
      {/* Header Area */}
      <div className={cn(
        isSplit ? 'md:col-span-4 lg:col-span-4 space-y-1' : 'mb-5 flex flex-col gap-1',
        compact && !isSplit && 'mb-3'
      )}>
        {(title || icon) && (
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            {icon && icon}
            {title}
          </h3>
        )}
        {description && (
          <p className={cn(
            "text-sm text-muted-foreground",
            isSplit && "leading-relaxed"
          )}>
            {description}
          </p>
        )}
      </div>

      {/* Content Area */}
      <div 
        data-slot="form-section-content"
        className={cn(
          isSplit ? 'md:col-span-8 lg:col-span-8' : '',
          'space-y-6',
          compact && 'space-y-4',
          variant === 'card' && 'rounded-xl border bg-card p-6 shadow-sm',
          variant === 'subtle' && 'rounded-xl border border-transparent bg-muted/40 p-6',
          // If split and default, we might not want extra padding unless specified, 
          // but if variant is default it has no padding by default logic above.
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default FormSection;
