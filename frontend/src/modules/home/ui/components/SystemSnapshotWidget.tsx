import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Mail, UsersRound } from 'lucide-react';
import { StatCard } from '@/shared/ui/components/metrics/StatCard';
import type { SystemStats } from '../../domain/models';

interface SystemSnapshotWidgetProps {
  stats: SystemStats;
}

export function SystemSnapshotWidget({ stats }: SystemSnapshotWidgetProps) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const metrics = [
    {
      id: 'total-users',
      label: t('stats.totalUsers'),
      value: stats.totalUsers,
      icon: <Users />,
      variant: 'primary' as const,
      path: '/',
      tourId: 'stat-users',
      trend: { value: 12, direction: 'up' as const },
    },
    {
      id: 'active-users',
      label: t('stats.activeUsers'),
      value: stats.activeUsers,
      icon: <UserCheck />,
      variant: 'success' as const,
      path: '/',
      tourId: 'stat-active',
      trend: { value: 8, direction: 'up' as const },
    },
    {
      id: 'pending-invitations',
      label: t('stats.pendingInvitations'),
      value: stats.pendingInvitations,
      icon: <Mail />,
      variant: 'warning' as const,
      path: '/',
      tourId: 'stat-invitations',
      trend: { value: 3, direction: 'down' as const },
    },
    {
      id: 'active-teams',
      label: t('stats.activeTeams'),
      value: stats.activeTeams,
      icon: <UsersRound />,
      variant: 'info' as const,
      path: '/',
      tourId: 'stat-teams',
      trend: { value: 2, direction: 'up' as const },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="stats">
      {metrics.map((metric) => (
        <StatCard
          key={metric.id}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          variant={metric.variant}
          trend={metric.trend}
          onClick={() => navigate(metric.path)}
          data-tour={metric.tourId}
        />
      ))}
    </div>
  );
}
