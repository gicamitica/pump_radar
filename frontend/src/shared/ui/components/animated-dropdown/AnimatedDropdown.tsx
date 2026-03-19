import React from 'react';
import {
  autoUpdate,
  flip,
  offset as flOffset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
  type Placement as FlPlacement,
  safePolygon,
} from '@floating-ui/react';
import { DropdownContext, type DropdownContextValue, type Placement } from './useAnimatedDropdown';

export interface AnimatedDropdownProps {
  /** Trigger mode: 'hover' auto-switches to 'click' on touch devices */
  openOn?: 'hover' | 'click';
  placement?: Placement;
  offset?: number;
  alignEdge?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  positionReference?: HTMLElement | null;
  matchReferenceWidth?: boolean;
  children: React.ReactNode;
}

const toFlPlacement = (p: Placement): FlPlacement => {
  return p as FlPlacement;
};

// Detect if device supports touch (coarse pointer = touch/stylus)
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTouch;
};

export const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({
  openOn = 'hover',
  placement = 'bottom-end',
  offset = 8,
  alignEdge = false,
  disabled = false,
  onOpenChange,
  positionReference,
  matchReferenceWidth = false,
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const isTouchDevice = useIsTouchDevice();
  // On touch devices, always use click behavior for better UX
  const effectiveOpenOn = isTouchDevice ? 'click' : openOn;
  const id = React.useId();

  const { refs, floatingStyles, context, update } = useFloating({
    open,
    onOpenChange: (o: boolean) => { if (!disabled) { setOpen(o); onOpenChange?.(o); } },
    placement: toFlPlacement(placement),
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      flOffset(offset),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply(args: Record<string, unknown>) {
          const { elements, availableHeight, rects } = args as {
            elements: Record<string, HTMLElement>;
            availableHeight: number;
            rects?: { reference: { width: number } };
          };
          const el = elements.floating;
          el.style.maxHeight = Math.min(availableHeight - 12, 0xffffff).toString() + 'px';
          if (matchReferenceWidth && rects?.reference) {
            el.style.width = rects.reference.width + 'px';
          }
          if (!alignEdge) {
            // no-op; floating-ui handles alignment based on placement
          }
        },
      }),
    ],
  });

  React.useLayoutEffect(() => {
    if (open) update();
  }, [open, update]);

  React.useEffect(() => {
    if (positionReference) {
      refs.setPositionReference(positionReference);
    }
  }, [positionReference, refs]);

  const hover = useHover(context, {
    enabled: effectiveOpenOn === 'hover' && !disabled,
    handleClose: safePolygon({ buffer: 4 }),
    delay: { open: 90, close: 120 },
    move: false,
  });
  const click = useClick(context, { enabled: effectiveOpenOn === 'click' && !disabled, toggle: true });
  const role = useRole(context, { role: 'menu' });
  // Dismiss on outside click/esc for click-mode (including touch devices)
  const dismiss = useDismiss(context, { enabled: effectiveOpenOn === 'click' && !disabled });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    role,
    dismiss,
  ]);

  React.useEffect(() => {
    if (!open) return;
    // Intentionally using a capture-phase listener: the dropdown's floating content can be portaled
    // and/or handle keyboard events internally. We want Escape to reliably close the dropdown even
    // when those events don't reach bubbling document listeners.
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [open]);

  const value: DropdownContextValue = React.useMemo(() => ({
    open,
    setOpen,
    placement,
    refs: { reference: refs.setReference, floating: refs.setFloating },
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    controlledBy: effectiveOpenOn,
    id,
    update,
  }), [open, placement, refs.setReference, refs.setFloating, floatingStyles, getReferenceProps, getFloatingProps, effectiveOpenOn, id, update]);

  return (
    <DropdownContext.Provider value={value}>{children}</DropdownContext.Provider>
  );
};

export default AnimatedDropdown;
