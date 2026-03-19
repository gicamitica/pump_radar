import React from 'react';
import { useTranslation } from 'react-i18next';
import { groupLayoutsByFamily } from '@/shared/ui/layouts/registry/layoutRegistry';
import { LayoutPreviewCard } from './LayoutPreviewCard';
import { useLayout } from '../../layouts/app/useLayout';
import { SectionHeader } from '../../components/SectionHeader';

/**
 * LayoutSelector - Layout preview matrix for Settings panel
 * 
 * Displays all available layouts as preview cards
 * Allows instant layout switching with persistence
 */
export const LayoutSelector: React.FC = () => {
  const { t } = useTranslation('layouts');
  const { layoutMode, setLayoutMode } = useLayout();

  return (
    <div className="space-y-4">
      <SectionHeader 
        title={t('selector.title')} 
        description={t('selector.description')}
      />
      
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>{t('selector.tip', { defaultValue: 'Tip:' })}</strong>{' '}
          {t('selector.tipText', { defaultValue: 'Your layout preference is saved automatically and will persist across sessions.' })}
        </p>
      </div>

      {/* Layout Groups */}
      {Object.entries(groupLayoutsByFamily()).map(([family, layouts]) => (
        <div key={family} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t(`${family}.title`, { defaultValue: `${family.charAt(0).toUpperCase() + family.slice(1)} Layouts` })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layouts.map((layout) => (
              <LayoutPreviewCard
                key={layout.id}
                active={layoutMode === layout.mode}
                title={t(layout.titleKey)}
                description={t(layout.descriptionKey)}
                onClick={() => setLayoutMode(layout.mode)}
                fallbackVariant={layout.variant}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
