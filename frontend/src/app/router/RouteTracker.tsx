import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Tracks route changes and pushes them to the GTM dataLayer.
 * This ensures that SPA navigation is tracked as page views in Google Analytics.
 */
export const RouteTracker = () => {
  const location = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip the first render to avoid double-counting with GTM "All Pages" trigger
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Ensure dataLayer exists
    const dataLayer = ((window as unknown) as { dataLayer?: unknown[] }).dataLayer || [];
    
    // Push page_view event to GTM
    dataLayer.push({
      event: 'page_view',
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);

  return null;
};
