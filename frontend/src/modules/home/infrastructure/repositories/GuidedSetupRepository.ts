import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories/BaseRepository';
import type { IGuidedSetupRepository } from '../../domain/ports/IGuidedSetupRepository';
import type { GuidedSetupState, SetupStep, SetupStepId, TourSetId } from '../../domain/models';

@injectable()
export class GuidedSetupRepository extends BaseRepository implements IGuidedSetupRepository {
  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async getSetupState(): Promise<GuidedSetupState> {
    return this.get<GuidedSetupState>('/home/setup', 'Failed to load setup state');
  }

  async updateStepStatus(stepId: SetupStepId, status: 'completed' | 'skipped'): Promise<SetupStep> {
    return this.patch<SetupStep>(
      `/home/setup/steps/${stepId}`,
      { status },
      'Failed to update step status'
    );
  }

  async setCurrentStep(stepId: SetupStepId): Promise<GuidedSetupState> {
    return this.post<GuidedSetupState>(
      `/home/setup/current-step`,
      { stepId },
      'Failed to set current step'
    );
  }

  async completeTourSet(tourId: TourSetId): Promise<void> {
    return this.post<void>(
      `/home/setup/tours/${tourId}/complete`,
      undefined,
      'Failed to complete tour'
    );
  }

  async resetSetup(): Promise<GuidedSetupState> {
    return this.post<GuidedSetupState>('/home/setup/reset', undefined, 'Failed to reset setup');
  }
}
