import React from 'react';
import { Button as PrimitiveButton } from '@/shared/ui/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';
import { Loader2, Check, X } from 'lucide-react';

/** Button status type - mutually exclusive states */
export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

/** Props for ActionButton, extends primitive Button props */
export interface ActionButtonProps extends Omit<React.ComponentProps<typeof PrimitiveButton>, 'children'> {
  /**
   * Button status - controls visual state and behavior
   * - 'idle': Normal state (default)
   * - 'loading': Shows spinner, disables button
   * - 'success': Shows checkmark, success styling
   * - 'error': Shows X icon, error styling
   * @default 'idle'
   */
  status?: ButtonStatus;
  /**
   * Button content - can be string or ReactNode
   */
  children?: React.ReactNode;
  /**
   * Custom text to display during loading state
   * If not provided, uses children
   */
  loadingText?: React.ReactNode;
  /**
   * Custom text to display during success state
   * If not provided, uses children
   */
  successText?: React.ReactNode;
  /**
   * Custom text to display during error state
   * If not provided, uses children
   */
  errorText?: React.ReactNode;
  /**
   * Icon position when in loading/success/error state
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
}

/**
 * ActionButton - Enhanced button with built-in status states.
 * 
 * Features:
 * - Single `status` prop for mutually exclusive states
 * - Built-in loading spinner
 * - Success feedback with checkmark
 * - Error feedback with X icon
 * - Automatic disabled state during loading
 * - Customizable text for each state
 * - Icon positioning control
 * 
 * @example
 * ```tsx
 * <ActionButton status="loading">Save Changes</ActionButton>
 * <ActionButton status="success">Saved!</ActionButton>
 * <ActionButton status="error">Failed to save</ActionButton>
 * ```
 */
const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      className,
      children,
      status = 'idle',
      loadingText,
      successText,
      errorText,
      iconPosition = 'left',
      disabled,
      ...rest
    },
    ref
  ) => {
    // Determine the current state icon and text
    const getStateContent = () => {
      switch (status) {
        case 'loading':
          return {
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
            text: loadingText || children,
          };
        case 'success':
          return {
            icon: <Check className="h-4 w-4" />,
            text: successText || children,
          };
        case 'error':
          return {
            icon: <X className="h-4 w-4" />,
            text: errorText || children,
          };
        default:
          return {
            icon: null,
            text: children,
          };
      }
    };

    const { icon, text } = getStateContent();
    const isDisabled = disabled || status === 'loading';

    return (
      <PrimitiveButton
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          'transition-all duration-200',
          status === 'success' && 'bg-success hover:bg-success/90 text-success-foreground',
          status === 'error' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
          className
        )}
        {...rest}
      >
        {icon && iconPosition === 'left' && (
          <span className={cn('inline-flex', text && 'mr-2')}>{icon}</span>
        )}
        {text}
        {icon && iconPosition === 'right' && (
          <span className={cn('inline-flex', text && 'ml-2')}>{icon}</span>
        )}
      </PrimitiveButton>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;