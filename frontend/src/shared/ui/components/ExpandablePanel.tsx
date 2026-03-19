import { cn } from '@/shadcn/lib/utils';
import { ChevronDown } from 'lucide-react';
import { type ReactNode, forwardRef } from 'react';

/**
 * Props for the ExpandablePanel component
 */
export interface ExpandablePanelProps {
  /** Unique identifier for the panel */
  id: string;
  /** Whether the panel is currently expanded */
  isExpanded: boolean;
  /** Callback when the panel header is clicked */
  onToggle: () => void;
  /** Header content (left side) */
  header: ReactNode;
  /** Optional trailing content in header (right side, before chevron) */
  headerTrailing?: ReactNode;
  /** Panel content (shown when expanded) */
  children: ReactNode;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the header button */
  headerClassName?: string;
  /** Additional class name for the content area */
  contentClassName?: string;
  /** Whether to show the chevron indicator */
  showChevron?: boolean;
  /** Data attribute for tour targeting */
  'data-tour'?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
}

/**
 * ExpandablePanel - A reusable expandable/collapsible panel with smooth animations
 * 
 * This component provides a professional accordion-like panel with:
 * - Smooth CSS grid-based height animation (no JavaScript measurement needed)
 * - Opacity fade for content
 * - Rotating chevron indicator
 * - Full keyboard accessibility
 * - Customizable header and content areas
 * 
 * **Why not use shadcn/ui Accordion?**
 * While shadcn/ui provides an Accordion component based on Radix UI, it has
 * limited animation customization. This component uses CSS grid-rows animation
 * which provides smoother transitions without the need for JavaScript-based
 * height calculations. It also integrates better with custom styling needs.
 * 
 * **Animation Technique:**
 * Uses `grid-template-rows: 0fr` → `1fr` transition for smooth height animation.
 * This technique avoids the common pitfalls of `max-height` animations (which
 * require a fixed max value) and JavaScript-based solutions (which can cause
 * layout thrashing).
 * 
 * @example
 * ```tsx
 * // Basic usage with useExpandable hook
 * const { isExpanded, toggle } = useExpandable({ defaultExpanded: 'panel-1' });
 * 
 * <ExpandablePanel
 *   id="panel-1"
 *   isExpanded={isExpanded('panel-1')}
 *   onToggle={() => toggle('panel-1')}
 *   header={<span>Panel Title</span>}
 * >
 *   <p>Panel content goes here</p>
 * </ExpandablePanel>
 * 
 * // With custom header
 * <ExpandablePanel
 *   id="settings"
 *   isExpanded={expanded}
 *   onToggle={() => setExpanded(!expanded)}
 *   header={
 *     <div className="flex items-center gap-3">
 *       <Settings className="h-4 w-4" />
 *       <span>Settings</span>
 *     </div>
 *   }
 *   headerTrailing={<Badge>3 items</Badge>}
 * >
 *   <SettingsForm />
 * </ExpandablePanel>
 * ```
 */
export const ExpandablePanel = forwardRef<HTMLDivElement, ExpandablePanelProps>(
  (
    {
      id,
      isExpanded,
      onToggle,
      header,
      headerTrailing,
      children,
      disabled = false,
      className,
      headerClassName,
      contentClassName,
      showChevron = true,
      'data-tour': dataTour,
      style,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border transition-all duration-300 overflow-hidden',
          isExpanded && 'border-primary/30 shadow-sm',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        data-tour={dataTour}
        style={style}
      >
        {/* Header button */}
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-4 p-4 text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl',
            'transition-colors hover:bg-muted/50',
            headerClassName
          )}
          onClick={onToggle}
          disabled={disabled}
          aria-expanded={isExpanded}
          aria-controls={`${id}-content`}
        >
          <div className="flex-1 min-w-0">{header}</div>
          {headerTrailing && (
            <div className="shrink-0">{headerTrailing}</div>
          )}
          {showChevron && (
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>

        {/* Animated content container */}
        <div
          id={`${id}-content`}
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                'px-4 pb-4 pt-0 border-t border-border/50',
                contentClassName
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ExpandablePanel.displayName = 'ExpandablePanel';
