import React from 'react';
import type { Rect } from '@floating-ui/react';

/**
 * Hook to track hover position for floating background effect.
 * @param containerRef - Reference to the container element
 * @returns Rect state and event bindings
 */
export function useHoverBackground<T extends HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [rect, setRect] = React.useState<Rect | null>(null);

  const setFromEl = React.useCallback((el: HTMLElement | null) => {
    const container = containerRef.current as T | null;
    if (!container || !el) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const top = r.top - c.top + container.scrollTop;
    const left = r.left - c.left + (container as unknown as HTMLElement).scrollLeft;
    const width = r.width;
    setRect({ y: top, height: r.height, x: left, width });
  }, [containerRef]);

  const clear = React.useCallback(() => setRect(null), []);

  const bind = React.useMemo(() => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => setFromEl(e.currentTarget as HTMLElement),
    onFocus: (e: React.FocusEvent<HTMLElement>) => setFromEl(e.currentTarget as HTMLElement),
    onMouseLeave: () => clear(),
    onBlur: () => clear(),
  }), [setFromEl, clear]);

  return { rect, bind, setFromEl, clear };
}
