import { http, delay } from 'msw';
import { ok, fail } from '@/mocks/utils/apiResponse';
import {
  getDashboard,
  updateChecklistItem,
  getTourState,
  completeTour,
  skipTour,
  resetTour,
} from './homeData';

export const homeHandlers = [
  // GET /home/dashboard - Get home dashboard data
  http.get('/home/dashboard', async () => {
    await delay(300);
    return ok(getDashboard());
  }),

  // PATCH /home/checklist/:id - Update checklist item
  http.patch('/home/checklist/:id', async ({ params, request }) => {
    await delay(200);
    const id = String(params.id);
    const body = (await request.json()) as { completed: boolean };

    const item = updateChecklistItem(id, body.completed);
    if (!item) {
      return fail('CHECKLIST_ITEM_NOT_FOUND', 'Checklist item not found', 404);
    }

    return ok(item);
  }),

  // GET /home/tour - Get tour state
  http.get('/home/tour', async () => {
    await delay(100);
    return ok(getTourState());
  }),

  // POST /home/tour/complete - Complete tour
  http.post('/home/tour/complete', async () => {
    await delay(200);
    return ok(completeTour());
  }),

  // POST /home/tour/skip - Skip tour
  http.post('/home/tour/skip', async () => {
    await delay(200);
    return ok(skipTour());
  }),

  // POST /home/tour/reset - Reset tour
  http.post('/home/tour/reset', async () => {
    await delay(200);
    return ok(resetTour());
  }),
];
