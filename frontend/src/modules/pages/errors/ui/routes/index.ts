import type { ModuleRoute } from '@/core/router/types';
import { lazy } from 'react';
import { ERROR_PAGES_PATHS } from './paths';

const Error404Page = lazy(() => import('../pages/Error404Page'));
const Error500Page = lazy(() => import('../pages/Error500Page'));

export const ERROR_PAGES_ROUTES: ModuleRoute[] = [
  {
    path: ERROR_PAGES_PATHS.ERROR_404,
    module: 'pages-errors',
    layout: 'app',
    titleKey: 'errors:notFound.title',
    title: '404',
    description: 'Not found',
    component: Error404Page,
  },
  {
    path: ERROR_PAGES_PATHS.ERROR_500,
    module: 'pages-errors',
    layout: 'app',
    titleKey: 'errors:serverError.title',
    title: '500',
    description: 'Server error',
    component: Error500Page,
  },
];

export { ERROR_PAGES_PATHS } from './paths';
