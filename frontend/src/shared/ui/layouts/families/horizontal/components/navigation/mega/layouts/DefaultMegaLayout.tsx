import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import type { MegaLayoutProps } from '../MegaLayoutRegistry';
import { MegaSectionCard } from '../MegaSectionCard';

/**
 * DefaultMegaLayout - Basic grid layout for megamenus
 * 
 * Simple 5-column grid of sections
 */
export const DefaultMegaLayout: React.FC<MegaLayoutProps> = ({ group, items }) => {
  const megaConfig = group.presentation?.mega;
  const columns = megaConfig?.columns ?? 5;
  const showDescriptions = megaConfig?.showDescriptions ?? false;

  const sections = items.filter(item => item.children?.length);

  const gridColsClass = {
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[columns] ?? 'lg:grid-cols-5';

  return (
    <div className="py-6 px-6">
      <div className={cn(
        'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4',
        gridColsClass
      )}>
        {sections.map((section) => (
          <MegaSectionCard
            key={section.id}
            item={section}
            showDescription={showDescriptions}
          />
        ))}
      </div>
    </div>
  );
};
