import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import type { NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { Link } from 'react-router';
import { Separator } from '@/shadcn/components/ui/separator';

interface ShowcaseFeaturedProps {
  items: NavItem[];
  featuredIds: string[];
  onNavigate?: () => void;
}

/**
 * ShowcaseFeatured - Hero cards with thumbnails for high-value showcase items
 * 
 * Displays 6 featured items in a 3-column grid with:
 * - Thumbnail image
 * - Title and description
 * - Badge indicators (Popular, Featured, Premium)
 * - Hover-triggered slide-up panel showing children
 * - Smooth CSS transitions
 */
export const ShowcaseFeatured: React.FC<ShowcaseFeaturedProps> = ({ 
  items, 
  featuredIds,
  onNavigate 
}) => {
  const { t } = useTranslation('navigation');

  // Filter items based on featuredIds from navigation config
  const featuredItems = featuredIds
    .map(id => items.find(item => item.id === id))
    .filter((item): item is NavItem => item !== undefined);

  if (featuredItems.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredItems.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null;
          const title = t(`item.${item.id}`, { defaultValue: item.id });
          const description = item.hasDescription
            ? t(`descriptions.${item.id}`, { defaultValue: '' })
            : '';

          const hasChildren = item.children && item.children.length > 0;

          return (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                "border-border/80 dark:border-border/50",
                "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                "bg-gradient-to-br from-card via-card to-card/80",
                "flex flex-col h-full"
              )}
            >
              {/* Thumbnail Image */}
              {item.thumbnail && (
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                  <img 
                    src={item.thumbnail} 
                    alt={title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                </div>
              )}

              {/* Main Content */}
              <div className="relative p-4 flex-1 flex flex-col overflow-hidden">
                {/* Badge (Label) */}
                {item.badge && item.badge.type === 'label' && item.badge.label && (
                  <div className="absolute top-2 right-2 z-2 transition-opacity duration-300 group-hover:opacity-0">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide",
                      item.badge.color === 'blue' && "bg-blue-500/15 text-blue-500",
                      item.badge.color === 'purple' && "bg-purple-500/15 text-purple-500",
                      item.badge.color === 'emerald' && "bg-emerald-500/15 text-emerald-500",
                      item.badge.color === 'amber' && "bg-amber-500/15 text-amber-500",
                      !item.badge.color && "bg-primary/15 text-primary"
                    )}>
                      {item.badge.label === 'popular' && 'Popular'}
                      {item.badge.label === 'featured' && 'Featured'}
                      {item.badge.label === 'premium' && 'Pro'}
                      {item.badge.label === 'new' && 'New'}
                    </span>
                  </div>
                )}

                {/* Badge (Emoji) */}
                {item.badge && item.badge.type === 'emoji' && item.badge.value && (
                    <div className="absolute top-2 right-2 z-2 transition-opacity duration-300 group-hover:opacity-0 scale-125 origin-top-right">
                        <span className="animate-pulse leading-none block">
                            {item.badge.value}
                        </span>
                    </div>
                )}

                {/* Icon & Title */}
                <div className="flex flex-1 items-start gap-3 mb-2">
                  {Icon && (
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-colors",
                      item.accent === 'blue' && "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20",
                      item.accent === 'purple' && "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20",
                      item.accent === 'emerald' && "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20",
                      item.accent === 'amber' && "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20",
                      item.accent === 'rose' && "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20",
                      item.accent === 'slate' && "bg-slate-500/10 text-slate-500 group-hover:bg-slate-500/20",
                      !item.accent && "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base tracking-tight mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Child count indicator at bottom */}
                {hasChildren && (
                  <div className="mt-auto pt-3 border-t-2 border-border/80 dark:border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {item.children!.length} {item.children!.length === 1 ? 'example' : 'examples'}
                    </span>
                  </div>
                )}
              </div>

              {/* Hover Panel - Slides up from bottom using CSS */}
              {hasChildren && (
                <div 
                  className={cn(
                    "absolute inset-x-0 bottom-0 p-4 space-y-4 rounded-b-xl",
                    "bg-gradient-to-t from-card via-card to-card/95 backdrop-blur-sm",
                    "transform translate-y-full transition-transform duration-500 ease-out",
                    "group-hover:translate-y-0"
                  )}
                >
                  {/* Panel Header */}
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.children!.length} {item.children!.length === 1 ? 'example' : 'examples'}
                    </p>
                  </div>

                  <Separator />

                  {/* Children Grid */}
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-lg overflow-hidden">
                    {item.children!.map((child) => {
                      const childLabel = t(`steps.${item.id}.${child.id}`, { defaultValue: child.id });
                      return (
                        <Link
                          key={child.id}
                          to={child.to || '#'}
                          onClick={onNavigate}
                          className={cn(
                            "block px-3 py-2 rounded-md text-xs transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "text-muted-foreground hover:text-foreground",
                            "border border-border/50 hover:border-primary/30"
                          )}
                        >
                          {childLabel}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
