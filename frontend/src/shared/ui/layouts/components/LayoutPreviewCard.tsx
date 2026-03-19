import React from 'react';
import { SelectionCard } from '@/shared/ui/components/SelectionCard';

interface LayoutPreviewCardProps {
  active: boolean;
  image?: string;
  title: string;
  description: string;
  onClick: () => void;
  fallbackVariant?: string;
}

/**
 * LayoutPreviewCard - Visual preview card for layout selection
 * 
 * Shows layout preview with title, description, and active state
 * Falls back to CSS-based preview if no image provided
 */
export const LayoutPreviewCard: React.FC<LayoutPreviewCardProps> = ({
  active,
  title,
  description,
  onClick,
  fallbackVariant = 'boxed',
}) => {
  return (
    <SelectionCard
      selected={active}
      title={title}
      description={description}
      onClick={onClick}
    >
      <LayoutFallbackPreview variant={fallbackVariant} />
    </SelectionCard>
  );
};

/**
 * LayoutFallbackPreview - CSS-based layout preview when no image provided
 */
const LayoutFallbackPreview: React.FC<{ variant: string }> = ({ variant }) => {
  if (variant === 'boxed') {
    return (
      <div className="h-full w-full p-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="h-full w-full flex gap-2">
          <div className="w-16 bg-white dark:bg-gray-700 rounded shadow-sm" />
          <div className="flex-1 bg-white dark:bg-gray-700 rounded shadow-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'edge') {
    return (
      <div className="h-full w-full flex">
        <div className="w-16 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  if (variant === 'double-sidebar') {
    return (
      <div className="h-full w-full p-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="h-full w-full flex gap-1">
          <div className="w-8 bg-white dark:bg-gray-700 rounded-l shadow-sm" />
          <div className="w-20 bg-white dark:bg-gray-700 shadow-sm" />
          <div className="flex-1 bg-white dark:bg-gray-700 rounded-r shadow-sm" />
        </div>
      </div>
    );
  }

  // Horizontal layouts
  if (variant === 'solid') {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="h-3 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-1">
          <div className="h-full bg-white dark:bg-gray-800 rounded shadow-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="h-3 bg-gray-900 border-b border-gray-800" />
        <div className="h-4 bg-gray-800 border-b border-gray-700" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-1">
          <div className="h-full bg-white dark:bg-gray-900 rounded shadow-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="h-7 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-1">
          <div className="h-full bg-white dark:bg-gray-900 rounded shadow-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="h-full w-full flex flex-col relative">
        <div className="h-12 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-1 -mt-4">
          <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg" />
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="h-3 bg-gray-900" />
        <div className="h-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-1">
          <div className="h-full bg-white dark:bg-gray-900 rounded shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
      <span className="text-xs text-gray-500">Preview</span>
    </div>
  );
};
