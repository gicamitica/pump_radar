import { http, delay } from 'msw';
import { ok, fail } from '@/mocks/utils/apiResponse';
import {
  getSetupState,
  updateStepStatus,
  setCurrentStep,
  completeTourSet,
  resetSetup,
} from './guidedSetupData';
import type { SetupStepId, TourSetId } from '../../domain/models';

export const guidedSetupHandlers = [
  // GET /home/setup - Get setup state
  http.get('/home/setup', async () => {
    await delay(300);
    return ok(getSetupState());
  }),

  // PATCH /home/setup/steps/:stepId - Update step status
  http.patch('/home/setup/steps/:stepId', async ({ params, request }) => {
    await delay(200);
    const stepId = String(params.stepId) as SetupStepId;
    const body = (await request.json()) as { status: 'completed' | 'skipped' };

    const step = updateStepStatus(stepId, body.status);
    if (!step) {
      return fail('STEP_NOT_FOUND', 'Setup step not found', 404);
    }

    return ok(step);
  }),

  // POST /home/setup/current-step - Set current step
  http.post('/home/setup/current-step', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { stepId: SetupStepId };
    return ok(setCurrentStep(body.stepId));
  }),

  // POST /home/setup/tours/:tourId/complete - Complete a tour set
  http.post('/home/setup/tours/:tourId/complete', async ({ params }) => {
    await delay(200);
    const tourId = String(params.tourId) as TourSetId;
    completeTourSet(tourId);
    return ok(null);
  }),

  // POST /home/setup/reset - Reset setup
  http.post('/home/setup/reset', async () => {
    await delay(300);
    return ok(resetSetup());
  }),
];
