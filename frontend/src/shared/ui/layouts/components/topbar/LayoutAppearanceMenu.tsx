import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { Layout, Palette } from 'lucide-react';
import { useLayout } from '../../app/useLayout';
import { groupLayoutsByFamily } from '../../registry/layoutRegistry';
import { sidebarAppearanceRegistry } from '../../registry/sidebarAppearanceRegistry';
import { cn } from '@/shadcn/lib/utils';
import { Separator } from '@/shared/ui/shadcn/components/ui/separator';
import { ScrollArea } from '@/shadcn/components/ui/scroll-area';
import { LayoutPreviewCard } from '../LayoutPreviewCard';
import { ScrollFadeContainer } from '@/components/scroll';

/**
 * LayoutAppearanceMenu - Compact layout and sidebar appearance selector for topbar
 * 
 * Features:
 * - Shows all layout options in a compact grid
 * - Shows sidebar appearances only for vertical layouts
 * - Fits within dropdown size constraints
 * - Matches LanguageMenu styling
 */
const LayoutAppearanceMenu: React.FC = () => {
  const { t } = useTranslation('layouts');
  const { t: tSettings } = useTranslation('settings');
  const { layoutMode, setLayoutMode, sidebarAppearance, setSidebarAppearance } = useLayout();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAppearanceChange = (appearanceId: string) => {
    // Type assertion needed: appearanceId is validated by the appearance registry
    setSidebarAppearance(appearanceId as never);
  };

  return (
    <AnimatedDropdown placement="bottom-end" openOn="hover">
      <AnimatedDropdownTrigger asChild>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border border-gray-200/70 dark:border-neutral-800"
          aria-label={t('layouts:selector.title', { defaultValue: 'Layout & Appearance' })}
        >
          <Layout className="size-5" />
        </button>
      </AnimatedDropdownTrigger>

      <AnimatedDropdownContent className="z-[60] w-[380px]">
        <ScrollFadeContainer 
          className="h-[340px]" 
          fadeSize='lg'
          fadeClassName="from-white dark:from-neutral-800 via-white/80 dark:via-neutral-800/80"
        >
          <ScrollArea ref={containerRef} className="relative h-[340px] p-2">
            {/* Layout Groups */}
            {Object.entries(groupLayoutsByFamily()).map(([family, layouts], index) => (
              <div key={family} className={cn('space-y-2', index > 0 && 'mt-3')}>
                <div className="px-2 pt-1 pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t(`${family}.title`, { defaultValue: family.charAt(0).toUpperCase() + family.slice(1) })}
                </div>
                <div className="relative grid gap-2 grid-cols-2 px-1">
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

            {/* Sidebar Appearance Section - Only for Vertical Layouts */}
            {layoutMode.startsWith('vertical') && (
              <>
                <Separator className="my-2" />
                <div>
                  <div className="px-2 pt-1 pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {tSettings('sidebarAppearance.title')}
                  </div>

                  <div className="relative grid grid-cols-3">
                    {sidebarAppearanceRegistry.map((appearance) => (
                      <button
                        key={appearance.id}
                        type="button"
                        className={cn(
                          'relative flex flex-col items-center gap-1 rounded-lg p-2 cursor-pointer text-center transition-colors',
                          sidebarAppearance === appearance.id && "border bg-gray-50 dark:bg-neutral-900"
                        )}
                        onClick={() => handleAppearanceChange(appearance.id)}
                        title={tSettings(appearance.titleKey)}
                      >
                        <Palette className="h-4 w-4" />
                        <p className="text-[11px] leading-tight line-clamp-2">
                          {tSettings(appearance.titleKey)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </ScrollFadeContainer>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

export default LayoutAppearanceMenu;
