import { type ReactNode, useRef } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { useScrollFade, type UseScrollFadeOptions } from './useScrollFade';
import { ScrollFade, type ScrollFadeProps } from './ScrollFade';

export interface ScrollFadeContainerProps {
  /** Child content (should include the scrollable element) */
  children: ReactNode;
  /** Which fades to show: 'top', 'bottom', or 'both' (default: 'both') */
  fades?: 'top' | 'bottom' | 'both';
  /** Size of the fade gradient */
  fadeSize?: ScrollFadeProps['size'];
  /** Custom className for the container */
  className?: string;
  /** Options for the scroll detection hook */
  scrollOptions?: UseScrollFadeOptions;
  /** Z-index for fade overlays */
  fadeZIndex?: number;
  /** Custom gradient configuration for fade overlays */
  fadeGradient?: ScrollFadeProps['gradient'];
  /** Custom className for the fade elements */
  fadeClassName?: string;
}

/**
 * ScrollFadeContainer
 * 
 * All-in-one wrapper that combines scroll detection with fade overlays.
 * Simply wrap your scrollable content and it handles the rest.
 * 
 * @example
 * // Basic usage with default background gradient
 * <ScrollFadeContainer>
 *   <SimpleBar className="h-[400px]">
 *     {content}
 *   </SimpleBar>
 * </ScrollFadeContainer>
 * 
 * @example
 * // Custom style classes (supports dark mode)
 * <ScrollFadeContainer 
 *   fadeClassName="from-white dark:from-neutral-800 via-white/80 dark:via-neutral-800/80"
 * >
 *   <ScrollArea className="h-[300px]">
 *     {content}
 *   </ScrollArea>
 * </ScrollFadeContainer>
 */
export function ScrollFadeContainer({
  children,
  fades = 'both',
  fadeSize = 'md',
  className,
  scrollOptions,
  fadeZIndex = 10,
  fadeGradient,
  fadeClassName,
}: ScrollFadeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showTop, showBottom } = useScrollFade(containerRef as React.RefObject<HTMLElement>, scrollOptions);

  const shouldShowTop = (fades === 'top' || fades === 'both') && showTop;
  const shouldShowBottom = (fades === 'bottom' || fades === 'both') && showBottom;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <ScrollFade
        position="top"
        size={fadeSize}
        visible={shouldShowTop}
        zIndex={fadeZIndex}
        gradient={fadeGradient}
        className={fadeClassName}
      />
      
      {children}
      
      <ScrollFade
        position="bottom"
        size={fadeSize}
        visible={shouldShowBottom}
        zIndex={fadeZIndex}
        gradient={fadeGradient}
        className={fadeClassName}
      />
    </div>
  );
}
