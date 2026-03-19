import { setupWorker } from 'msw/browser';
import { authHandlers } from '@/modules/auth/infrastructure/mocks/authHandlers';
import { homeHandlers } from '@/modules/home/infrastructure/mocks/homeHandlers';
import { guidedSetupHandlers } from '@/modules/home/infrastructure/mocks/guidedSetupHandlers';
import { activityHubHandlers } from '@/modules/home/infrastructure/mocks/activityHubHandlers';

// Combine all handlers (HTTP + WebSocket)
const handlers = [
  ...authHandlers,
  ...homeHandlers,
  ...guidedSetupHandlers,
  ...activityHubHandlers,
];

// Setup MSW worker
export const worker = setupWorker(...handlers);
