import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

interface SelectionCardProps {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * SelectionCard - Reusable card component for selection interfaces
 * 
 * Features:
 * - Visual active state with checkmark indicator
 * - Hover and focus states
 * - Accessible button semantics
 * - Flexible content area via children
 */
export const SelectionCard: React.FC<SelectionCardProps> = ({
  selected,
  title,
  description,
  onClick,
  children,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-lg border-2 transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
    >
      {/* Active indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center justify-center size-6 rounded-full bg-blue-500 text-white shadow-lg">
          <Check className="size-4" />
        </div>
      )}

      {/* Preview content */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-gray-100 dark:bg-gray-900">
        {children}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-4 text-left">
        <h3 className={cn(
          'font-semibold text-sm',
          selected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
        )}>
          {title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};
