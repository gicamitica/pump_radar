// ============================================================================
// Action & Activity Hub Domain Models
// ============================================================================

/** Command suggestion for the command palette */
export interface CommandSuggestion {
  id: string;
  label: string;
  description?: string;
  icon: string;
  path?: string;
  action?: string;
  shortcut?: string;
  category: 'navigation' | 'action' | 'search';
}

/** Today's focus item */
export interface FocusItem {
  id: string;
  type: 'invitation' | 'event' | 'task';
  title: string;
  description?: string;
  dueAt?: string;
  priority?: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionPath?: string;
}

/** Recent activity item (compact) */
export interface ActivityStreamItem {
  id: string;
  type: 'user' | 'team' | 'notification' | 'app' | 'system';
  action: string;
  summary: string;
  timestamp: string;
  actorName?: string;
  targetName?: string;
}

/** Recently used module */
export interface RecentModule {
  id: string;
  name: string;
  path: string;
  icon: string;
  lastVisitedAt: string;
  visitCount: number;
}

/** Quick stat item */
export interface QuickStat {
  id: string;
  label: string;
  value: number;
  change?: number;
  changeDirection?: 'up' | 'down';
}

/** Shortcut/automation item */
export interface ShortcutItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: string;
  action: string;
  isFavorite?: boolean;
}

/** Activity Hub state */
export interface ActivityHubState {
  commandSuggestions: CommandSuggestion[];
  focusItems: FocusItem[];
  activityStream: ActivityStreamItem[];
  recentModules: RecentModule[];
  quickStats: QuickStat[];
  shortcuts: ShortcutItem[];
  powerTipsCompleted: boolean;
}
