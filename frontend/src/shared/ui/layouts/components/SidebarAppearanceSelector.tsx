import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../app/useLayout';
import { sidebarAppearanceRegistry } from '../registry/sidebarAppearanceRegistry';
import { SidebarAppearancePreview } from './SidebarAppearancePreview';
import { SelectionCard } from '@/shared/ui/components/SelectionCard';

/**
 * SidebarAppearanceSelector - Selector UI for sidebar appearances
 * 
 * Features:
 * - Visual preview cards for each appearance
 * - Highlights currently selected appearance
 * - Updates state on selection
 * - Fully accessible with ARIA attributes
 * - i18n support for all labels
 */
export const SidebarAppearanceSelector: React.FC = () => {
  const { t } = useTranslation('settings');
  const { sidebarAppearance, setSidebarAppearance } = useLayout();

  return (
    <div
      role="radiogroup"
      aria-label={t('sidebarAppearance.title')}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {sidebarAppearanceRegistry.map((appearance) => (
        <SelectionCard
          key={appearance.id}
          selected={sidebarAppearance === appearance.id}
          title={t(appearance.titleKey)}
          description={t(appearance.descriptionKey)}
          onClick={() => setSidebarAppearance(appearance.id)}
        >
          <SidebarAppearancePreview appearance={appearance.id} />
        </SelectionCard>
      ))}
    </div>
  );
};
