import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeaderBackdrop } from './HeaderBackdrop';

interface StickyBackdropBgProps {
  variant: 'hero' | 'gradient' | 'solid';
  scrollOffset?: number;
  navbarHeight?: number;
  backgroundImage?: string;
}

/**
 * StickyBackdropBg - Sticky backdrop that appears behind navbar when scrolled
 * 
 * Features:
 * - Only visible when scrollY >= scrollOffset
 * - Positioned behind navbar (z-30)
 * - Smooth opacity fade-in as user scrolls
 * - Maintains navbar height (72px)
 */
export const StickyBackdropBg: React.FC<StickyBackdropBgProps> = ({
  variant,
  scrollOffset = 50,
  navbarHeight = 72,
  backgroundImage,
}) => {
  const { scrollY } = useScroll();

  // Opacity: 0 at start, 1 when scrolled past offset
  const opacity = useTransform(
    scrollY,
    [0, scrollOffset],
    [0, 1],
    { clamp: true }
  );

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 pointer-events-none"
    >
      <HeaderBackdrop variant={variant} height={navbarHeight} backgroundImage={backgroundImage} />
    </motion.div>
  );
};

export default StickyBackdropBg;
