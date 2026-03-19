/**
 * NotFoundState Component
 * 
 * Displays a 404/not found state with icon, title, description, and navigation action.
 * Used when a resource doesn't exist or the user navigates to an invalid route.
 * 
 * @example
 * <NotFoundState
 *   title="Board not found"
 *   description="The board you're looking for doesn't exist or has been deleted"
 *   action={{
 *     label: "Back to Boards",
 *     onClick: () => navigate('/boards'),
 *   }}
 * />
 */

import { useTranslation } from 'react-i18next';
import { FileQuestion, Home, ArrowLeft, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { StateContainer, type StateContainerProps } from './StateContainer';
import { StateIcon } from './StateIcon';

export interface NotFoundStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon */
  icon?: LucideIcon;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary';
}

export interface NotFoundStateProps {
  /** Not found title */
  title?: string;
  /** Not found description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action (e.g., "Go Back") */
  action?: NotFoundStateAction;
  /** Secondary action (e.g., "Go Home") */
  secondaryAction?: NotFoundStateAction;
  /** Show default home button when no actions provided */
  showHomeButton?: boolean;
  /** Home button click handler */
  onGoHome?: () => void;
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: StateContainerProps['size'];
}

export function NotFoundState({ 
  title,
  description,
  icon = FileQuestion,
  action,
  secondaryAction,
  showHomeButton = true,
  onGoHome,
  className,
  size,
}: NotFoundStateProps) {
  const { t } = useTranslation('common');
  
  const displayTitle = title ?? t('async.notFoundTitle', 'Not Found');
  const displayDescription = description ?? t('async.notFoundDescription', 'The resource you are looking for does not exist');

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const hasActions = action || secondaryAction;

  return (
    <StateContainer className={className} size={size}>
      <StateIcon icon={icon} variant="warning" />
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{displayDescription}</p>
      
      <div className="flex items-center gap-3 mt-6">
        {hasActions ? (
          <>
            {action && (
              <Button onClick={action.onClick} variant={action.variant ?? 'default'} className="gap-2">
                {action.icon ? <action.icon className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant ?? 'outline'} className="gap-2">
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
                {secondaryAction.label}
              </Button>
            )}
          </>
        ) : showHomeButton && (
          <Button onClick={handleGoHome} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            {t('async.goHome', 'Go Home')}
          </Button>
        )}
      </div>
    </StateContainer>
  );
}

export default NotFoundState;
