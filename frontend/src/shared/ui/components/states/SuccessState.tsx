/**
 * SuccessState Component
 * 
 * Displays a success state with icon, title, description, and optional action.
 * Used for successful operations, confirmations, or completion messages.
 * 
 * @example
 * <SuccessState
 *   title="Board created successfully"
 *   description="Your new board is ready to use"
 *   action={{
 *     label: "Go to Board",
 *     onClick: () => navigate('/boards/123'),
 *   }}
 * />
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { StateContainer, type StateContainerProps } from './StateContainer';
import { StateIcon } from './StateIcon';

export interface SuccessStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon */
  icon?: LucideIcon;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary';
}

export interface SuccessStateProps {
  /** Success title */
  title?: string;
  /** Success description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action button */
  action?: SuccessStateAction;
  /** Secondary action button */
  secondaryAction?: SuccessStateAction;
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: StateContainerProps['size'];
}

export function SuccessState({ 
  title,
  description,
  icon = CheckCircle2,
  action,
  secondaryAction,
  className,
  size,
}: SuccessStateProps) {
  const { t } = useTranslation('common');
  
  const displayTitle = title ?? t('async.successTitle', 'Success');
  const displayDescription = description;

  return (
    <StateContainer className={className} size={size}>
      <StateIcon icon={icon} variant="success" />
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      {displayDescription && (
        <p className="text-muted-foreground text-sm max-w-sm">{displayDescription}</p>
      )}
      
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

export default SuccessState;
