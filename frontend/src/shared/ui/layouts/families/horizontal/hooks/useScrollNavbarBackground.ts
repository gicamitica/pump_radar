import React from 'react';

interface UseScrollNavbarBackgroundOptions {
  scrollOffset?: number;
}

/**
 * useScrollNavbarBackground - Manages navbar background visibility based on scroll position
 * 
 * Returns true when user has scrolled past the offset threshold
 * Useful for showing/hiding navbar background on scroll
 */
export const useScrollNavbarBackground = (options: UseScrollNavbarBackgroundOptions = {}) => {
  const { scrollOffset = 50 } = options;
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollOffset);
      console.log("Scroll", { scrollOffset, scrollY: window.scrollY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollOffset]);

  return isScrolled;
};
