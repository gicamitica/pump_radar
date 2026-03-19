import React, { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type NavItem, type NavGroup } from '@/app/config/navigation';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { TopLevelNavButton } from '../shared';
import { useNavBarBounds } from '../useNavBarBounds';
import { megaLayoutRegistry, type MegaLayoutType } from '../mega/MegaLayoutRegistry';

interface MegaGroupRendererProps {
  group: NavGroup;
  items: NavItem[];
}

/**
 * MegaGroupRenderer - Orchestrator for megamenu layouts
 * 
 * Delegates to specific layout components based on group configuration.
 * Uses lazy loading for optimal bundle size.
 */
export const MegaGroupRenderer: React.FC<MegaGroupRendererProps> = ({ group, items }) => {
  const { t } = useTranslation('navigation');
  const groupLabel = t(`section.${group.id}`, { defaultValue: group.id });
  const navBarBounds = useNavBarBounds();

  // Determine which layout component to use - memoized to avoid recreation
  const layoutType: MegaLayoutType = (group.presentation?.mega?.component as MegaLayoutType) ?? 'default';
  
  // Use memoized component reference to satisfy React Compiler
  const LayoutComponent = useMemo(() => {
    return megaLayoutRegistry[layoutType] ?? megaLayoutRegistry.default;
  }, [layoutType]);

  return (
    <AnimatedDropdown 
      placement="bottom-start" 
      openOn="hover"
      positionReference={navBarBounds}
      matchReferenceWidth={true}
    >
      <AnimatedDropdownTrigger asChild>
        <div>
          <TopLevelNavButton label={groupLabel} items={items} />
        </div>
      </AnimatedDropdownTrigger>

      <AnimatedDropdownContent className="overflow-hidden">
        <Suspense fallback={<MegaLoadingFallback />}>
          <LayoutComponent group={group} items={items} />
        </Suspense>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

/**
 * Loading fallback for lazy-loaded layouts
 */
const MegaLoadingFallback: React.FC = () => (
  <div className="py-12 px-6 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-muted" />
      <div className="w-24 h-3 rounded bg-muted" />
    </div>
  </div>
);
