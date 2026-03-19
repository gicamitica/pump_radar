import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  UserPlus,
  UsersRound,
  Users,
  Mail,
  Calendar,
  Kanban,
  Settings,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";
import { useKeyboardShortcut } from "@/shared/hooks";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/shared/ui/shadcn/components/ui/command";
import { useTheme } from "@/app/providers/useTheme";
import { SYSTEM_PATHS } from "@/modules/system/ui/routes/paths";

interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
  action: () => void;
}

export function GlobalCommandPalette() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Global keyboard shortcut to open palette
  useKeyboardShortcut({ key: "k", ctrl: true }, () => setIsOpen(true), {
    enabled: !isOpen,
  });

  // Global shortcuts for quick actions (work from anywhere when palette is closed)
  useKeyboardShortcut({ key: "i", ctrl: true }, () => {}, { enabled: !isOpen });

  useKeyboardShortcut({ key: "m", ctrl: true }, () => {}, { enabled: !isOpen });

  // Navigation shortcuts using "G" prefix (press G, then the letter)
  // For simplicity, using Ctrl+G+letter pattern
  useKeyboardShortcut(
    { key: "d", ctrl: true, shift: true },
    () => navigate("/"),
    { enabled: !isOpen }
  );

  useKeyboardShortcut(
    { key: "u", ctrl: true, shift: true },
    () => navigate("/"),
    { enabled: !isOpen }
  );

  useKeyboardShortcut(
    { key: "s", ctrl: true, shift: true },
    () => navigate("/"),
    { enabled: !isOpen }
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const handleCommandSelect = useCallback(
    (command: PaletteCommand) => {
      command.action();
      handleClose();
    },
    [handleClose]
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      navigate(
        `${SYSTEM_PATHS.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`
      );
      handleClose();
    }
  }, [navigate, handleClose, searchQuery]);

  const commands: PaletteCommand[] = useMemo(
    () => [
      // Quick Actions
      {
        id: "invite-user",
        label: t("commands.inviteUser", "Invite User"),
        group: t("commands.groups.actions", "Quick Actions"),
        icon: <UserPlus className="h-4 w-4" />,
        shortcut: "Ctrl+I",
        keywords: ["invite", "user", "add", "new"],
        action: () => {},
      },
      {
        id: "create-team",
        label: t("commands.createTeam", "Create Team"),
        group: t("commands.groups.actions", "Quick Actions"),
        icon: <UsersRound className="h-4 w-4" />,
        shortcut: "Ctrl+M",
        keywords: ["create", "team", "add", "new", "group"],
        action: () => {},
      },
      {
        id: "send-email",
        label: t("commands.sendEmail", "Send Test Email"),
        group: t("commands.groups.actions", "Quick Actions"),
        icon: <Mail className="h-4 w-4" />,
        keywords: ["email", "send", "test", "mail"],
        action: () => navigate("/"),
      },
      {
        id: "toggle-theme",
        label:
          theme === "dark"
            ? t("commands.lightMode", "Switch to Light Mode")
            : t("commands.darkMode", "Switch to Dark Mode"),
        group: t("commands.groups.actions", "Quick Actions"),
        icon:
          theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          ),
        keywords: ["theme", "dark", "light", "mode", "toggle"],
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
      },

      // Navigation
      {
        id: "go-dashboard",
        label: t("commands.dashboard", "Go to Dashboard"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <LayoutDashboard className="h-4 w-4" />,
        shortcut: "Ctrl+Shift+D",
        keywords: ["dashboard", "home", "main"],
        action: () => navigate("/"),
      },
      {
        id: "go-users",
        label: t("commands.users", "Go to Users"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <Users className="h-4 w-4" />,
        shortcut: "Ctrl+Shift+U",
        keywords: ["users", "management", "people"],
        action: () => navigate("/management/users"),
      },
      {
        id: "go-teams",
        label: t("commands.teams", "Go to Teams"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <UsersRound className="h-4 w-4" />,
        keywords: ["teams", "groups", "management"],
        action: () => navigate("/"),
      },
      {
        id: "go-calendar",
        label: t("commands.calendar", "Go to Calendar"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <Calendar className="h-4 w-4" />,
        keywords: ["calendar", "schedule", "events"],
        action: () => navigate("/"),
      },
      {
        id: "go-kanban",
        label: t("commands.kanban", "Go to Kanban"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <Kanban className="h-4 w-4" />,
        keywords: ["kanban", "board", "tasks", "projects"],
        action: () => navigate("/"),
      },
      {
        id: "go-settings",
        label: t("commands.settings", "Go to Settings"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <Settings className="h-4 w-4" />,
        shortcut: "Ctrl+Shift+S",
        keywords: ["settings", "preferences", "config"],
        action: () => navigate("/"),
      },
      {
        id: "go-changelog",
        label: t("commands.changelog", "Go to Changelog"),
        group: t("commands.groups.navigation", "Navigation"),
        icon: <FileText className="h-4 w-4" />,
        keywords: ["changelog", "updates", "releases", "version"],
        action: () => navigate("/system/changelog"),
      },

      // Help
      {
        id: "help",
        label: t("commands.help", "Help & Documentation"),
        group: t("commands.groups.help", "Help"),
        icon: <HelpCircle className="h-4 w-4" />,
        keywords: ["help", "docs", "documentation", "support"],
        action: () => navigate("/"),
      },
    ],
    [t, navigate, theme, setTheme]
  );

  // Group commands by their group property
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, PaletteCommand[]>();
    for (const cmd of commands) {
      const groupName = cmd.group;
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(cmd);
    }
    return Array.from(groups.entries());
  }, [commands]);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex-1 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200/70 dark:border-neutral-700 px-3 py-2 text-sm text-muted-foreground transition-colors cursor-pointer"
        aria-label={t("topbar.search", "Search")}
      >
        <Search className="h-4 w-4 text-gray-400" />
        <span className="hidden sm:inline">
          {t("topbar.searchPlaceholder", "Search or type a command...")}
        </span>
        <span className="sm:hidden">{t("topbar.search", "Search")}</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-white dark:bg-neutral-900 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <CommandDialog
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        showCloseButton={false}
      >
        <CommandInput
          placeholder={t("commands.placeholder", "Search or type a command...")}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                {t("commands.noResults", "No commands found.")}
              </p>
              {searchQuery.trim() && (
                <button
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                  onClick={handleSearchSubmit}
                >
                  <Search className="h-4 w-4" />
                  {t("commands.searchFor", "Search for")} "{searchQuery}"
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </CommandEmpty>
          {groupedCommands.map(([groupName, groupCmds]) => (
            <CommandGroup key={groupName} heading={groupName}>
              {groupCmds.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(" ") || ""}`}
                  onSelect={() => handleCommandSelect(command)}
                >
                  <span className="mr-2">{command.icon}</span>
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
