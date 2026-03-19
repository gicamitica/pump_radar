/**
 * FloatingHover - Animated hover background effect.
 * Provides a smooth floating background that follows hovered elements.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Rect } from '@floating-ui/react';

export const FloatingHover: React.FC<{ rect: Rect | null; insetX?: number; className?: string }>
  = ({ rect, insetX = 4, className }) => {
  return (
    <motion.div
      layoutId="hover-bg"
      className={[
        'pointer-events-none absolute rounded-lg bg-gray-100 dark:bg-neutral-900',
        className ?? ''
      ].join(' ')}
      style={{ left: ((rect?.x ?? 0) + insetX), width: rect ? Math.max(0, (rect.width ?? 0) - insetX * 2) : 0 }}
      animate={{
        top: rect ? rect.y : 0,
        height: rect ? rect.height : 0,
        opacity: rect ? 1 : 0,
        scale: rect ? 1 : 0.98,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.3 }}
      aria-hidden
    />
  );
};
