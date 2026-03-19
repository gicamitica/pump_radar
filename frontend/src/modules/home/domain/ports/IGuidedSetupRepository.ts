import type { GuidedSetupState, SetupStep, SetupStepId, TourSetId } from '../models';

export interface IGuidedSetupRepository {
  getSetupState(): Promise<GuidedSetupState>;
  updateStepStatus(stepId: SetupStepId, status: 'completed' | 'skipped'): Promise<SetupStep>;
  setCurrentStep(stepId: SetupStepId): Promise<GuidedSetupState>;
  completeTourSet(tourId: TourSetId): Promise<void>;
  resetSetup(): Promise<GuidedSetupState>;
}
