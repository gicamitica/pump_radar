// ============================================================================
// Home Module Domain Models
// ============================================================================

/** Environment type for the workspace */
export type Environment = 'development' | 'staging' | 'production';

/** System snapshot statistics */
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  activeTeams: number;
}

/** Getting started checklist item */
export interface ChecklistItem {
  id: string;
  key: string;
  completed: boolean;
  completedAt?: string;
}

/** Activity item for the recent activity feed */
export interface ActivityItem {
  id: string;
  type: 'user' | 'team' | 'notification' | 'app' | 'system';
  action: string;
  description: string;
  actor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  target?: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** App/Module card for the explorer */
export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  enabled: boolean;
  badge?: string;
}

/** Home dashboard data */
export interface HomeDashboard {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  workspace: {
    name: string;
    environment: Environment;
  };
  stats: SystemStats;
  checklist: ChecklistItem[];
  recentActivity: ActivityItem[];
  apps: AppModule[];
  tourCompleted: boolean;
}

/** Tour completion state */
export interface TourState {
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
}
