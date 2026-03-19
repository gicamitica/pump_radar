import React from 'react';
import NavRail from '@/shared/ui/components/navigation/NavRail';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/app/providers/useTheme';
import { cn } from '@/shadcn/lib/utils';

export type ThemeTogglerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_MAP = {
  sm: 'p-0.5',
  md: 'p-3',
  lg: 'p-4',
} as const;

const ThemeToggler: React.FC<ThemeTogglerProps> = ({ size = 'md', className }) => {
  const { theme, setTheme } = useTheme();
  return (
    <NavRail
      items={[
        { id: 'light', icon: <Sun className="size-4" />, label: 'Light' },
        { id: 'dark', icon: <Moon className="size-4" />, label: 'Dark' },
        { id: 'system', icon: <Monitor className="size-4" />, label: 'System' },
      ]}
      value={(theme as string) || 'system'}
      onChange={(id, e) => setTheme(id as 'light' | 'dark' | 'system', e)}
      variant="horizontal"
      mobileContent="icons"
      size={size}
      ariaLabel="Theme selector"
      className={cn(SIZE_MAP[size], className)}
    />
  );
};

export default ThemeToggler;
