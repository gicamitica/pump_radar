import { useTranslation } from 'react-i18next';
import type { MegaLayoutProps } from '../MegaLayoutRegistry';
import { useAnimatedDropdown } from '@/shared/ui/components/animated-dropdown/useAnimatedDropdown';
import { ShowcaseFeatured } from './showcase/ShowcaseFeatured';
import { ShowcaseQuickLinks } from './showcase/ShowcaseQuickLinks';
import { ShowcaseBrowse } from './showcase/ShowcaseBrowse';
import { ShowcaseFooter } from './showcase/ShowcaseFooter';
import { ScrollArea } from '@/shadcn/components/ui/scroll-area';
import { ScrollFadeContainer } from '@/components/scroll';

// ============================================
// Showcase Mega Layout
// ============================================

/**
 * ShowcaseMegaLayout - Marketing-optimized megamenu for Showcase section
 * 
 * Structure:
 * 1. Featured Section (6 hero cards with thumbnails)
 * 2. Quick Links Bar (4 frequently accessed items)
 * 3. Browse Section (3-column grid of remaining items)
 * 4. CTA Sidebar (dashboards, contact, support)
 * 5. Footer (help links, pro tip)
 * 
 * Configuration driven by navigation.ts:
 * - group.presentation.mega.featuredItems
 * - group.presentation.mega.quickLinks
 * - group.presentation.mega.columns
 */
export const ShowcaseMegaLayout: React.FC<MegaLayoutProps> = ({ group, items }) => {
  const { t } = useTranslation('navigation');
  const { setOpen } = useAnimatedDropdown();

  const handleNavigate = () => {
    setOpen(false);
  };

  // Extract configuration from navigation.ts
  const megaConfig = group.presentation?.mega;
  const featuredIds = megaConfig?.featuredItems || [];
  const quickLinkIds = megaConfig?.quickLinks || [];
  // const columns = megaConfig?.columns || 3;

  // Combine featured and quick link IDs to exclude from browse section
  const excludeIds = [...featuredIds, ...quickLinkIds];

  return (
    <div className="py-6">
      <ScrollFadeContainer
        fadeSize="lg"
        className="h-[550px]"
        fadeClassName="from-white dark:from-neutral-800 via-white/80 dark:via-neutral-800/80"
      >
        <ScrollArea className="h-[550px] px-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('mega.showcase.exploreTitle', { defaultValue: 'Explore Our Components' })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('mega.showcase.exploreSubtitle', { defaultValue: 'Discover powerful tools and patterns for your next project' })}
            </p>
          </div>

          {/* Main Content - Full Width */}
          <div className="w-full space-y-8">
            {/* 1. Featured Section - 6 hero cards with thumbnails */}
            <ShowcaseFeatured 
              items={items} 
              featuredIds={featuredIds}
              onNavigate={handleNavigate} 
            />

            {/* 2. Quick Links Bar - Fast access to frequently used items */}
            <ShowcaseQuickLinks 
              items={items} 
              quickLinkIds={quickLinkIds}
              onNavigate={handleNavigate} 
            />

            {/* 3. Browse Section - 3-column grid of remaining items */}
            <ShowcaseBrowse 
              items={items} 
              excludeIds={excludeIds}
              columns={4}
              onNavigate={handleNavigate} 
            />
          </div>
        </ScrollArea>
      </ScrollFadeContainer>

      {/* Footer */}
      <ShowcaseFooter className="p-6 border-t border-border/50" />
    </div>
  );
};
