import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabTrigger,
  VerticalTabContent,
} from '@/shared/ui/components/vertical-tabs';
import { MegaMenuLink } from '../../components/MegaMenuLink';

interface ShowcaseTabsProps {
  items: NavItem[];
  onNavigate?: () => void;
}

const TABBED_IDS = ['showcase-core', 'showcase-patterns', 'showcase-compositions', 'showcase-progressive', 'showcase-keyboard-shortcuts', 'showcase-power'];

export const ShowcaseTabs: React.FC<ShowcaseTabsProps> = ({ items, onNavigate }) => {
  const { t } = useTranslation('navigation');

  const tabSections = items.filter(item => TABBED_IDS.includes(item.id));
  
  if (tabSections.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('showcase.browse', { defaultValue: 'BROWSE' })}
        </h4>
      </div>

      <VerticalTabs defaultValue={tabSections[0].id}>
        {/* Left: Tab List */}
        <VerticalTabsList className="w-64 pl-2">
          {tabSections.map((section) => {
            const Icon = section.icon ? iconMap[section.icon] : null;
            const title = t(`item.${section.id}`, { defaultValue: section.id });
            
            return (
              <VerticalTabTrigger
                key={section.id}
                value={section.id}
                icon={Icon && <Icon className="w-4 h-4" />}
              >
                {title}
              </VerticalTabTrigger>
            );
          })}
        </VerticalTabsList>

        {/* Right: Content Panels */}
        {tabSections.map((section) => (
          <VerticalTabContent key={section.id} value={section.id} className="pl-6">
            <div className="mb-4">
               <h3 className="font-semibold text-foreground text-lg mb-1">
                 {t(`item.${section.id}`, { defaultValue: section.id })}
               </h3>
               {section.hasDescription && (
                 <p className="text-sm text-muted-foreground">
                   {t(`descriptions.${section.id}`, { defaultValue: '' })}
                 </p>
               )}
            </div>

            {/* Grid of Links */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {section.children?.map((child) => (
                <MegaMenuLink
                  key={child.id}
                  item={child}
                  parentId={section.id}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </VerticalTabContent>
        ))}
      </VerticalTabs>
    </div>
  );
};
