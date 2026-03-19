import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { useAnimatedDropdown } from '@/components/animated-dropdown/useAnimatedDropdown';

interface MegaQuickLinksProps {
  items: NavItem[];
  groupId: string;
}

/**
 * MegaQuickLinks - Compact quick access bar for megamenu
 * 
 * Displays standalone items in a horizontal chip-style layout
 */
export const MegaQuickLinks: React.FC<MegaQuickLinksProps> = ({ items, groupId }) => {
  const { t } = useTranslation('navigation');
  const { setOpen } = useAnimatedDropdown();
  const title = t(`mega.${groupId}.quickLinksTitle`, { defaultValue: 'Quick Access' });

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
        {title}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null;
          const label = t(`item.${item.id}`, { defaultValue: item.id });

          if (!item.to) return null;

          return (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                'border border-border/50 transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
              )}
            >
              {Icon && <Icon className="size-3" />}
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
