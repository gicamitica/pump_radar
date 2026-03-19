import { Users, UsersRound, Mail } from 'lucide-react';
import { StatCard } from '@/shared/ui/components/metrics/StatCard';
import type { QuickStat } from '../../../domain/models';

interface QuickStatsProps {
  stats: QuickStat[];
}

const statConfig: Record<string, { icon: typeof Users; variant: 'info' | 'primary' | 'warning' | 'success' | 'danger' | 'default' }> = {
  'stat-users': { icon: Users, variant: 'info' },
  'stat-teams': { icon: UsersRound, variant: 'primary' },
  'stat-invites': { icon: Mail, variant: 'warning' },
};

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="quick-stats">
      {stats.map((stat) => {
        const config = statConfig[stat.id] ?? { icon: Users, variant: 'default' as const };
        const Icon = config.icon;
        
        return (
          <StatCard
            key={stat.id}
            icon={<Icon />}
            value={stat.value}
            label={stat.label}
            variant={config.variant}
            trend={stat.change !== undefined && stat.changeDirection ? {
              value: stat.change,
              direction: stat.changeDirection,
            } : undefined}
          />
        );
      })}
    </div>
  );
}
