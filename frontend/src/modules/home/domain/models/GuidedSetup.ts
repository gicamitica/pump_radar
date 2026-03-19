// ============================================================================
// Guided Workspace Setup Domain Models
// ============================================================================

/** Setup step status */
export type SetupStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** Setup step identifier */
export type SetupStepId = 
  | 'workspace-basics'
  | 'invite-users'
  | 'create-teams'
  | 'configure-email'
  | 'review-security'
  | 'explore-apps';

/** Individual setup step */
export interface SetupStep {
  id: SetupStepId;
  order: number;
  status: SetupStepStatus;
  completedAt?: string;
  skippedAt?: string;
}

/** System readiness check item */
export interface ReadinessCheck {
  id: string;
  key: string;
  passed: boolean;
  checkedAt?: string;
}

/** Setup progress summary */
export interface SetupProgress {
  totalSteps: number;
  completedSteps: number;
  currentStepId: SetupStepId | null;
  estimatedMinutesRemaining: number;
  isComplete: boolean;
}

/** Full guided setup state */
export interface GuidedSetupState {
  progress: SetupProgress;
  steps: SetupStep[];
  readinessChecks: ReadinessCheck[];
  tourCompletions: Record<string, boolean>;
}

/** Tour set identifier */
export type TourSetId = 'invite-users' | 'create-teams' | 'configure-email' | 'explore-apps';

/** Tour set definition */
export interface TourSet {
  id: TourSetId;
  stepId: SetupStepId;
  completed: boolean;
  completedAt?: string;
}
