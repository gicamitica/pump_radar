import type {
  ActivityHubState,
  CommandSuggestion,
  FocusItem,
  ActivityStreamItem,
  RecentModule,
  QuickStat,
  ShortcutItem,
} from '../../domain/models';

// ============================================================================
// Mock Data Store
// ============================================================================

export const mockCommandSuggestions: CommandSuggestion[] = [
  { id: 'cmd-1', label: 'Invite user', description: 'Send an invitation to a new user', icon: 'UserPlus', path: '/', category: 'action' },
  { id: 'cmd-2', label: 'Create team', description: 'Create a new team', icon: 'UsersRound', path: '/', category: 'action' },
  { id: 'cmd-3', label: 'Open calendar', description: 'View calendar events', icon: 'Calendar', path: '/', category: 'navigation' },
  { id: 'cmd-4', label: 'Send test email', description: 'Send a test notification email', icon: 'Mail', action: 'sendTestEmail', category: 'action' },
  { id: 'cmd-5', label: 'Go to Users', description: 'User management', icon: 'Users', path: '/', shortcut: 'G U', category: 'navigation' },
  { id: 'cmd-6', label: 'Go to Teams', description: 'Team management', icon: 'UsersRound', path: '/', shortcut: 'G T', category: 'navigation' },
  { id: 'cmd-7', label: 'Go to Settings', description: 'System settings', icon: 'Settings', path: '/', shortcut: 'G S', category: 'navigation' },
  { id: 'cmd-8', label: 'Open Kanban', description: 'Kanban boards', icon: 'Kanban', path: '/', category: 'navigation' },
];

export const mockFocusItems: FocusItem[] = [
  {
    id: 'focus-1',
    type: 'invitation',
    title: '3 pending invitations',
    description: 'Users waiting for approval',
    priority: 'high',
    actionLabel: 'Review',
    actionPath: '/',
  },
  {
    id: 'focus-2',
    type: 'event',
    title: 'Team standup in 30 min',
    description: 'Engineering team daily sync',
    dueAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    actionLabel: 'View',
    actionPath: '/',
  },
  {
    id: 'focus-3',
    type: 'task',
    title: 'Review security settings',
    description: 'Monthly security audit',
    dueAt: new Date().toISOString(),
    priority: 'medium',
    actionLabel: 'Start',
    actionPath: '/',
  },
  {
    id: 'focus-4',
    type: 'task',
    title: 'Update email templates',
    description: 'Q1 branding refresh',
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    priority: 'low',
    actionLabel: 'Edit',
    actionPath: '/',
  },
];

const generateActivityStream = (): ActivityStreamItem[] => {
  const actions = [
    { type: 'user' as const, action: 'user.invited', summary: 'invited alex@example.com' },
    { type: 'team' as const, action: 'team.created', summary: 'created team "Marketing"' },
    { type: 'user' as const, action: 'user.role.changed', summary: 'changed role for Sarah to Admin' },
    { type: 'notification' as const, action: 'notification.sent', summary: 'sent weekly report notification' },
    { type: 'app' as const, action: 'app.accessed', summary: 'accessed Kanban board' },
    { type: 'system' as const, action: 'system.backup', summary: 'system backup completed' },
    { type: 'user' as const, action: 'user.deactivated', summary: 'deactivated user john@old.com' },
    { type: 'team' as const, action: 'team.member.added', summary: 'added Mike to Engineering' },
  ];

  const actors = ['John Doe', 'Sarah Miller', 'Mike Chen', 'Emily Davis', 'System'];

  return Array.from({ length: 20 }, (_, i) => {
    const actionData = actions[i % actions.length];
    const actor = actors[i % actors.length];
    return {
      id: `activity-${i + 1}`,
      type: actionData.type,
      action: actionData.action,
      summary: `${actor} ${actionData.summary}`,
      timestamp: new Date(Date.now() - 1000 * 60 * (i * 15 + 5)).toISOString(),
      actorName: actor,
    };
  });
};

export const mockActivityStream: ActivityStreamItem[] = generateActivityStream();

export const mockRecentModules: RecentModule[] = [
  { id: 'mod-users', name: 'Users', path: '/', icon: 'Users', lastVisitedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), visitCount: 24 },
  { id: 'mod-teams', name: 'Teams', path: '/', icon: 'UsersRound', lastVisitedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), visitCount: 12 },
  { id: 'mod-email', name: 'Email', path: '/', icon: 'Mail', lastVisitedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), visitCount: 8 },
  { id: 'mod-calendar', name: 'Calendar', path: '/', icon: 'Calendar', lastVisitedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), visitCount: 15 },
  { id: 'mod-kanban', name: 'Kanban', path: '/', icon: 'Kanban', lastVisitedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), visitCount: 6 },
];

export const mockQuickStats: QuickStat[] = [
  { id: 'stat-users', label: 'Total Users', value: 156, change: 12, changeDirection: 'up' },
  { id: 'stat-teams', label: 'Active Teams', value: 12, change: 2, changeDirection: 'up' },
  { id: 'stat-invites', label: 'Pending Invites', value: 8, change: 3, changeDirection: 'down' },
];

export const mockShortcuts: ShortcutItem[] = [
  { id: 'sc-cmd', label: 'Command Palette', shortcut: 'Ctrl+K', icon: 'Command', action: 'openCommandPalette', isFavorite: true },
  { id: 'sc-search', label: 'Global Search', shortcut: 'Ctrl+/', icon: 'Search', action: 'openSearch', isFavorite: true },
  { id: 'sc-users', label: 'Go to Users', shortcut: 'G U', icon: 'Users', action: 'navigateUsers', isFavorite: false },
  { id: 'sc-teams', label: 'Go to Teams', shortcut: 'G T', icon: 'UsersRound', action: 'navigateTeams', isFavorite: false },
  { id: 'sc-settings', label: 'Go to Settings', shortcut: 'G S', icon: 'Settings', action: 'navigateSettings', isFavorite: true },
  { id: 'sc-help', label: 'Help', shortcut: '?', icon: 'HelpCircle', action: 'openHelp', isFavorite: false },
];

let powerTipsCompleted = false;

// ============================================================================
// Data Access Functions
// ============================================================================

export function getHubState(): ActivityHubState {
  return {
    commandSuggestions: mockCommandSuggestions,
    focusItems: mockFocusItems,
    activityStream: mockActivityStream.slice(0, 10),
    recentModules: mockRecentModules,
    quickStats: mockQuickStats,
    shortcuts: mockShortcuts,
    powerTipsCompleted,
  };
}

export function getMoreActivity(offset: number, limit: number): ActivityStreamItem[] {
  return mockActivityStream.slice(offset, offset + limit);
}

export function recordModuleVisit(moduleId: string): void {
  const module = mockRecentModules.find((m) => m.id === moduleId);
  if (module) {
    module.lastVisitedAt = new Date().toISOString();
    module.visitCount += 1;
  }
}

export function toggleShortcutFavorite(shortcutId: string): void {
  const shortcut = mockShortcuts.find((s) => s.id === shortcutId);
  if (shortcut) {
    shortcut.isFavorite = !shortcut.isFavorite;
  }
}

export function completePowerTips(): void {
  powerTipsCompleted = true;
}
