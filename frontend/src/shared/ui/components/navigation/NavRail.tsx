import React from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';

export type NavRailItem = {
  id: string;
  to?: string;
  icon: React.ReactNode;
  label: string;
  badge?: number | React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export type NavRailProps = {
  items: NavRailItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string, e?: React.MouseEvent | MouseEvent) => void;
  variant?: 'horizontal' | 'responsive' | 'vertical';
  mobileContent?: 'icons' | 'icons-text';
  animation?: 'bounce' | 'none';
  size?: 'sm' | 'md' | 'lg';
  breakpoint?: 'md' | 'lg' | 'xl' | '2xl';
  ariaLabel?: string;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  indicatorClassName?: string;
};

const SIZE_MAP = {
  sm: { px: 'px-2', py: 'py-1.5', gap: 'gap-1.5', radius: 'rounded-lg', icon: 'size-4', text: 'text-xs' },
  md: { px: 'px-3', py: 'py-2', gap: 'gap-2', radius: 'rounded-xl', icon: 'size-4.5', text: 'text-sm' },
  lg: { px: 'px-4', py: 'py-2.5', gap: 'gap-2', radius: 'rounded-xl', icon: 'size-5', text: 'text-base' },
} as const;

export const NavRail: React.FC<NavRailProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'horizontal',
  mobileContent = 'icons-text',
  animation = 'bounce',
  size = 'md',
  breakpoint = 'md',
  ariaLabel,
  className,
  itemClassName,
  activeItemClassName,
  indicatorClassName,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState<string | undefined>(value ?? defaultValue);
  const instanceId = React.useId();

  // derive active from router if any item has `to`
  React.useEffect(() => {
    const routeActive = items.find((it) => it.to && (pathname === it.to || pathname.startsWith(it.to + '/')));

    console.log('pathname', { pathname, routeActive, items });

    const derived = value ?? routeActive?.id ?? activeId ?? items[0]?.id;
    setActiveId(derived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, value, items]);

  // keep controlled sync
  React.useEffect(() => { if (value) setActiveId(value); }, [value]);

  const sz = SIZE_MAP[size];

  const baseContainer = cn(
    'relative rounded-2xl border bg-gray-50 dark:bg-neutral-800',
    className
  );

  // helper to prefix classes with the chosen breakpoint
  const responsiveLayoutMap = {
    md: 'md:flex-col md:space-y-2',
    lg: 'lg:flex-col lg:space-y-2',
    xl: 'xl:flex-col xl:space-y-2',
    '2xl': '2xl:flex-col 2xl:space-y-2',
  };

  const layoutMap = {
    horizontal: 'flex',
    vertical: 'flex flex-col space-y-2',
    responsive: `flex ${responsiveLayoutMap[breakpoint]}`,
  };

  const layout = layoutMap[variant];

  // Item base + responsive width rules without JS
  const itemBase = cn(
    'relative isolate select-none',
    'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white',
    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    sz.px, sz.py, sz.gap, sz.radius
  );

  const itemWidthByVariant = (
    variant === 'horizontal' ? 'shrink-0' :
      variant === 'vertical' ? 'w-full' : `${breakpoint}:w-full shrink-0`
  );

  const onSelect = (id: string, e: React.MouseEvent, to?: string, disabled?: boolean) => {
    if (disabled) return;
    if (!value) setActiveId(id);
    onChange?.(id, e);
    if (to) navigate(to);
  };

  return (
    <nav role="navigation" aria-label={ariaLabel} className={baseContainer}>
      <LayoutGroup id={`nav-rail-${instanceId}`}>
        <div className={cn('relative', layout)}>
          {items.map((it) => {
            const isActive = it.id === activeId;
            const labelClasses = cn(sz.text, 'truncate');
            const bounceClass = animation === 'bounce' && isActive ? 'animate-[bounceInOut_0.4s_ease-in-out] motion-reduce:animate-none' : '';
            const breakpointLabel = {
              md: 'md:not-sr-only md:inline',
              lg: 'lg:not-sr-only lg:inline',
              xl: 'xl:not-sr-only xl:inline',
              '2xl': '2xl:not-sr-only 2xl:inline',
            };

            return (
              <button
                key={it.id}
                type={it.to ? 'button' : 'button'}
                className={cn(
                  itemBase,
                  itemWidthByVariant,
                  'z-10 inline-flex items-center py-1 my-1',
                  it.disabled && 'opacity-50 cursor-not-allowed',
                  itemClassName,
                  it.className,
                  isActive
                    ? cn('text-gray-900 dark:text-white font-medium', bounceClass, activeItemClassName)
                    : 'text-gray-600 dark:text-gray-300 cursor-pointer'
                )}
                aria-current={it.to && isActive ? 'page' : undefined}
                aria-selected={!it.to && isActive ? true : undefined}
                onClick={(e) => onSelect(it.id, e, it.to, it.disabled)}
              >
                {isActive && (
                  <motion.span
                    layoutId={`nav-rail-indicator-${instanceId}`}
                    className={cn(
                      "absolute inset-0 z-0 rounded-xl bg-white dark:bg-neutral-700 shadow-sm",
                      indicatorClassName
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <span className={cn('z-1 relative', sz.icon)}>{it.icon}</span>
                <span className={cn('z-1 relative', labelClasses, mobileContent === 'icons' && `sr-only ${breakpointLabel[breakpoint]}`)}>
                  {it.label}
                </span>

                {typeof it.badge !== 'undefined' && (
                  <span className={cn('ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                    mobileContent === 'icons' ? 'ml-0 absolute -top-1 -right-1 size-1.5 rounded-full bg-blue-500' : 'bg-gray-200 dark:bg-neutral-700')}
                  >
                    {mobileContent === 'icons' ? null : (typeof it.badge === 'number' ? it.badge : it.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
};

export default NavRail;
