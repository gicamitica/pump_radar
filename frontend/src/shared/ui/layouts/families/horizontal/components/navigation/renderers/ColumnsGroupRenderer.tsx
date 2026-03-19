import React from 'react';
import { useTranslation } from 'react-i18next';
import { type NavItem, type NavGroup } from '@/app/config/navigation';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { MenuSection, TopLevelNavButton } from '../shared';

interface ColumnsGroupRendererProps {
  group: NavGroup;
  items: NavItem[];
}

/**
 * ColumnsGroupRenderer - Multi-column layout for items with children
 * 
 * Each item-with-children becomes a column with its own section
 */
export const ColumnsGroupRenderer: React.FC<ColumnsGroupRendererProps> = ({ group, items }) => {
  const { t } = useTranslation('navigation');
  const groupLabel = t(`section.${group.id}`, { defaultValue: group.id });

  // Columns = items that have children
  const columns = items.filter(item => item.children?.length);

  return (
    <AnimatedDropdown placement="bottom-start" openOn="hover">
      <AnimatedDropdownTrigger asChild>
        <div>
          <TopLevelNavButton label={groupLabel} items={items} />
        </div>
      </AnimatedDropdownTrigger>

      <AnimatedDropdownContent>
        <div className="relative py-4 px-4">
          <div className="flex gap-8">
            {columns.map((columnItem) => (
              <MenuSection key={columnItem.id} item={columnItem} compact />
            ))}
          </div>
        </div>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};
