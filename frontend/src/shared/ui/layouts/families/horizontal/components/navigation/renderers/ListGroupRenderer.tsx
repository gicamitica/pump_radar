import React from 'react';
import { useTranslation } from 'react-i18next';
import { type NavItem, type NavGroup } from '@/app/config/navigation';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { MenuSection, DropdownLink, TopLevelNavButton } from '../shared';

interface ListGroupRendererProps {
  group: NavGroup;
  items: NavItem[];
}

/**
 * ListGroupRenderer - Default dropdown with section groups
 * 
 * Renders items-with-children as section groups, simple items as links
 */
export const ListGroupRenderer: React.FC<ListGroupRendererProps> = ({ group, items }) => {
  const { t } = useTranslation('navigation');
  const groupLabel = t(`section.${group.id}`, { defaultValue: group.id });

  return (
    <AnimatedDropdown placement="bottom-start" openOn="hover">
      <AnimatedDropdownTrigger asChild>
        <div>
          <TopLevelNavButton label={groupLabel} items={items} />
        </div>
      </AnimatedDropdownTrigger>

      <AnimatedDropdownContent>
        <div className="relative min-w-56 py-2">
          {items.map((item) => (
            <ListItem key={item.id} item={item} />
          ))}
        </div>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

/**
 * ListItem - Renders item as section group if it has children, otherwise as link
 */
const ListItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return <MenuSection item={item} compact />;
  }

  return <DropdownLink item={item} />;
};
