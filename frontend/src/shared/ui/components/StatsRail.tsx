import React from 'react';
import clsx from 'clsx';
import { LayoutGroup, motion } from 'framer-motion';
import { FloatingHover } from '@/shared/ui/components/FloatingHover';
import { useHoverBackground } from '@/shared/hooks/useHoverBackground';

export type StatsItem = {
  id: string;
  label: string;
  value: number | string;
  hint?: string;
  delta?: string;
  icon?: React.ReactNode;
  to?: string;
};

export type StatsRailRenderState = {
  active: boolean;
  onClick: () => void;
  tabIndex: number;
};

export interface StatsRailProps {
  items: StatsItem[];
  renderItem?: (item: StatsItem, state: StatsRailRenderState) => React.ReactNode;
  activeId?: string;
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  breakpoint?: 'md' | 'lg' | 'xl' | '2xl';
  ariaLabel?: string;
  className?: string;
}

const containerBase = 'relative w-full rounded-2xl border bg-gray-50 dark:bg-neutral-800';
const trackBase = 'relative flex flex-col p-2 overflow-hidden';

const BREAKPOINT_LAYOUT: Record<'md'|'lg'|'xl'|'2xl', string> = {
  md: 'md:flex-row',
  lg: 'lg:flex-row',
  xl: 'xl:flex-row',
  '2xl': '2xl:flex-row',
};

const BREAKPOINT_ITEM_WIDTH_RESET: Record<'md'|'lg'|'xl'|'2xl', string> = {
  md: 'md:min-w-0',
  lg: 'lg:min-w-0',
  xl: 'xl:min-w-0',
  '2xl': '2xl:min-w-0',
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setReduced(mq.matches);
    listener();
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);
  return reduced;
};

export const StatsRail: React.FC<StatsRailProps> = ({
  items,
  renderItem,
  activeId,
  defaultActiveId,
  onChange,
  breakpoint = 'md',
  ariaLabel,
  className,
}) => {
  const [current, setCurrent] = React.useState<string>(activeId ?? defaultActiveId ?? items[0]?.id);
  const reduced = usePrefersReducedMotion();
  const instanceId = React.useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { rect, bind } = useHoverBackground(containerRef);

  React.useEffect(() => { if (activeId) setCurrent(activeId); }, [activeId]);

  // Auto-scroll active into view (mobile horizontal rail)
  React.useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-stat-id="${current}"]`,
    );
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [current, reduced]);

  const onSelect = (id: string) => {
    if (!activeId) setCurrent(id);
    onChange?.(id);
  };

  const layoutClass = clsx(trackBase, BREAKPOINT_LAYOUT[breakpoint]);

  return (
    <nav role="navigation" aria-label={ariaLabel} className={clsx(containerBase, className)}>
      <LayoutGroup id={`stats-rail-${instanceId}`}>
        <div ref={containerRef} className={layoutClass}>
          <FloatingHover rect={rect} insetX={8} className="rounded-2xl" />

          {items.map((it: StatsItem) => {
            const isActive = it.id === current;
            const bounceClass = !reduced && isActive ? 'motion-safe:animate-[bounceInOut_0.4s_ease-in-out]' : '';

            const state: StatsRailRenderState = {
              active: isActive,
              onClick: () => onSelect(it.id),
              tabIndex: isActive ? 0 : -1,
            };

            return (
              <button
                key={it.id}
                data-stat-id={it.id}
                type="button"
                className={clsx(
                  'relative isolate snap-start focus:outline-none flex-1',
                  'rounded-2xl',
                  BREAKPOINT_ITEM_WIDTH_RESET[breakpoint],
                  'px-4 py-3 text-left',
                  bounceClass
                )}
                aria-current={isActive ? 'true' : undefined}
                onClick={state.onClick}
                {...bind}
                tabIndex={state.tabIndex}
              >
                {isActive && (
                  <motion.span
                    layoutId={`stats-rail-indicator-${instanceId}`}
                    className="absolute inset-0 -z-10 rounded-2xl bg-white dark:bg-neutral-700 text-foreground border shadow-sm"
                    transition={{ type: 'spring', bounce: reduced ? 0 : 0.2, duration: reduced ? 0.2 : 0.35 }}
                  />
                )}

                {renderItem ? (
                  renderItem(it, state)
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between text-xs text-muted-foreground">
                      <span className="truncate">{it.label}</span>
                      {it.icon && <span className="opacity-70">{it.icon}</span>}
                    </div>
                    <div className="text-2xl font-semibold leading-tight">{it.value}</div>
                    {it.hint && <div className="text-[11px] text-muted-foreground/90">{it.hint}</div>}
                    {it.delta && <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{it.delta}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
};

export default StatsRail;
