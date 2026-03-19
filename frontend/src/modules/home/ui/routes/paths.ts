// Dashboard Module Route Path Constants
export const HOME_PATHS = {
  HOME: '/',
  GUIDED_SETUP: '/home/setup',
  ACTIVITY_HUB: '/home/activity',
} as const;

export type HomePaths = typeof HOME_PATHS;
