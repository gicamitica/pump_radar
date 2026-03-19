import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/components/ui/popover';
import { cn } from '@/shadcn/lib/utils';
import type { UseFilterEngineResult } from '@/shared/hooks/useFilterEngine';

interface FilterBarProps<T extends Record<string, unknown>> {
  engine: UseFilterEngineResult<T>;
  searchKey?: keyof T;
  searchPlaceholder?: string;
  children: React.ReactNode;
  className?: string;
  onClearAll?: () => void;
  labels?: {
    filters?: string;
    details?: string;
    clearAll?: string;
    reset?: string;
  };
  extra?: React.ReactNode;
}

/**
 * FilterBar Component
 * 
 * A high-level components that leverages useFilterEngine to provide a 
 * polished, space-efficient filtering UI with search and a filter popover.
 */
export function FilterBar<T extends Record<string, unknown>>({
  engine,
  searchKey,
  searchPlaceholder = "Search...",
  children,
  className,
  onClearAll,
  labels,
  extra,
}: FilterBarProps<T>) {
  const {
    filters: filtersLabel = "Filters",
    details: detailsLabel = "Filter Details",
    clearAll: clearAllLabel = "Clear All",
    reset: resetLabel = "Reset",
  } = labels || {};
  const handleSearchChange = (val: string) => {
    if (searchKey) {
      engine.set(searchKey, val as any);
    }
  };

  const clearSearch = () => {
    if (searchKey) {
      engine.reset(searchKey);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 w-full", className)}>
      {/* Search Input */}
      {searchKey !== undefined && (
        <div className="relative flex-1 max-w-[280px] group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-colors group-focus-within:text-primary">
             <Search className="h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
          </div>
          <Input
            placeholder={searchPlaceholder}
            value={(engine.values[searchKey] as string) || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 bg-muted/20 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl text-sm"
          />
          {engine.isActive(searchKey) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
               "h-10 px-4 gap-2 rounded-xl border-border/50 bg-muted/10 hover:bg-muted/30 transition-all",
               engine.hasActive && "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
            )}
          >
            <Filter className={cn("h-4 w-4 transition-colors", engine.hasActive ? "text-primary" : "text-muted-foreground/60")} />
            <span className="font-bold text-[10px] uppercase tracking-[0.15em]">{filtersLabel}</span>
            {engine.activeCount > 0 && (
              <Badge 
                variant="default" 
                className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20 ml-1"
              >
                {engine.activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-2xl border-border/50 shadow-2xl overflow-hidden" align="start">
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{detailsLabel}</span>
              {engine.hasActive && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll || engine.resetAll}
                  className="h-7 px-2 text-[10px] font-black uppercase tracking-[0.15em] text-primary hover:bg-primary/10"
                >
                  {clearAllLabel}
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-7">
              {children}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Extra content (e.g. stats) */}
      {extra && <div className="ml-auto transition-all animate-in fade-in slide-in-from-right-2">{extra}</div>}

      {/* Reset Global Button - visible only when filters are active */}
      {engine.hasActive && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll || engine.resetAll}
          className={cn(
            "h-10 px-3 text-muted-foreground/60 hover:text-primary transition-all gap-2 group",
            !extra && "ml-auto"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-[-90deg]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{resetLabel}</span>
        </Button>
      )}
    </div>
  );
}

/**
 * FilterSection Component
 * 
 * A wrapper for a group of filters inside the popover.
 */
export function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-1">{title}</h4>
      <div className="flex flex-wrap gap-2 px-0.5">
        {children}
      </div>
    </div>
  );
}

/**
 * FilterOption Component
 * 
 * A toggleable button for a filter option.
 */
export function FilterOption({ 
  selected, 
  onClick, 
  children,
  icon,
  className
}: { 
  selected: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all duration-200',
        selected
          ? 'bg-primary/5 border-primary/20 text-primary shadow-sm'
          : 'bg-transparent border-transparent text-muted-foreground/70 hover:bg-muted hover:border-border/50 hover:text-foreground',
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
