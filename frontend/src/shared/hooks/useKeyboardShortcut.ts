import { useEffect, useRef } from 'react';

export interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
}

type ShortcutHandler = (event: KeyboardEvent) => void;

const INPUT_ELEMENTS = ['INPUT', 'TEXTAREA', 'SELECT'];

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  return (
    INPUT_ELEMENTS.includes(element.tagName) ||
    element.isContentEditable
  );
}

function normalizeKey(key: string): string {
  return key.toLowerCase();
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const key = normalizeKey(event.key);
  const shortcutKey = normalizeKey(shortcut.key);

  if (key !== shortcutKey) return false;

  const ctrlOrCmd = shortcut.ctrl || shortcut.cmd;
  const eventCtrlOrCmd = event.ctrlKey || event.metaKey;

  if (ctrlOrCmd && !eventCtrlOrCmd) return false;
  if (!ctrlOrCmd && eventCtrlOrCmd) return false;

  if (shortcut.shift && !event.shiftKey) return false;
  if (!shortcut.shift && event.shiftKey) return false;

  if (shortcut.alt && !event.altKey) return false;
  if (!shortcut.alt && event.altKey) return false;

  return true;
}

/**
 * A reusable hook for registering keyboard shortcuts.
 *
 * @param shortcut - The key combination to listen for
 * @param handler - The callback to execute when the shortcut is triggered
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Simple shortcut
 * useKeyboardShortcut({ key: 'k', ctrl: true }, () => {
 *   setIsOpen(true);
 * });
 *
 * // With options
 * useKeyboardShortcut(
 *   { key: 's', ctrl: true },
 *   () => handleSave(),
 *   { preventDefault: true }
 * );
 *
 * // Disabled shortcut
 * useKeyboardShortcut(
 *   { key: 'Escape' },
 *   () => handleClose(),
 *   { enabled: isOpen }
 * );
 * ```
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  handler: ShortcutHandler,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
  } = options;

  const handlerRef = useRef<ShortcutHandler>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (ignoreInputs && isInputElement(event.target)) {
        return;
      }

      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        handlerRef.current(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, enabled, preventDefault, ignoreInputs]);
}

/**
 * A hook for registering multiple keyboard shortcuts at once.
 *
 * @param shortcuts - Array of shortcut configurations
 * @param options - Shared configuration options for all shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { shortcut: { key: 'k', ctrl: true }, handler: () => openSearch() },
 *   { shortcut: { key: 'n', ctrl: true }, handler: () => createNew() },
 *   { shortcut: { key: 'Escape' }, handler: () => closeModal() },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    shortcut: KeyboardShortcut;
    handler: ShortcutHandler;
    options?: KeyboardShortcutOptions;
  }>,
  globalOptions: KeyboardShortcutOptions = {}
): void {
  const handlersRef = useRef<Map<string, ShortcutHandler>>(new Map());

  useEffect(() => {
    shortcuts.forEach(({ shortcut, handler }) => {
      const key = `${shortcut.key}-${shortcut.ctrl}-${shortcut.cmd}-${shortcut.shift}-${shortcut.alt}`;
      handlersRef.current.set(key, handler);
    });
  }, [shortcuts]);

  useEffect(() => {
    const {
      enabled: globalEnabled = true,
      preventDefault: globalPreventDefault = true,
      ignoreInputs: globalIgnoreInputs = true,
    } = globalOptions;

    if (!globalEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const { shortcut, handler, options = {} } of shortcuts) {
        const {
          enabled = true,
          preventDefault = globalPreventDefault,
          ignoreInputs = globalIgnoreInputs,
        } = options;

        if (!enabled) continue;

        if (ignoreInputs && isInputElement(event.target)) {
          continue;
        }

        if (matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, globalOptions]);
}
