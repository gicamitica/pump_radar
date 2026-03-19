import React from 'react';
import { useLayout } from './';
import { VerticalBoxedLayout } from '../families/vertical/variants/boxed/VerticalBoxedLayout';
import { VerticalEdgeLayout } from '../families/vertical/variants/edge/VerticalEdgeLayout';
import { VerticalTwoColumnLayout } from '../families/vertical/variants/two-columns/VerticalTwoColumnLayout';
import { HorizontalSolidLayout } from '../families/horizontal/variants/solid/HorizontalSolidLayout';
import { HorizontalDarkLayout } from '../families/horizontal/variants/dark/HorizontalDarkLayout';
import { HorizontalGradientLayout } from '../families/horizontal/variants/gradient/HorizontalGradientLayout';
import { HorizontalHeroLayout } from '../families/horizontal/variants/hero/HorizontalHeroLayout';
import { HorizontalStackedLayout } from '../families/horizontal/variants/stacked/HorizontalStackedLayout';

/**
 * AppLayout - Main application layout wrapper
 * 
 * Resolves and renders the correct layout based on layoutMode from context.
 * Supports both vertical and horizontal layout families.
 * Note: LayoutProvider is now provided at the app level in AppProviders.
 */
export const AppLayout: React.FC = () => {
  const { layoutMode } = useLayout();

  switch (layoutMode) {
    // Vertical layouts
    case 'vertical-boxed':
      return <VerticalBoxedLayout />;
    case 'vertical-edge':
      return <VerticalEdgeLayout />;
    case 'vertical-two-columns':
      return <VerticalTwoColumnLayout />;
    
    // Horizontal layouts
    case 'horizontal-solid':
      return <HorizontalSolidLayout />;
    case 'horizontal-dark':
      return <HorizontalDarkLayout />;
    case 'horizontal-gradient':
      return <HorizontalGradientLayout />;
    case 'horizontal-hero':
      return <HorizontalHeroLayout />;
    case 'horizontal-stacked':
      return <HorizontalStackedLayout />;
    
    default:
      return <VerticalEdgeLayout />;
  }
};
