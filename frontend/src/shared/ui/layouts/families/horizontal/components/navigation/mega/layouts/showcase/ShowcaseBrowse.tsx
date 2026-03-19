import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import type { NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { MegaMenuLink } from '../../components/MegaMenuLink';

interface ShowcaseBrowseProps {
  items: NavItem[];
  excludeIds: string[]; // IDs to exclude (featured + quick links)
  columns?: number;
  onNavigate?: () => void;
}

/**
 * ShowcaseBrowse - 3-column grid for browsing remaining showcase items
 * 
 * Displays all non-featured items in a multi-column layout with:
 * - Section headers with icons
 * - Expandable child links
 * - Descriptions
 */
export const ShowcaseBrowse: React.FC<ShowcaseBrowseProps> = ({ 
  items, 
  excludeIds,
  columns = 3,
  onNavigate 
}) => {
  const { t } = useTranslation('navigation');

  // Filter out featured and quick link items
  const browseItems = items.filter(item => !excludeIds.includes(item.id));

  if (browseItems.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('mega.showcase.browse', { defaultValue: 'Browse All' })}
        </h4>
      </div>

      <div className={cn(
        "grid gap-6",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {browseItems.map((section) => {
          const Icon = section.icon ? iconMap[section.icon] : null;
          const title = t(`item.${section.id}`, { defaultValue: section.id });
          const description = section.hasDescription
            ? t(`descriptions.${section.id}`, { defaultValue: '' })
            : '';

          return (
            <div key={section.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-start gap-3 pb-2 border-b-2 border-border/80 dark:border-border/50">
                {Icon && (
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-sm",
                    section.accent === 'blue' && "bg-blue-500/10 text-blue-500",
                    section.accent === 'purple' && "bg-purple-500/10 text-purple-500",
                    section.accent === 'emerald' && "bg-emerald-500/10 text-emerald-500",
                    section.accent === 'amber' && "bg-amber-500/10 text-amber-500",
                    section.accent === 'rose' && "bg-rose-500/10 text-rose-500",
                    section.accent === 'slate' && "bg-slate-500/10 text-slate-500",
                    !section.accent && "bg-primary/10 text-primary"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-sm tracking-tight mb-0.5">
                    {title}
                  </h5>
                  {description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {/* Child Links */}
              {section.children && section.children.length > 0 ? (
                <div className="space-y-1">
                  {section.children.map((child) => (
                    <MegaMenuLink
                      key={child.id}
                      item={child}
                      parentId={section.id}
                      onClick={onNavigate}
                      className="text-sm px-2 py-1.5 h-auto"
                    />
                  ))}
                </div>
              ) : section.to ? (
                <MegaMenuLink
                  item={section}
                  parentId="showcase"
                  onClick={onNavigate}
                  className="text-sm px-2 py-1.5 h-auto"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
