import { useTheme as useNextTheme } from 'next-themes';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme, e?: React.MouseEvent | MouseEvent) => void;
  toggleTheme: (e?: React.MouseEvent | MouseEvent) => void;
}

export const useTheme = (): ThemeContextValue => {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  const handleTransition = (newTheme: Theme, e?: React.MouseEvent | MouseEvent) => {
    // 1. Check if View Transitions are supported and enabled
    // Make this value false if you want to disable the transition
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. If no event or no support, just set theme
    if (!isAppearanceTransition || !e) {
      setNextTheme(newTheme);
      return;
    }

    // 3. Calculate radius for circular reveal
    const { clientX: x, clientY: y } = e;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // 4. Start transition
    const transition = document.startViewTransition(() => {
      setNextTheme(newTheme);
    });

    // 5. Animate clip-path
    transition.ready.then(() => {
      // Standard "Grow" animation: The new view grows from the click position.
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      // We animate the ::view-transition-new(root)
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const toggleTheme = (e?: React.MouseEvent | MouseEvent) => {
    const next = theme === 'system'
      ? (resolvedTheme === 'dark' ? 'light' : 'dark')
      : (theme === 'dark' ? 'light' : 'dark');
    handleTransition(next, e);
  };

  const setTheme = (t: Theme, e?: React.MouseEvent | MouseEvent) => {
    handleTransition(t, e);
  };

  return {
    theme: (theme as Theme) || 'system',
    setTheme,
    toggleTheme,
  };
};
