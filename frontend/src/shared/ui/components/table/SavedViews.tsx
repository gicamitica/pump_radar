import { useState } from 'react';
import { LayoutGrid, Plus, Save, Trash2, Check, ChevronDown, ListFilter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/components/ui/dropdown-menu';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { usePersistentState, useConfirmation } from '@/shared/hooks';
import { cn } from '@/shadcn/lib/utils';
import { toast } from 'sonner';

export interface ViewDefinition<TFilters = any> {
  id: string;
  name: string;
  filters: TFilters;
  sorting?: any;
  isDefault?: boolean;
}

export interface SavedViewsProps<TFilters = any> {
  /** Unique key for storage persistence */
  storageKey: string;
  /** Current active filter state */
  currentFilters: TFilters;
  /** Current active sorting state */
  currentSorting?: any;
  /** Callback when a view is selected */
  onViewSelect: (filters: TFilters, sorting?: any) => void;
  /** Initial views (if any) */
  initialViews?: ViewDefinition<TFilters>[];
  /** Label for the trigger button */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SavedViews - A generic component to manage saved filter/sort states for lists.
 * Supports saving, deleting, and setting default views with local storage persistence.
 */
export function SavedViews<TFilters = any>({
  storageKey,
  currentFilters,
  currentSorting,
  onViewSelect,
  initialViews = [],
  label = 'Views',
  className,
}: SavedViewsProps<TFilters>) {
  const [views, setViews] = usePersistentState<ViewDefinition<TFilters>[]>(
    `${storageKey}.savedViews`,
    initialViews
  );
  
  const [activeViewId, setActiveViewId] = usePersistentState<string | null>(
    `${storageKey}.activeViewId`,
    views.find(v => v.isDefault)?.id || null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const { confirm } = useConfirmation();

  const handleSaveView = () => {
    if (!newViewName.trim()) {
      toast.error('Please enter a name for the view');
      return;
    }

    const newView: ViewDefinition<TFilters> = {
      id: uuidv4(),
      name: newViewName.trim(),
      filters: currentFilters,
      sorting: currentSorting,
    };

    setViews([...views, newView]);
    setActiveViewId(newView.id);
    setNewViewName('');
    setIsSaving(false);
    toast.success(`View "${newView.name}" saved`);
  };

  const handleDeleteView = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete View',
      description: `Are you sure you want to delete the view "${name}"?`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });

    if (confirmed) {
      const updatedViews = views.filter(v => v.id !== id);
      setViews(updatedViews);
      if (activeViewId === id) {
        setActiveViewId(null);
      }
      toast.success(`View "${name}" deleted`);
    }
  };

  const handleSetDefault = (id: string) => {
    setViews(views.map(v => ({
      ...v,
      isDefault: v.id === id
    })));
    toast.success('Default view updated');
  };

  const activeView = views.find(v => v.id === activeViewId);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 font-medium border-dashed">
            <ListFilter className="h-4 w-4" />
            {activeView ? activeView.name : label}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => {
              setActiveViewId(null);
              // For reset, we pass empty filters or initial state
              // In this component we just notify the parent by selecting "null"
            }}
            className={cn(activeViewId === null && "bg-accent")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            All Items
            {activeViewId === null && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>

          {views.map((view) => (
            <div key={view.id} className="group relative">
              <DropdownMenuItem
                onClick={() => {
                  setActiveViewId(view.id);
                  onViewSelect(view.filters, view.sorting);
                }}
                className={cn(activeViewId === view.id && "bg-muted flex items-center")}
              >
                <span className="truncate flex-1">{view.name}</span>
                <span className="ml-auto flex items-center gap-2">
                  {activeViewId === view.id && <Check className="h-3 w-3" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(view.id);
                    }}
                    title={view.isDefault ? "Default view" : "Set as default"}
                  >
                    <Save className={cn("h-3.5 w-3.5", view.isDefault && "text-primary")} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteView(view.id, view.name);
                    }}
                    title="Delete view"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </DropdownMenuItem>
            </div>
          ))}

          <DropdownMenuSeparator />
          
          {isSaving ? (
            <div className="p-2 flex flex-col gap-2" onKeyDown={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                placeholder="View name..."
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveView();
                  }
                  if (e.key === 'Escape') {
                    setIsSaving(false);
                  }
                }}
                className="h-8 text-sm"
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-8 text-xs flex-1" onClick={handleSaveView}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs flex-1" onClick={() => setIsSaving(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); setIsSaving(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Save Current View
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SavedViews;
