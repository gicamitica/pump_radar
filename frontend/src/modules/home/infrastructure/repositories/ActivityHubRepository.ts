import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories/BaseRepository';
import type { IActivityHubRepository } from '../../domain/ports/IActivityHubRepository';
import type { ActivityHubState, ActivityStreamItem } from '../../domain/models';

@injectable()
export class ActivityHubRepository extends BaseRepository implements IActivityHubRepository {
  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async getHubState(): Promise<ActivityHubState> {
    return this.get<ActivityHubState>('/home/activity-hub', 'Failed to load activity hub');
  }

  async getMoreActivity(offset: number, limit: number): Promise<ActivityStreamItem[]> {
    const query = this.buildQueryString({ offset, limit });
    return this.get<ActivityStreamItem[]>(
      this.appendQuery('/home/activity-hub/activity', query),
      'Failed to load more activity'
    );
  }

  async recordModuleVisit(moduleId: string): Promise<void> {
    return this.post<void>(
      `/home/activity-hub/modules/${moduleId}/visit`,
      undefined,
      'Failed to record module visit'
    );
  }

  async toggleShortcutFavorite(shortcutId: string): Promise<void> {
    return this.post<void>(
      `/home/activity-hub/shortcuts/${shortcutId}/toggle-favorite`,
      undefined,
      'Failed to toggle shortcut favorite'
    );
  }

  async completePowerTips(): Promise<void> {
    return this.post<void>(
      '/home/activity-hub/power-tips/complete',
      undefined,
      'Failed to complete power tips'
    );
  }
}
