import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeaderBackdrop } from './HeaderBackdrop';

interface AnimatedBackdropProps {
  variant: 'hero' | 'gradient' | 'solid';
  height?: number;
  navbarHeight?: number;
  scrollOffset?: number;
  backgroundImage?: string;
}

/**
 * AnimatedBackdrop - Wrapper that smoothly animates HeaderBackdrop position on scroll
 * 
 * Features:
 * - Keeps existing layout structure unchanged
 * - Smoothly translates backdrop upward using translate-y
 * - Uses Framer Motion for buttery smooth animations
 * - Backdrop slides up until only navbar height remains visible
 */
export const AnimatedBackdrop: React.FC<AnimatedBackdropProps> = ({
  variant,
  height = 250,
  navbarHeight = 72,
  scrollOffset = 50,
  backgroundImage,
}) => {
  const { scrollY } = useScroll();
  
  // Extend scroll range for slower, more visible animation (0 to scrollOffset * 3)
  // This makes the translation happen over a longer scroll distance
  const extendedScrollRange = scrollOffset * 3;
  
  // Calculate how much to translate upward with bounce easing
  // At scrollY == 0: translateY = 0 (full backdrop visible)
  // At scrollY == extendedScrollRange: translateY = -(height - navbarHeight) (only navbar height visible)
  // Easing: bounce effect for "wow" factor - overshoots then settles
  const easeOutBounce = (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };

  const translateY = useTransform(
    scrollY,
    [0, extendedScrollRange],
    [0, -(height - navbarHeight)],
    { ease: easeOutBounce }
  );

  return (
    <motion.div
      style={{ translateY }}
      className="will-change-transform fixed top-0 left-0 right-0"
    >
      <HeaderBackdrop variant={variant} height={height} backgroundImage={backgroundImage} />
    </motion.div>
  );
};

export default AnimatedBackdrop;
