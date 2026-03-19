import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import type { NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

interface ShowcaseQuickLinksProps {
  items: NavItem[];
  quickLinkIds: string[];
  onNavigate?: () => void;
}

/**
 * ShowcaseQuickLinks - Fast access bar for frequently used showcase items
 * 
 * Displays a horizontal row of quick access links with icons
 */
export const ShowcaseQuickLinks: React.FC<ShowcaseQuickLinksProps> = ({ 
  items, 
  quickLinkIds,
  onNavigate 
}) => {
  const { t } = useTranslation('navigation');

  // Filter items based on quickLinkIds from navigation config
  const quickLinkItems = quickLinkIds
    .map(id => items.find(item => item.id === id))
    .filter((item): item is NavItem => item !== undefined);

  if (quickLinkItems.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('mega.showcase.quickLinksTitle', { defaultValue: 'Quick Access' })}
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickLinkItems.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null;
          const title = t(`item.${item.id}`, { defaultValue: item.id });
          
          // Get first child as the main link (or use item.to if it exists)
          const mainLink = item.children?.[0]?.to || item.to || '#';

          return (
            <Link
              key={item.id}
              to={mainLink}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg border-2",
                "transition-all duration-200",
                "border-border/80 dark:border-border/50",
                "hover:border-primary/30 hover:bg-accent/50 hover:shadow-md"
              )}
            >
              {Icon && (
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
                  item.accent === 'blue' && "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20",
                  item.accent === 'purple' && "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20",
                  item.accent === 'emerald' && "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20",
                  item.accent === 'amber' && "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20",
                  item.accent === 'rose' && "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20",
                  item.accent === 'slate' && "bg-slate-500/10 text-slate-500 group-hover:bg-slate-500/20",
                  !item.accent && "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {title}
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
