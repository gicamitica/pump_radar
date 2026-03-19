import React, { useCallback, useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/shared/ui/shadcn/components/ui/command';
import type { Command } from '@/shared/hooks/useCommandPalette';
import { HighlightedText } from '@/shared/ui/components/HighlightedText';

/**
 * Props for CommandPalette component
 */
export interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** All registered commands */
  commands: Command[];
  /** Commands grouped by their group property */
  groupedCommands: Map<string, Command[]>;
  /** Callback when a command is selected */
  onSelect: (command: Command) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Text to show when no commands match */
  emptyText?: string;
}

/**
 * Reusable command palette component built on cmdk and shadcn/ui.
 *
 * @example
 * ```tsx
 * const palette = useCommandPalette({ initialCommands: [...] });
 *
 * <CommandPalette
 *   open={palette.isOpen}
 *   onOpenChange={(open) => open ? palette.open() : palette.close()}
 *   commands={palette.commands}
 *   groupedCommands={palette.groupedCommands}
 *   onSelect={(cmd) => palette.execute(cmd.id)}
 * />
 * ```
 */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
  groupedCommands,
  onSelect,
  placeholder = 'Type a command or search...',
  emptyText = 'No commands found.',
}: CommandPaletteProps): React.ReactElement {
  const [query, setQuery] = useState('');

  const handleSelect = useCallback(
    (commandId: string) => {
      const command = commands.find((c) => c.id === commandId);
      if (command && !command.disabled) {
        onSelect(command);
      }
    },
    [commands, onSelect]
  );

  // Convert grouped commands to array for rendering
  const groups = Array.from(groupedCommands.entries());

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} showCloseButton={false}>
      <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        {groups.map(([groupName, groupCommands]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {groupCommands.map((command) => (
              <CommandItem
                key={command.id}
                value={`${command.label} ${command.keywords?.join(' ') || ''}`}
                onSelect={() => handleSelect(command.id)}
                disabled={command.disabled}
              >
                {command.icon && <span className="mr-2">{command.icon}</span>}
                <span>
                  <HighlightedText text={command.label} query={query} />
                </span>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
