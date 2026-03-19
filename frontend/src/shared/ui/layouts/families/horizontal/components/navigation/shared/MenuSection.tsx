import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem } from '@/app/config/navigation';
import { DropdownLink } from './DropdownLink';
import { useAnimatedDropdown } from '@/components/animated-dropdown/useAnimatedDropdown';

interface MenuSectionProps {
  item: NavItem;
  compact?: boolean;
}

/**
 * MenuSection - Renders a section group with title and child links
 * 
 * Used by all dropdown renderers to display items-with-children as section groups
 */
export const MenuSection: React.FC<MenuSectionProps> = ({ item, compact = false }) => {
  const { t } = useTranslation('navigation');
  const label = t(`item.${item.id}`, { defaultValue: item.id });
  const { setOpen } = useAnimatedDropdown();

  return (
    <div className={cn('space-y-2', compact ? 'mt-2' : 'mt-4')}>
      <h4 className={cn(
        'flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 uppercase',
        compact ? 'px-2 py-1 text-xs uppercase tracking-wider' : 'px-4 py-2 text-sm'
      )}>
        {label}
      </h4>
      <div className={cn('space-y-0.5')}>
        {item.children?.map((child) => (
          <DropdownLink key={child.id} item={child} parentId={item.id} compact={compact} onClick={() => setOpen(false)} />
        ))}
      </div>
    </div>
  );
};
