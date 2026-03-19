import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem, type NavAccentColor } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';
import { useAnimatedDropdown } from '@/components/animated-dropdown/useAnimatedDropdown';

interface MegaFeaturedCardProps {
  item: NavItem;
}

const accentGradients: Record<NavAccentColor, string> = {
  blue: 'from-blue-500/10 to-blue-600/5',
  purple: 'from-purple-500/10 to-purple-600/5',
  amber: 'from-amber-500/10 to-amber-600/5',
  emerald: 'from-emerald-500/10 to-emerald-600/5',
  rose: 'from-rose-500/10 to-rose-600/5',
  slate: 'from-slate-500/10 to-slate-600/5',
};

const accentBorders: Record<NavAccentColor, string> = {
  blue: 'border-blue-500/20 hover:border-blue-500/40',
  purple: 'border-purple-500/20 hover:border-purple-500/40',
  amber: 'border-amber-500/20 hover:border-amber-500/40',
  emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
  rose: 'border-rose-500/20 hover:border-rose-500/40',
  slate: 'border-slate-500/20 hover:border-slate-500/40',
};

const accentIcons: Record<NavAccentColor, string> = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
  slate: 'text-slate-500',
};

/**
 * MegaFeaturedCard - Hero card for featured megamenu items
 * 
 * Features:
 * - Large card with gradient background
 * - Icon, title, and description
 * - Links to first child or shows child count
 */
export const MegaFeaturedCard: React.FC<MegaFeaturedCardProps> = ({ item }) => {
  const { t } = useTranslation('navigation');
  const { setOpen } = useAnimatedDropdown();
  const label = t(`item.${item.id}`, { defaultValue: item.id });
  const description = item.hasDescription
    ? t(`descriptions.${item.id}`, { defaultValue: '' })
    : '';

  const Icon = item.icon ? iconMap[item.icon] : null;
  const accent = item.accent || 'slate';
  const firstChild = item.children?.[0];
  const childCount = item.children?.length || 0;

  const CardContent = (
    <>
      {/* Icon */}
      {Icon && (
        <div className={cn(
          'flex items-center justify-center size-10 rounded-xl mb-3',
          'bg-background/50 border border-border/50',
          accentIcons[accent]
        )}>
          <Icon className="size-5" />
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-sm text-foreground mb-1">
        {label}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          {description}
        </p>
      )}

      {/* Child count */}
      <span className="text-xs text-muted-foreground">
        {childCount} {childCount === 1 ? 'item' : 'items'}
      </span>
    </>
  );

  if (firstChild?.to) {
    return (
      <NavLink
        to={firstChild.to}
        onClick={() => setOpen(false)}
        className={cn(
          'block p-4 rounded-xl border transition-all duration-200',
          'bg-gradient-to-br',
          accentGradients[accent],
          accentBorders[accent],
          'hover:shadow-lg hover:scale-[1.02]'
        )}
      >
        {CardContent}
      </NavLink>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      'bg-gradient-to-br',
      accentGradients[accent],
      accentBorders[accent]
    )}>
      {CardContent}
    </div>
  );
};
