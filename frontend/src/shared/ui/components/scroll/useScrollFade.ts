import { useEffect, useState, useRef, type RefObject } from 'react';

export interface ScrollFadeState {
  /** Whether to show the top fade (content is scrolled down) */
  showTop: boolean;
  /** Whether to show the bottom fade (more content below) */
  showBottom: boolean;
  /** Whether the container is scrollable */
  isScrollable: boolean;
}

export interface UseScrollFadeOptions {
  /** Threshold in pixels to trigger fade visibility (default: 10) */
  threshold?: number;
  /** Debounce delay in ms for scroll events (default: 50) */
  debounce?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook to detect scroll position and determine fade visibility
 * 
 * Works with:
 * - SimpleBar: Pass ref to the SimpleBar wrapper div
 * - ScrollArea (Radix): Pass ref to the ScrollArea component
 * - Native overflow: Pass ref to the scrollable element
 * 
 * @example
 * // With SimpleBar
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { showTop, showBottom } = useScrollFade(containerRef);
 * 
 * return (
 *   <div ref={containerRef}>
 *     <SimpleBar>
 *       {showTop && <ScrollFade position="top" />}
 *       {content}
 *       {showBottom && <ScrollFade position="bottom" />}
 *     </SimpleBar>
 *   </div>
 * );
 * 
 * @example
 * // With ScrollArea
 * const viewportRef = useRef<HTMLDivElement>(null);
 * const { showTop, showBottom } = useScrollFade(viewportRef, { threshold: 5 });
 */
export function useScrollFade(
  containerRef: RefObject<HTMLElement>,
  options: UseScrollFadeOptions = {}
): ScrollFadeState {
  const { threshold = 10, debounce = 50, debug = false } = options;
  
  const [state, setState] = useState<ScrollFadeState>({
    showTop: false,
    showBottom: false,
    isScrollable: false,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    console.log("Start useScrollFade", container);

    // Find the actual scrollable element
    // For SimpleBar: .simplebar-content-wrapper
    // For ScrollArea: [data-radix-scroll-area-viewport]
    // For native: the container itself
    const getScrollElement = (): HTMLElement | null => {
      // Try SimpleBar first
      const simpleBarScroller = container.querySelector<HTMLElement>('.simplebar-content-wrapper');
      if (simpleBarScroller) return simpleBarScroller;

      // Try ScrollArea (Radix)
      const radixViewport = container.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (radixViewport) return radixViewport;

      // Fallback to container if it has overflow
      const hasOverflow = container.scrollHeight > container.clientHeight;
      return hasOverflow ? container : null;
    };

    const scrollElement = getScrollElement();
    if (!scrollElement) {
      if (debug) console.log('[useScrollFade] No scrollable element found');
      return;
    }

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isScrollable = scrollHeight > clientHeight;
      const showTop = scrollTop > threshold;
      const showBottom = scrollTop + clientHeight < scrollHeight - threshold;

      if (debug) {
        console.log('[useScrollFade]', {
          scrollTop,
          scrollHeight,
          clientHeight,
          isScrollable,
          showTop,
          showBottom,
        });
      }

      setState({ showTop, showBottom, isScrollable });
    };

    const debouncedCheck = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(checkScroll, debounce);
    };

    // Initial check with delay to allow DOM to settle
    const initialTimer = setTimeout(checkScroll, 100);

    // Listen to scroll events
    scrollElement.addEventListener('scroll', debouncedCheck, { passive: true });

    // Watch for content changes using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      debouncedCheck();
    });
    resizeObserver.observe(scrollElement);

    // Also observe the scroll content for dynamic changes
    const scrollContent = scrollElement.querySelector('.simplebar-content') || scrollElement.firstElementChild;
    if (scrollContent) {
      resizeObserver.observe(scrollContent as Element);
    }

    return () => {
      clearTimeout(initialTimer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      scrollElement.removeEventListener('scroll', debouncedCheck);
      resizeObserver.disconnect();
    };
  }, [containerRef, threshold, debounce, debug]);

  return state;
}
