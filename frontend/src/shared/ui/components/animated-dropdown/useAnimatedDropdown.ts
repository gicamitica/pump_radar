import React from 'react';

export type Placement = 
  | 'bottom-end' | 'bottom-start' | 'bottom'
  | 'top-end' | 'top-start' | 'top'
  | 'right-start' | 'right-end' | 'right'
  | 'left-start' | 'left-end' | 'left';

export interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  placement: Placement;
  refs: {
    reference: (node: HTMLElement | null) => void;
    floating: (node: HTMLElement | null) => void;
  };
  floatingStyles: React.CSSProperties;
  getReferenceProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>;
  getFloatingProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
  controlledBy: 'hover' | 'click';
  id: string;
  update: () => void;
}

export const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export const useAnimatedDropdown = () => {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('AnimatedDropdown components must be used within <AnimatedDropdown>');
  return ctx;
};
