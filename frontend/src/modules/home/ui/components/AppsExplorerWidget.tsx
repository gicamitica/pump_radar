import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import type { AppModule } from '../../domain/models';

interface AppsExplorerWidgetProps {
  apps: AppModule[];
}

const iconMap: Record<string, typeof Users> = {
  Users,
  UsersRound,
  Mail,
  Calendar,
  Kanban,
  MessageSquare,
};

export function AppsExplorerWidget({ apps }: AppsExplorerWidgetProps) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  return (
    <Card data-tour="apps">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{t('apps.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] ?? Users;

            return (
              <div
                key={app.id}
                className="group relative flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(app.path)}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate">{app.name}</h3>
                    {app.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {app.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {app.description}
                  </p>
                </div>
                <span className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
