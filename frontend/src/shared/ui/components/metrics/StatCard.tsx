import React, { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shadcn/components/ui/card';

export interface StatCardProps {
  /**
   * The icon to display in the stat card
   */
  icon?: ReactNode;
  
  /**
   * The value to display (e.g. "1,200")
   */
  value: string | number;
  
  /**
   * The label describing the value (e.g. "Saved Bookmarks")
   */
  label: string;
  
  /**
   * Optional color theme for the card
   */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  
  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Optional trend indicator
   */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };

  /**
   * Optional click handler - makes the card interactive
   */
  onClick?: () => void;

  /**
   * Optional data attribute for tour targeting
   */
  'data-tour'?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant = 'default',
  className,
  trend,
  onClick,
  'data-tour': dataTour,
}) => {
  const iconContainerStyles = {
    default: 'bg-gray-100 dark:bg-gray-800',
    success: 'bg-emerald-100 dark:bg-emerald-900/50',
    warning: 'bg-amber-100 dark:bg-amber-900/50',
    danger: 'bg-red-100 dark:bg-red-900/50',
    info: 'bg-blue-100 dark:bg-blue-900/50',
    primary: 'bg-primary/10',
  };

  const iconColorStyles = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    primary: 'text-primary',
  };

  const valueColorStyles = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
    info: 'text-blue-700 dark:text-blue-300',
    primary: 'text-foreground',
  };

  const labelColorStyles = {
    default: 'text-gray-500 dark:text-gray-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    primary: 'text-muted-foreground',
  };

  const hoverStyles = {
    default: 'hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-gray-100/50 dark:hover:shadow-gray-900/50',
    success: 'hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/50',
    warning: 'hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-amber-100/50 dark:hover:shadow-amber-900/50',
    danger: 'hover:border-red-300 dark:hover:border-red-800 hover:shadow-red-100/50 dark:hover:shadow-red-900/50',
    info: 'hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-blue-100/50 dark:hover:shadow-blue-900/50',
    primary: 'hover:border-primary/40 hover:shadow-primary/10',
  };

  // Render the icon based on whether it's a component or a Lucide icon
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      const existingClassName = (icon.props as { className?: string }).className || '';
      return React.cloneElement(icon as React.ReactElement, {
        className: cn(existingClassName, 'h-5 w-5', iconColorStyles[variant])
      } as React.HTMLAttributes<HTMLElement>);
    }
    
    return icon;
  };

  const isInteractive = !!onClick;

  return (
    <Card 
      className={cn(
        'group transition-all duration-300',
        isInteractive && 'cursor-pointer hover:shadow-lg hover:-translate-y-1',
        hoverStyles[variant],
        className
      )}
      onClick={onClick}
      data-tour={dataTour}
    >
      <CardHeader className='flex flex-row items-start justify-between gap-3'>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn(
              'p-2.5 rounded-xl transition-transform duration-300',
              iconContainerStyles[variant],
              isInteractive && 'group-hover:scale-110'
            )}>
              {renderIcon()}
            </div>
          )}

          <div>
            <CardDescription className={cn('text-xs font-medium mb-0.5', labelColorStyles[variant])}>
              {label}
            </CardDescription>
            <CardTitle className={cn('text-2xl font-bold tracking-tight', valueColorStyles[variant])}>
              {value}
            </CardTitle>
          </div>
        </div>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full',
              trend.direction === 'up' 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50' 
                : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50'
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.direction === 'up' ? '+' : '-'}{trend.value}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export default StatCard;
