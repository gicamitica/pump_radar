import type { ActivityHubState, ActivityStreamItem } from '../models';

export interface IActivityHubRepository {
  getHubState(): Promise<ActivityHubState>;
  getMoreActivity(offset: number, limit: number): Promise<ActivityStreamItem[]>;
  recordModuleVisit(moduleId: string): Promise<void>;
  toggleShortcutFavorite(shortcutId: string): Promise<void>;
  completePowerTips(): Promise<void>;
}
