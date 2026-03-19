import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  iconClassName?: string;
  actions?: React.ReactNode;
  variant?: 'simple' | 'premium';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  className,
  titleClassName,
  descriptionClassName,
  iconClassName,
  actions,
  variant = 'premium'
}) => {
  if (variant === 'simple') {
    return (
      <div className={cn("space-y-1", className)}>
        <h3 className={cn("text-lg font-semibold text-foreground", titleClassName)}>
          {title}
        </h3>
        {description && (
          <p className={cn("text-sm text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn(
            "size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0",
            iconClassName
          )}>
            {typeof Icon === 'function' ? <Icon className="size-4" /> : Icon}
          </div>
        )}
        <div className="flex flex-col">
          <h2 className={cn(
            "text-sm font-black uppercase tracking-wider text-foreground/80 leading-tight",
            titleClassName
          )}>
            {title}
          </h2>
          {description && (
            <p className={cn(
              "text-[11px] font-bold text-muted-foreground/50 tracking-tight",
              descriptionClassName
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
