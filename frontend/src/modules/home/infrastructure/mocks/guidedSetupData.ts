import type {
  GuidedSetupState,
  SetupStep,
  SetupStepId,
  SetupStepStatus,
  ReadinessCheck,
  TourSetId,
} from '../../domain/models';

// ============================================================================
// Mock Data Store
// ============================================================================

const STEP_DURATIONS: Record<SetupStepId, number> = {
  'workspace-basics': 2,
  'invite-users': 5,
  'create-teams': 3,
  'configure-email': 5,
  'review-security': 3,
  'explore-apps': 2,
};

export const mockSteps: SetupStep[] = [
  { id: 'workspace-basics', order: 1, status: 'completed', completedAt: '2024-01-08T10:00:00Z' },
  { id: 'invite-users', order: 2, status: 'pending' },
  { id: 'create-teams', order: 3, status: 'pending' },
  { id: 'configure-email', order: 4, status: 'pending' },
  { id: 'review-security', order: 5, status: 'pending' },
  { id: 'explore-apps', order: 6, status: 'pending' },
];

export const mockReadinessChecks: ReadinessCheck[] = [
  { id: 'email-provider', key: 'emailProvider', passed: false },
  { id: 'notifications-active', key: 'notificationsActive', passed: false },
  { id: 'admin-users', key: 'adminUsers', passed: true, checkedAt: '2024-01-08T10:00:00Z' },
  { id: 'security-basics', key: 'securityBasics', passed: false },
];

export const mockTourCompletions: Record<string, boolean> = {
  'invite-users': false,
  'create-teams': false,
  'configure-email': false,
  'explore-apps': false,
};

let currentStepId: SetupStepId | null = 'invite-users';

// ============================================================================
// Helper Functions
// ============================================================================

function calculateProgress(): { completedSteps: number; estimatedMinutesRemaining: number; isComplete: boolean } {
  const completedSteps = mockSteps.filter((s) => s.status === 'completed').length;
  const pendingSteps = mockSteps.filter((s) => s.status === 'pending' || s.status === 'in_progress');
  const estimatedMinutesRemaining = pendingSteps.reduce(
    (acc, step) => acc + STEP_DURATIONS[step.id],
    0
  );
  const isComplete = completedSteps === mockSteps.length;

  return { completedSteps, estimatedMinutesRemaining, isComplete };
}

// ============================================================================
// Data Access Functions
// ============================================================================

export function getSetupState(): GuidedSetupState {
  const { completedSteps, estimatedMinutesRemaining, isComplete } = calculateProgress();

  return {
    progress: {
      totalSteps: mockSteps.length,
      completedSteps,
      currentStepId,
      estimatedMinutesRemaining,
      isComplete,
    },
    steps: [...mockSteps],
    readinessChecks: [...mockReadinessChecks],
    tourCompletions: { ...mockTourCompletions },
  };
}

export function updateStepStatus(
  stepId: SetupStepId,
  status: 'completed' | 'skipped'
): SetupStep | null {
  const index = mockSteps.findIndex((s) => s.id === stepId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  mockSteps[index] = {
    ...mockSteps[index],
    status: status as SetupStepStatus,
    completedAt: status === 'completed' ? now : undefined,
    skippedAt: status === 'skipped' ? now : undefined,
  };

  // Update readiness checks based on step completion
  if (status === 'completed') {
    updateReadinessForStep(stepId);
  }

  // Auto-advance current step
  const nextPending = mockSteps.find((s) => s.status === 'pending');
  currentStepId = nextPending?.id ?? null;

  return mockSteps[index];
}

function updateReadinessForStep(stepId: SetupStepId): void {
  const now = new Date().toISOString();
  switch (stepId) {
    case 'configure-email':
      updateReadinessCheck('email-provider', true, now);
      updateReadinessCheck('notifications-active', true, now);
      break;
    case 'review-security':
      updateReadinessCheck('security-basics', true, now);
      break;
  }
}

function updateReadinessCheck(id: string, passed: boolean, checkedAt: string): void {
  const index = mockReadinessChecks.findIndex((c) => c.id === id);
  if (index !== -1) {
    mockReadinessChecks[index] = {
      ...mockReadinessChecks[index],
      passed,
      checkedAt,
    };
  }
}

export function setCurrentStep(stepId: SetupStepId): GuidedSetupState {
  currentStepId = stepId;

  // Mark step as in_progress if it's pending
  const index = mockSteps.findIndex((s) => s.id === stepId);
  if (index !== -1 && mockSteps[index].status === 'pending') {
    mockSteps[index] = { ...mockSteps[index], status: 'in_progress' };
  }

  return getSetupState();
}

export function completeTourSet(tourId: TourSetId): void {
  mockTourCompletions[tourId] = true;
}

export function resetSetup(): GuidedSetupState {
  // Reset all steps except workspace-basics
  for (let i = 0; i < mockSteps.length; i++) {
    if (mockSteps[i].id === 'workspace-basics') {
      mockSteps[i] = { ...mockSteps[i], status: 'completed', completedAt: new Date().toISOString() };
    } else {
      mockSteps[i] = { ...mockSteps[i], status: 'pending', completedAt: undefined, skippedAt: undefined };
    }
  }

  // Reset readiness checks
  for (let i = 0; i < mockReadinessChecks.length; i++) {
    if (mockReadinessChecks[i].id !== 'admin-users') {
      mockReadinessChecks[i] = { ...mockReadinessChecks[i], passed: false, checkedAt: undefined };
    }
  }

  // Reset tour completions
  Object.keys(mockTourCompletions).forEach((key) => {
    mockTourCompletions[key] = false;
  });

  currentStepId = 'invite-users';

  return getSetupState();
}
