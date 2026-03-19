import * as React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shadcn/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const alertGlassVariants = cva(
  'relative flex items-center gap-5 p-5 rounded-[1.75rem] border border-white/20 shadow-2xl backdrop-blur-3xl overflow-hidden min-w-[320px] max-w-lg',
  {
    variants: {
      variant: {
        info: 'bg-white/40 dark:bg-slate-900/40 border-info/10',
        success: 'bg-white/40 dark:bg-slate-900/40 border-success/10',
        warning: 'bg-white/40 dark:bg-slate-900/40 border-warning/10',
        error: 'bg-white/40 dark:bg-slate-900/40 border-destructive/10',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const glowMap = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
};

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertGlassProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertGlassVariants> {
  title: string;
  description: string;
  onClose?: () => void;
  isOpen?: boolean;
}

export const AlertGlass: React.FC<AlertGlassProps> = ({
  variant = 'info',
  title,
  description,
  onClose,
  isOpen = true,
  className,
  ...rest
}) => {
  const Icon = iconMap[variant || 'info'];

  // Destructure props to avoid passing incompatible HTML attributes to motion.div
  // especially 'onDrag' which is typed differently in Framer Motion vs React
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...props } = rest as any;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className={cn(alertGlassVariants({ variant }), className)}
          {...props}
        >
          {/* Subtle Glow Effect */}
          <div
            className={cn(
              'absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full opacity-20 transition-colors duration-500',
              glowMap[variant || 'info']
            )}
          />

          {/* Icon Box */}
          <div
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 border shadow-sm transition-all duration-300',
              variant === 'info' && 'border-info/20 text-info',
              variant === 'success' && 'border-success/20 text-success',
              variant === 'warning' && 'border-warning/20 text-warning',
              variant === 'error' && 'border-destructive/20 text-destructive'
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-0.5">
            <h4 className="font-outfit text-base font-black tracking-tight text-foreground leading-tight">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {description}
            </p>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-foreground transition-colors p-1"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertGlass;
