import type { ClassNamesConfig } from 'react-select';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';

const controlVariants = cva(
  "flex min-h-[var(--spacing-9)] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      isFocused: {
        true: "ring-1 ring-ring border-ring outline-none",
        false: ""
      },
      error: {
        true: "border-destructive ring-destructive",
        false: ""
      }
    },
    defaultVariants: {
      isFocused: false,
      error: false
    }
  }
);

export const getSelectClassNames = (error?: string): ClassNamesConfig => ({
  container: () => "relative w-full",
  control: ({ isFocused }) => cn(
    controlVariants({ isFocused, error: !!error }),
    "hover:border-input" // Override react-select's hover behavior to match shadcn
  ),
  placeholder: () => "text-muted-foreground",
  input: () => "text-sm text-foreground",
  singleValue: () => "text-sm text-foreground",
  multiValue: () => "rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground mb-1 mr-1",
  multiValueLabel: () => "",
  multiValueRemove: () => "ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors",
  menu: () => "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 mt-1 my-1",
  menuList: () => "p-1 max-h-[var(--radix-select-content-max-height)]",
  option: ({ isFocused, isSelected, isDisabled }) => cn(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
    isFocused && "bg-accent text-accent-foreground",
    isSelected && "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    isDisabled && "pointer-events-none opacity-50"
  ),
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "text-muted-foreground opacity-50 px-1",
  clearIndicator: () => "text-muted-foreground opacity-50 hover:opacity-100 px-1 cursor-pointer",
  valueContainer: () => "px-0 gap-1",
});
