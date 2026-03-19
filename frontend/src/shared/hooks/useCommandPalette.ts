import { useState, useCallback, useMemo } from 'react';
import { useKeyboardShortcut } from './useKeyboardShortcut';

/**
 * Command definition for the command palette
 */
export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label for the command */
  label: string;
  /** Optional keywords for search matching */
  keywords?: string[];
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Optional group name for categorization */
  group?: string;
  /** Optional shortcut display text */
  shortcut?: string;
  /** Whether the command is disabled */
  disabled?: boolean;
  /** Action to execute when command is selected */
  action: () => void | Promise<void>;
}

/**
 * State of the command palette
 */
export interface CommandPaletteState {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Registered commands */
  commands: Command[];
}

/**
 * Return type of useCommandPalette
 */
export interface UseCommandPaletteReturn {
  /** Whether the palette is open */
  isOpen: boolean;
  /** All registered commands */
  commands: Command[];
  /** Commands grouped by their group property */
  groupedCommands: Map<string, Command[]>;
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
  /** Register commands (replaces existing) */
  register: (commands: Command[]) => void;
  /** Add commands to existing set */
  add: (commands: Command[]) => void;
  /** Remove commands by id */
  remove: (ids: string[]) => void;
  /** Clear all commands */
  clear: () => void;
  /** Execute a command by id */
  execute: (id: string) => Promise<void>;
}

/**
 * Options for useCommandPalette
 */
export interface UseCommandPaletteOptions {
  /** Initial commands to register */
  initialCommands?: Command[];
  /** Whether to enable Cmd/Ctrl+K shortcut (default: true) */
  enableShortcut?: boolean;
  /** Callback when a command is executed */
  onExecute?: (command: Command) => void;
}

/**
 * Hook to centralize command palette state and command registration.
 *
 * @param options - Configuration options
 * @returns Object with palette state and methods
 *
 * @example
 * ```tsx
 * const palette = useCommandPalette({
 *   initialCommands: [
 *     { id: 'dashboard', label: 'Go to Dashboard', group: 'Navigation', action: () => navigate('/dashboard') },
 *     { id: 'settings', label: 'Open Settings', group: 'Actions', action: () => openSettings() },
 *   ],
 * });
 *
 * // Register more commands
 * palette.register([...]);
 *
 * // Render
 * <CommandPalette
 *   open={palette.isOpen}
 *   onOpenChange={(open) => open ? palette.open() : palette.close()}
 *   commands={palette.commands}
 *   groupedCommands={palette.groupedCommands}
 *   onSelect={(cmd) => palette.execute(cmd.id)}
 * />
 * ```
 */
export function useCommandPalette(
  options: UseCommandPaletteOptions = {}
): UseCommandPaletteReturn {
  const { initialCommands = [], enableShortcut = true, onExecute } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>(initialCommands);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const register = useCallback((newCommands: Command[]) => {
    setCommands(newCommands);
  }, []);

  const add = useCallback((newCommands: Command[]) => {
    setCommands((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const filtered = newCommands.filter((c) => !existingIds.has(c.id));
      return [...prev, ...filtered];
    });
  }, []);

  const remove = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setCommands((prev) => prev.filter((c) => !idSet.has(c.id)));
  }, []);

  const clear = useCallback(() => {
    setCommands([]);
  }, []);

  const execute = useCallback(
    async (id: string) => {
      const command = commands.find((c) => c.id === id);
      if (command && !command.disabled) {
        await command.action();
        onExecute?.(command);
        close();
      }
    },
    [commands, onExecute, close]
  );

  // Group commands by their group property
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>();
    for (const cmd of commands) {
      const groupName = cmd.group || 'Commands';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(cmd);
    }
    return groups;
  }, [commands]);

  // Keyboard shortcut: Cmd/Ctrl + K to toggle
  useKeyboardShortcut(
    { key: 'k', ctrl: true },
    () => toggle(),
    { enabled: enableShortcut }
  );

  return {
    isOpen,
    commands,
    groupedCommands,
    open,
    close,
    toggle,
    register,
    add,
    remove,
    clear,
    execute,
  };
}

export default useCommandPalette;
