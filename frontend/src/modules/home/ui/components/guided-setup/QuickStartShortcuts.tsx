import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { UserPlus, UsersRound, Mail, Settings } from 'lucide-react';

export function QuickStartShortcuts() {
  const { t } = useTranslation('guidedSetup');
  
  const shortcuts = [
    {
      id: 'invite-user',
      label: t('shortcuts.inviteUser'),
      icon: UserPlus,
      action: () => {},
    },
    {
      id: 'create-team',
      label: t('shortcuts.createTeam'),
      icon: UsersRound,
      action: () => {},
    },
    {
      id: 'email-templates',
      label: t('shortcuts.emailTemplates'),
      icon: Mail,
      action: () => {},
    },
    {
      id: 'settings',
      label: t('shortcuts.settings'),
      icon: Settings,
      action: () => {},
    },
  ];

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('shortcuts.title')}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t('shortcuts.description', 'Common actions to get you started quickly')}
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-2 flex-1">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={shortcut.id}
                  variant="outline"
                  className="h-auto py-4 px-4 justify-center flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  onClick={shortcut.action}
                >
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="size-8 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{shortcut.label}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-8 pt-3 border-t">
            {t('shortcuts.hint', 'These shortcuts open dialogs without leaving this page')}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
