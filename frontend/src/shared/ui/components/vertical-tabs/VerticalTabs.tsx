import React, { useState, useCallback } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { VerticalTabsContext } from './VerticalTabsContext';
import { useVerticalTabs } from './useVerticalTabs';

// ============================================
// Vertical Tabs Root
// ============================================

interface VerticalTabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  defaultValue,
  children,
  className,
  onChange,
}) => {
  const [activeTab, setActiveTabState] = useState(defaultValue);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    onChange?.(tab);
  }, [onChange]);

  return (
    <VerticalTabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('flex gap-6', className)}>
        {children}
      </div>
    </VerticalTabsContext.Provider>
  );
};

// ============================================
// Vertical Tabs List (Left Panel)
// ============================================

interface VerticalTabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const VerticalTabsList: React.FC<VerticalTabsListProps> = ({
  children,
  className,
}) => {
  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      className={cn(
        'flex flex-col gap-1 shrink-0',
        'border-r border-border/50 pr-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// ============================================
// Vertical Tab Trigger
// ============================================

interface VerticalTabTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const VerticalTabTrigger: React.FC<VerticalTabTriggerProps> = ({
  value,
  children,
  icon,
  description,
  className,
}) => {
  const { activeTab, setActiveTab } = useVerticalTabs();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      onClick={() => setActiveTab(value)}
      className={cn(
        'flex items-start gap-3 w-full px-3 py-2.5 rounded-lg text-left',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive
          ? 'bg-primary/10 text-primary border-l-2 border-primary -ml-[2px]'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        className
      )}
    >
      {icon && (
        <span className={cn(
          'shrink-0 mt-0.5',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className={cn(
          'text-sm font-medium',
          isActive && 'font-semibold'
        )}>
          {children}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        )}
      </div>
    </button>
  );
};

// ============================================
// Vertical Tab Content
// ============================================

interface VerticalTabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const VerticalTabContent: React.FC<VerticalTabContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useVerticalTabs();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn(
        'flex-1 min-w-0',
        'animate-in fade-in-0 slide-in-from-right-2 duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};
