import React from 'react';
import { cn } from '@/shadcn/lib/utils';

interface HeaderBackdropProps {
  variant?: 'solid' | 'gradient' | 'hero';
  height?: number;
  backgroundImage?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * HeaderBackdrop - Visual backdrop layer for horizontal layouts
 * 
 * Used by:
 * - horizontal-gradient
 * - horizontal-hero
 * 
 * Supports:
 * - Solid backgrounds
 * - Gradient backgrounds
 * - Hero-style with extended height
 */
export const HeaderBackdrop: React.FC<HeaderBackdropProps> = ({ 
  variant = 'gradient', 
  height = 250,
  backgroundImage,
  className,
  children 
}) => {
  const variantStyles = {
    solid: 'bg-gray-900',
    gradient: 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900',
    hero: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900',
  };

  const defaultHeights = {
    solid: 'h-auto',
    gradient: 'h-auto',
    hero: 'h-60',
  };

  return (
    <div 
      className={cn(
        'absolute inset-x-0 top-0 z-0 overflow-hidden',
        !backgroundImage && variantStyles[variant],
        height ? '' : defaultHeights[variant],
        className
      )}
      style={height ? { height: `${height}px` } : undefined}
    >
      {/* Background image if provided */}
      {backgroundImage && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top',
          }}
        />
      )}

      {/* Gradient overlay when using custom image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-indigo-900/50 to-slate-900/60" />
      )}
      {children}
    </div>
  );
};

export default HeaderBackdrop;
