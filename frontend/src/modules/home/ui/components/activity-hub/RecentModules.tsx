import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
  History,
} from 'lucide-react';
import type { RecentModule } from '../../../domain/models';

interface RecentModulesProps {
  modules: RecentModule[];
  onModuleClick?: (moduleId: string) => void;
}

const iconMap: Record<string, typeof Users> = {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function RecentModules({ modules, onModuleClick }: RecentModulesProps) {
  const { t } = useTranslation('activityHub');
  const navigate = useNavigate();

  const handleClick = (module: RecentModule) => {
    onModuleClick?.(module.id);
    navigate(module.path);
  };

  return (
    <Card data-tour="recent-modules">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {t('recentModules.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('recentModules.empty')}
            </p>
          ) : (
            modules.map((module) => {
              const Icon = iconMap[module.icon] ?? Users;

              return (
                <button
                  key={module.id}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  onClick={() => handleClick(module)}
                >
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{module.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(module.lastVisitedAt)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {module.visitCount}×
                  </span>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
