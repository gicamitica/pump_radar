import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import type { NavBadge } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';

export const badgeColorClasses: Record<string, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-500', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-500', dot: 'bg-purple-500' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-500', dot: 'bg-rose-500' },
  slate: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500' },
};

const badgeLabelText: Record<string, string> = {
  popular: 'Popular',
  featured: 'Featured',
  new: 'New',
  premium: 'Pro',
  upcoming: 'Upcoming',
};

export const BadgeDisplay: React.FC<{ badge: NavBadge }> = ({ badge }) => {
  const colorClass = badgeColorClasses[badge.color || 'blue'];
  
  if (badge.type === 'dot') {
    return (
      <span className="relative flex size-2 ml-1">
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colorClass?.dot || 'bg-primary')} />
        <span className={cn('relative inline-flex rounded-full size-2', colorClass?.dot || 'bg-primary')} />
      </span>
    );
  }
  
  if (badge.type === 'icon' && badge.icon) {
    const Icon = iconMap[badge.icon];
    if (!Icon) return null;
    return (
      <Icon className={cn(
        'size-3.5 ml-1', 
        colorClass?.text || 'text-primary',
        badge.icon === 'calendar' || badge.icon === 'clock' ? 'animate-spin-slow' : ''
      )} />
    );
  }

  if (badge.type === 'emoji' && badge.value) {
    return (
      <span className="text-sm leading-none ml-1 animate-pulse" title={badge.label || "Trending"}>
        {badge.value}
      </span>
    );
  }

  if (badge.type === 'label' && badge.label) {
    return (
      <span className={cn(
        'px-1.5 py-0.5 text-[10px] font-medium rounded-full uppercase tracking-wide',
        colorClass?.bg || 'bg-primary/15',
        colorClass?.text || 'text-primary'
      )}>
        {badgeLabelText[badge.label] || badge.label}
      </span>
    );
  }
  
  // Count badge
  return (
    <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
      {badge.value}
    </span>
  );
};
