import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const premiumButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all select-none disabled:opacity-50 disabled:pointer-events-none group/premium",
  {
    variants: {
      variant: {
        nebula: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20",
        sunset: "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/20",
        emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-500/20",
        ghost: "bg-white/5 border border-white/10 backdrop-blur-md text-white hover:bg-white/10 shadow-xl",
        midnight: "bg-slate-900 border border-white/5 text-white shadow-2xl hover:bg-slate-800",
      },
      size: {
        sm: "h-8 px-3 rounded-full text-xs font-bold",
        default: "h-10 px-5 rounded-full text-sm font-bold",
        lg: "h-12 px-8 rounded-full text-base font-bold",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "nebula",
      size: "default",
    }
  }
);

export interface PremiumButtonProps extends 
  Omit<HTMLMotionProps<"button">, "ref">, 
  VariantProps<typeof premiumButtonVariants> {
  icon?: React.ReactNode;
  iconClassName?: string;
  showShine?: boolean;
}

/**
 * PremiumButton - A high-fidelity interactive button with gradients, 
 * micro-interactions, and a dedicated icon slot.
 */
export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, fullWidth, icon, iconClassName, showShine = true, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(premiumButtonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {/* Shine / Hover Overlay */}
        {showShine && (
          <div className="absolute inset-0 opacity-0 group-hover/premium:opacity-10 transition-opacity bg-white pointer-events-none" />
        )}
        
        {/* Bottom Inner Shadow for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-50" />

        <div className="relative flex items-center justify-center gap-2">
          {icon && (
            <div className={cn(
              "shrink-0 flex items-center justify-center rounded-full bg-white/20 transition-transform group-hover/premium:scale-110",
              size === 'sm' ? 'size-5' : size === 'lg' ? 'size-7' : 'size-6',
              iconClassName
            )}>
              {icon}
            </div>
          )}
          <span>{children as React.ReactNode}</span>
        </div>
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
