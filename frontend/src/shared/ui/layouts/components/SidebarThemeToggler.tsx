import React from 'react';
import ThemeToggler from '@/shared/ui/components/ThemeToggler';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/app/providers/useTheme';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../app/useLayout';

export type SidebarThemeTogglerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

const SIZE_MAP = {
  sm: { button: 'size-8', icon: 'size-4' },
  md: { button: 'size-9', icon: 'size-4.5' },
  lg: { button: 'size-10', icon: 'size-5' },
} as const;

const SidebarThemeToggler: React.FC<SidebarThemeTogglerProps> = ({ size = 'md', className }) => {
  const { theme, setTheme } = useTheme();
  const { collapsed } = useLayout();

  const nextTheme = React.useCallback((e: React.MouseEvent) => {
    const currentTheme = (theme || 'system') as 'light' | 'dark' | 'system';
    const idx = order.indexOf(currentTheme);
    const next = order[(idx + 1) % order.length];
    setTheme(next, e);
  }, [theme, setTheme]);

  if (collapsed) {
    const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
    const sz = SIZE_MAP[size];
    
    return (
      <button
        type="button"
        onClick={nextTheme}
        aria-label="Toggle theme"
        className={cn(
          'inline-flex items-center justify-center rounded-full shadow-sm transition-transform',
          'bg-white/80 dark:bg-slate-800/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-800/60',
          sz.button,
          className
        )}
      >
        <Icon className={sz.icon} />
      </button>
    );
  }

  return <ThemeToggler size={size} className={className} />;
};

export default SidebarThemeToggler;