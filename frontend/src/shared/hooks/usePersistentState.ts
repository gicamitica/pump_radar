import { useState, useEffect, useRef } from 'react';

/**
 * usePersistentState - A hook that persists state to localStorage
 * 
 * @param key The localStorage key
 * @param initial The initial value if no value is found in localStorage
 * @param options Configuration options
 */
export function usePersistentState<T>(
  key: string | undefined,
  initial: T,
  options: {
    debounceMs?: number;
    syncTabs?: boolean;
  } = {}
) {
  const { debounceMs = 200, syncTabs = true } = options;
  
  // Initialize state from local storage or use initial value
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined' || !key) return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch (error) {
      // Use silent failure or simple console warning if needed
      // console.warn(`Error reading localStorage key "${key}":`, error);
      return initial;
    }
  });

  // Use a ref for the latest state to avoid unnecessary effect triggers
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist to localStorage with debounce
  useEffect(() => {
    if (!key || typeof window === 'undefined') return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(stateRef.current));
      } catch (error) {
        // console.warn(`Error writing to localStorage key "${key}":`, error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [key, state, debounceMs]);

  // Sync across tabs
  useEffect(() => {
    if (!key || !syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsed = JSON.parse(event.newValue) as T;
          setState(parsed);
        } catch (error) {
          // console.warn(`Error parsing StorageEvent for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncTabs]);

  return [state, setState] as const;
}
