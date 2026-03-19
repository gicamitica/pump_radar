import type { HomeDashboard, ChecklistItem, TourState, ActivityItem, AppModule } from '../../domain/models';

// ============================================================================
// Mock Data Store
// ============================================================================

export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'admin@pumpradar.io',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
};

export const mockWorkspace = {
  name: 'PumpRadar',
  environment: 'development' as const,
};

export const mockStats = {
  totalUsers: 156,
  activeUsers: 142,
  pendingInvitations: 8,
  activeTeams: 12,
};

export const mockChecklist: ChecklistItem[] = [
  { id: 'invite-users', key: 'inviteUsers', completed: false },
  { id: 'create-team', key: 'createTeam', completed: true, completedAt: '2024-01-10T10:30:00Z' },
  { id: 'configure-email', key: 'configureEmail', completed: false },
  { id: 'review-notifications', key: 'reviewNotifications', completed: false },
  { id: 'explore-apps', key: 'exploreApps', completed: true, completedAt: '2024-01-08T14:20:00Z' },
];

export const mockActivity: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'user',
    action: 'user.created',
    description: 'New user joined the workspace',
    actor: { id: 'user-2', name: 'Sarah Miller', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
    target: { id: 'user-5', name: 'Alex Johnson', type: 'user' },
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
  },
  {
    id: 'act-2',
    type: 'team',
    action: 'team.member.added',
    description: 'Added member to team',
    actor: { id: 'user-3', name: 'Mike Chen', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike' },
    target: { id: 'team-1', name: 'Engineering', type: 'team' },
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
  },
  {
    id: 'act-3',
    type: 'notification',
    action: 'notification.sent',
    description: 'System notification sent',
    actor: { id: 'system', name: 'System', avatarUrl: undefined },
    target: { id: 'notif-1', name: 'Weekly Report', type: 'notification' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'act-4',
    type: 'app',
    action: 'app.accessed',
    description: 'Accessed application',
    actor: { id: 'user-4', name: 'Emily Davis', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' },
    target: { id: 'app-kanban', name: 'Kanban', type: 'app' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'act-5',
    type: 'team',
    action: 'team.created',
    description: 'New team created',
    actor: { id: 'user-1', name: 'John Doe', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
    target: { id: 'team-3', name: 'Marketing', type: 'team' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'act-6',
    type: 'user',
    action: 'user.role.changed',
    description: 'User role updated',
    actor: { id: 'user-1', name: 'John Doe', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
    target: { id: 'user-6', name: 'Chris Wilson', type: 'user' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

export const mockApps: AppModule[] = [
  {
    id: 'users',
    name: 'Users',
    description: 'Manage user accounts and permissions',
    icon: 'Users',
    path: '/',
    enabled: true,
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'Organize users into teams',
    icon: 'UsersRound',
    path: '/',
    enabled: true,
  },
  {
    id: 'email',
    name: 'Email & Notifications',
    description: 'Configure email templates and notifications',
    icon: 'Mail',
    path: '/',
    enabled: true,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule and manage events',
    icon: 'Calendar',
    path: '/',
    enabled: true,
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Visual project management boards',
    icon: 'Kanban',
    path: '/',
    enabled: true,
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Team messaging and collaboration',
    icon: 'MessageSquare',
    path: '/',
    enabled: true,
  },
];

export let mockTourState: TourState = {
  completed: false,
  skipped: false,
};

// ============================================================================
// Data Access Functions
// ============================================================================

export function getDashboard(): HomeDashboard {
  return {
    user: mockUser,
    workspace: mockWorkspace,
    stats: mockStats,
    checklist: [...mockChecklist], // Return new array reference for React Query to detect changes
    recentActivity: mockActivity,
    apps: mockApps,
    tourCompleted: mockTourState.completed || mockTourState.skipped,
  };
}

export function updateChecklistItem(itemId: string, completed: boolean): ChecklistItem | null {
  const index = mockChecklist.findIndex((item) => item.id === itemId);
  if (index === -1) return null;

  mockChecklist[index] = {
    ...mockChecklist[index],
    completed,
    completedAt: completed ? new Date().toISOString() : undefined,
  };

  return mockChecklist[index];
}

export function getTourState(): TourState {
  return mockTourState;
}

export function completeTour(): TourState {
  mockTourState = {
    completed: true,
    completedAt: new Date().toISOString(),
    skipped: false,
  };
  return mockTourState;
}

export function skipTour(): TourState {
  mockTourState = {
    completed: false,
    skipped: true,
  };
  return mockTourState;
}

export function resetTour(): TourState {
  mockTourState = {
    completed: false,
    skipped: false,
  };
  return mockTourState;
}
