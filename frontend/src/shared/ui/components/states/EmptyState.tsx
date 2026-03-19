/**
 * EmptyState Component
 * 
 * Displays an empty state with icon, title, description, and optional action.
 * Used when lists are empty, search returns no results, or no data exists.
 * 
 * @example
 * <EmptyState
 *   title="No boards found"
 *   description="Create your first board to get started"
 *   action={{
 *     label: "Create Board",
 *     onClick: () => setShowCreateModal(true),
 *     icon: Plus,
 *   }}
 * />
 */

import { useTranslation } from 'react-i18next';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { StateContainer, type StateContainerProps } from './StateContainer';
import { StateIcon, type StateVariant } from './StateIcon';

export interface EmptyStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon */
  icon?: LucideIcon;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary';
}

export interface EmptyStateProps {
  /** Empty state title - defaults to translated common empty title */
  title?: string;
  /** Empty state description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: StateContainerProps['size'];
  /** Icon variant - defaults to 'empty' */
  variant?: StateVariant;
}

export function EmptyState({ 
  title,
  description,
  icon = Inbox,
  action,
  secondaryAction,
  className,
  size,
  variant = 'empty',
}: EmptyStateProps) {
  const { t } = useTranslation('common');
  
  const displayTitle = title ?? t('async.emptyTitle', 'No data found');
  const displayDescription = description ?? t('async.emptyDescription', 'There are no items to display');

  return (
    <StateContainer className={className} size={size}>
      <StateIcon icon={icon} variant={variant} />
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{displayDescription}</p>
      
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button onClick={action.onClick} variant={action.variant ?? 'default'} className="gap-2">
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant ?? 'outline'} className="gap-2">
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </StateContainer>
  );
}

export default EmptyState;
