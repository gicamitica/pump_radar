import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MegaLayoutProps } from '../MegaLayoutRegistry';
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabTrigger,
  VerticalTabContent,
} from '@/shared/ui/components/vertical-tabs';
import { DropdownLink } from '../../shared/DropdownLink';
import { iconMap } from '@/app/constants/iconMap';

/**
 * TabbedMegaLayout - Vertical tabs with content panel
 * 
 * Left panel shows section titles as vertical tabs
 * Right panel shows the children of the selected section
 */
export const TabbedMegaLayout: React.FC<MegaLayoutProps> = ({ items }) => {
  const { t } = useTranslation('navigation');
  
  const sections = items.filter(item => item.children?.length);
  const defaultSection = sections[0]?.id ?? '';

  if (sections.length === 0) return null;

  return (
    <div className="py-6 px-6">
      <VerticalTabs defaultValue={defaultSection} className="min-h-[280px]">
        {/* Tab List */}
        <VerticalTabsList className="w-48">
          {sections.map((section) => {
            const Icon = section.icon ? iconMap[section.icon] : null;
            const label = t(`item.${section.id}`, { defaultValue: section.id });
            const description = section.hasDescription
              ? t(`descriptions.${section.id}`, { defaultValue: '' })
              : '';

            return (
              <VerticalTabTrigger
                key={section.id}
                value={section.id}
                icon={Icon && <Icon className="size-4" />}
                description={description}
              >
                {label}
              </VerticalTabTrigger>
            );
          })}
        </VerticalTabsList>

        {/* Tab Content Panels */}
        {sections.map((section) => (
          <VerticalTabContent key={section.id} value={section.id}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
              {section.children?.map((child) => (
                <DropdownLink
                  key={child.id}
                  item={child}
                  parentId={section.id}
                  compact
                />
              ))}
            </div>
          </VerticalTabContent>
        ))}
      </VerticalTabs>
    </div>
  );
};
