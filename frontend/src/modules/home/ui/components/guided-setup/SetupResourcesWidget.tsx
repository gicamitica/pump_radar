import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { 
  BookOpen, 
  MessageCircleQuestion, 
  Video, 
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

interface Resource {
  id: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  color: string;
}

export function SetupResourcesWidget() {
  const { t } = useTranslation('guidedSetup');

  const resources: Resource[] = [
    {
      id: 'docs',
      icon: BookOpen,
      title: t('resources.docs.title', 'Documentation'),
      description: t('resources.docs.description', 'Browse guides and tutorials'),
      href: 'https://docs.5studios.net/katalyst',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      id: 'video',
      icon: Video,
      title: t('resources.video.title', 'Video Tutorials'),
      description: t('resources.video.description', 'Watch step-by-step guides'),
      href: '#',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    },
    {
      id: 'support',
      icon: MessageCircleQuestion,
      title: t('resources.support.title', 'Get Help'),
      description: t('resources.support.description', 'Contact our support team'),
      href: '#',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
  ];

  const tips = [
    t('resources.tips.0', 'Complete the setup wizard to unlock all features'),
    t('resources.tips.1', 'Invite at least one other admin for backup access'),
    t('resources.tips.2', 'Configure email templates before inviting users'),
  ];

  return (
    <Card data-tour="setup-resources" className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base">{t('resources.title', 'Resources & Tips')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('resources.subtitle', 'Helpful guidance for your setup')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Quick Tips */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('resources.tipsLabel', 'Quick Tips')}
          </p>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 text-sm text-muted-foreground p-2 rounded-lg bg-muted/30"
              >
                <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resource Links */}
        <div className="space-y-2 pt-3 border-t flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('resources.linksLabel', 'Helpful Links')}
          </p>
          <div className="space-y-1.5">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Button
                  key={resource.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2.5 px-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-muted"
                  asChild
                >
                  <a href={resource.href} target="_blank" rel="noopener noreferrer">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', resource.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left ml-3">
                      <p className="text-sm font-medium">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
