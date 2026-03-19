import React from 'react';
import type { MegaLayoutProps } from '../MegaLayoutRegistry';
import { MegaSectionCard } from '../MegaSectionCard';

/**
 * ColumnsMegaLayout - Multi-column layout without tabs
 * 
 * Each section-with-children becomes a column
 */
export const ColumnsMegaLayout: React.FC<MegaLayoutProps> = ({ items }) => {
  
  const sections = items.filter(item => item.children?.length);

  return (
    <div className="py-6 px-6">
      <div className="flex gap-8">
        {sections.map((section) => (
          <MegaSectionCard
            key={section.id}
            item={section}
            showDescription={false}
          />
        ))}
      </div>
    </div>
  );
};
