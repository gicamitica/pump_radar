import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UsersRound, Mail, Bell, LayoutGrid, Compass } from 'lucide-react';
import { Checklist, type ChecklistItemData, type ChecklistAction } from '@/shared/ui/components/Checklist';
import type { ChecklistItem } from '../../domain/models';

interface ChecklistWidgetProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string, completed: boolean) => void;
  onShowMe?: (itemKey: string) => void;
  isUpdating?: boolean;
}

const checklistConfig: Record<string, { icon: typeof UserPlus; path: string; tourTarget?: string }> = {
  inviteUsers: { icon: UserPlus, path: '/', tourTarget: 'sidebar-users' },
  createTeam: { icon: UsersRound, path: '/', tourTarget: 'sidebar-teams' },
  configureEmail: { icon: Mail, path: '/', tourTarget: 'sidebar-email' },
  reviewNotifications: { icon: Bell, path: '/', tourTarget: 'sidebar-notifications' },
  exploreApps: { icon: LayoutGrid, path: '/', tourTarget: 'sidebar-apps' },
};

export function ChecklistWidget({ items, onToggleItem, onShowMe, isUpdating }: ChecklistWidgetProps) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  // Transform domain items to Checklist component format
  const checklistItems: ChecklistItemData[] = items.map((item) => {
    const config = checklistConfig[item.key];
    const Icon = config?.icon;
    
    return {
      id: item.id,
      key: item.key,
      completed: item.completed,
      icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
      title: t(`checklist.items.${item.key}.title`),
      description: t(`checklist.items.${item.key}.description`),
    };
  });

  // Define actions for incomplete items
  const actions: ChecklistAction[] = [
    {
      label: t('checklist.showMe'),
      icon: <Compass className="h-3 w-3" />,
      variant: 'ghost',
      onClick: (item) => onShowMe?.(item.key),
      showWhen: (item) => {
        const config = checklistConfig[item.key];
        return !!onShowMe && !!config?.tourTarget;
      },
    },
    {
      label: t('checklist.goTo'),
      variant: 'outline',
      onClick: (item) => {
        const config = checklistConfig[item.key];
        if (config?.path) {
          navigate(config.path);
        }
      },
      showWhen: (item) => !!checklistConfig[item.key]?.path,
    },
  ];

  return (
    <Checklist
      title={t('checklist.title')}
      items={checklistItems}
      onToggleItem={onToggleItem}
      isUpdating={isUpdating}
      progressLabel={t('checklist.progress', { completed: '{{completed}}', total: '{{total}}' })}
      actions={actions}
      data-tour="checklist"
    />
  );
}
