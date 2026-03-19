import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories/BaseRepository';
import type { IHomeRepository } from '../../domain/ports/IHomeRepository';
import type { HomeDashboard, ChecklistItem, TourState } from '../../domain/models';

@injectable()
export class HomeRepository extends BaseRepository implements IHomeRepository {
  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async getDashboard(): Promise<HomeDashboard> {
    return this.get<HomeDashboard>('/api/home/dashboard', 'Failed to load dashboard');
  }

  async updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
    return this.patch<ChecklistItem>(
      `/api/home/checklist/${itemId}`,
      { completed },
      'Failed to update checklist item'
    );
  }

  async getTourState(): Promise<TourState> {
    return this.get<TourState>('/api/home/tour', 'Failed to get tour state');
  }

  async completeTour(): Promise<TourState> {
    return this.post<TourState>('/api/home/tour/complete', undefined, 'Failed to complete tour');
  }

  async skipTour(): Promise<TourState> {
    return this.post<TourState>('/api/home/tour/skip', undefined, 'Failed to skip tour');
  }

  async resetTour(): Promise<TourState> {
    return this.post<TourState>('/api/home/tour/reset', undefined, 'Failed to reset tour');
  }
}
