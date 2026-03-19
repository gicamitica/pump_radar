import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { navigationSections, type NavGroup } from '@/app/config/navigation';
import {
  InlineItemsRenderer,
  ListGroupRenderer,
  ColumnsGroupRenderer,
  MegaGroupRenderer,
} from './renderers';

interface HorizontalNavProps {
  className?: string;
}

/**
 * HorizontalNav - Presentation-driven horizontal navigation renderer
 * 
 * Responsibilities:
 * - Iterate over navigation groups (not flattened items)
 * - Delegate rendering to strategy based on group.presentation.layout
 * - Uses navigation.ts unchanged as single source of truth
 * 
 * Rendering Strategies:
 * - 'list' (default): Vertical dropdown with nested submenus
 * - 'columns': One column per item with children
 * - 'mega': Wide mega-menu for dense content
 */
export const HorizontalNav: React.FC<HorizontalNavProps> = ({ className }) => {
  // Filter groups that have displayable items (primary or secondary navRole)
  const displayableGroups = navigationSections;

  return (
    <nav className={cn('flex items-center gap-1 overflow-y-auto', className)}>
      {displayableGroups.map((group) => (
        <GroupRenderer key={group.id} group={group} />
      ))}
    </nav>
  );
};

/**
 * GroupRenderer - Delegates to appropriate renderer based on presentation.layout
 */
const GroupRenderer: React.FC<{ group: NavGroup }> = ({ group }) => {
  const layout = group.presentation?.layout ?? 'list';
  const displayableGroupItems = group.items.filter(item => item.navRole !== 'widget');
  
  if (displayableGroupItems.length === 0) return null;
  
  // For groups with only simple items (no children, all main), render inline
  const hasOnlySimpleItems = displayableGroupItems.every(
    item => item.navRole && item.navRole === 'main'
  );
  
  if (hasOnlySimpleItems) {
    return <InlineItemsRenderer items={displayableGroupItems} />;
  }

  // Delegate to appropriate renderer based on layout
  switch (layout) {
    case 'columns':
      return <ColumnsGroupRenderer group={group} items={displayableGroupItems} />;
    case 'mega':
      return <MegaGroupRenderer group={group} items={displayableGroupItems} />;
    default:
      return <ListGroupRenderer group={group} items={displayableGroupItems} />;
  }
};

export default HorizontalNav;
