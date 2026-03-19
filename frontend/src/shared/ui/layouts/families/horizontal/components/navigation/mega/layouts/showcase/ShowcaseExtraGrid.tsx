import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { MegaMenuLink } from '../../components/MegaMenuLink';

interface ShowcaseExtraGridProps {
  items: NavItem[];
  onNavigate?: () => void;
}

const EXCLUDED_IDS = [
  'showcase-foundations', 
  'showcase-states', 
  'showcase-core', 
  'showcase-patterns', 
  'showcase-compositions',
  'showcase-progressive',
  'showcase-keyboard-shortcuts',
  'showcase-power'
];

export const ShowcaseExtraGrid: React.FC<ShowcaseExtraGridProps> = ({ items, onNavigate }) => {
  const { t } = useTranslation('navigation');

  const extraSections = items.filter(item => 
    !EXCLUDED_IDS.includes(item.id) && 
    item.children && 
    item.children.length > 0
  );

  if (extraSections.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        {extraSections.map((section) => {
          const Icon = section.icon ? iconMap[section.icon] : null;
          const title = t(`item.${section.id}`, { defaultValue: section.id });
          
          return (
            <div key={section.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {title}
                </h4>
              </div>
              
              <div className="flex flex-col gap-1">
                {section.children?.map((child) => (
                  <MegaMenuLink
                    key={child.id}
                    item={child}
                    parentId={section.id}
                    onClick={onNavigate}
                    className="py-2 h-auto"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
