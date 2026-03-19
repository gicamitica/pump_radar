import type { ModuleRoute } from '@/core/router/types';
import { PLAYGROUND_PATHS } from './paths';
import { lazy } from 'react';

const LayoutBuilderPage = lazy(() => import('../pages/LayoutBuilderPage'));

export const PLAYGROUND_ROUTES: ModuleRoute[] = [
  {
    path: PLAYGROUND_PATHS.LAYOUT_BUILDER,
    module: 'playground',
    layout: 'app',
    layoutBehavior: 'fixed-height',
    title: 'Layout Builder',
    component: LayoutBuilderPage,
  },
];

export { PLAYGROUND_PATHS } from './paths';
