import { http, delay } from 'msw';
import { ok } from '@/mocks/utils/apiResponse';
import {
  getHubState,
  getMoreActivity,
  recordModuleVisit,
  toggleShortcutFavorite,
  completePowerTips,
} from './activityHubData';

export const activityHubHandlers = [
  // GET /home/activity-hub - Get hub state
  http.get('/home/activity-hub', async () => {
    await delay(200);
    return ok(getHubState());
  }),

  // GET /home/activity-hub/activity - Get more activity
  http.get('/home/activity-hub/activity', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    return ok(getMoreActivity(offset, limit));
  }),

  // POST /home/activity-hub/modules/:moduleId/visit - Record module visit
  http.post('/home/activity-hub/modules/:moduleId/visit', async ({ params }) => {
    await delay(100);
    const moduleId = String(params.moduleId);
    recordModuleVisit(moduleId);
    return ok(null);
  }),

  // POST /home/activity-hub/shortcuts/:shortcutId/toggle-favorite - Toggle shortcut favorite
  http.post('/home/activity-hub/shortcuts/:shortcutId/toggle-favorite', async ({ params }) => {
    await delay(100);
    const shortcutId = String(params.shortcutId);
    toggleShortcutFavorite(shortcutId);
    return ok(null);
  }),

  // POST /home/activity-hub/power-tips/complete - Complete power tips
  http.post('/home/activity-hub/power-tips/complete', async () => {
    await delay(100);
    completePowerTips();
    return ok(null);
  }),
];
