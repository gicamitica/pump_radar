import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem, type NavAccentColor } from '@/app/config/navigation';
import { DropdownLink } from '../shared/DropdownLink';
import { iconMap } from '@/app/constants/iconMap';
import { useAnimatedDropdown } from '@/components/animated-dropdown/useAnimatedDropdown';

interface MegaSectionCardProps {
  item: NavItem;
  showDescription?: boolean;
}

const accentColors: Record<NavAccentColor, { bg: string; border: string; icon: string }> = {
  blue: {
    bg: 'bg-blue-500/5 dark:bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
  },
  purple: {
    bg: 'bg-purple-500/5 dark:bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-500',
  },
  amber: {
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  rose: {
    bg: 'bg-rose-500/5 dark:bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: 'text-rose-500',
  },
  slate: {
    bg: 'bg-slate-500/5 dark:bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: 'text-slate-500',
  },
};

/**
 * MegaSectionCard - Enhanced section card for megamenu
 * 
 * Features:
 * - Accent color styling
 * - Optional description from i18n
 * - Icon header
 * - Child links
 */
export const MegaSectionCard: React.FC<MegaSectionCardProps> = ({
  item,
  showDescription = false,
}) => {
  const { t } = useTranslation('navigation');
  const { setOpen } = useAnimatedDropdown();
  const label = t(`item.${item.id}`, { defaultValue: item.id });
  const description = item.hasDescription
    ? t(`descriptions.${item.id}`, { defaultValue: '' })
    : '';

  const Icon = item.icon ? iconMap[item.icon] : null;
  const accent = item.accent ? accentColors[item.accent] : accentColors.slate;

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg',
        accent.bg
      )}>
        {Icon && (
          <div className={cn(
            'flex items-center justify-center size-6 rounded',
            accent.icon
          )}>
            <Icon className="size-4" />
          </div>
        )}
        <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
          {label}
        </h4>
      </div>

      {/* Description */}
      {showDescription && description && (
        <p className="px-2 text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {/* Child Links */}
      <div className="space-y-0.5">
        {item.children?.map((child) => (
          <DropdownLink
            key={child.id}
            item={child}
            parentId={item.id}
            compact
            onClick={() => setOpen(false)}
          />
        ))}
      </div>
    </div>
  );
};

