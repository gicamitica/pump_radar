import type { HomeDashboard, ChecklistItem, TourState } from '../models';

export interface IHomeRepository {
  getDashboard(): Promise<HomeDashboard>;
  updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem>;
  getTourState(): Promise<TourState>;
  completeTour(): Promise<TourState>;
  skipTour(): Promise<TourState>;
  resetTour(): Promise<TourState>;
}
