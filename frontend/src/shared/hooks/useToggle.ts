import { useState, useCallback } from 'react';

export interface UseToggleReturn {
  value: boolean;
  on: () => void;
  off: () => void;
  toggle: () => void;
  set: (value: boolean) => void;
}

/**
 * A simple hook for managing boolean toggle state.
 *
 * @param initialValue - The initial boolean value (default: false)
 * @returns Toggle state and control functions
 *
 * @example
 * ```tsx
 * const { value: isOpen, on: open, off: close, toggle } = useToggle(false);
 *
 * <Button onClick={open}>Open</Button>
 * <Button onClick={close}>Close</Button>
 * <Button onClick={toggle}>Toggle</Button>
 *
 * {isOpen && <Modal onClose={close} />}
 * ```
 */
export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const on = useCallback(() => {
    setValue(true);
  }, []);

  const off = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return {
    value,
    on,
    off,
    toggle,
    set,
  };
}
