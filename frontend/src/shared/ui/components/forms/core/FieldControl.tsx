import React from 'react';
import { Check, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export type FieldStatus = 'default' | 'success' | 'warning' | 'error';
export type IconAlignment = 'center' | 'start';

export interface FieldControlProps {
  status?: FieldStatus;
  statusMessage?: string;
  successIcon?: React.ReactNode;
  warningIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  /** Apply status classes and padding to the child input */
  applyInputStyles?: boolean;
  /** Render status icon on the right */
  showStatusIcon?: boolean;
  /** Show a loading spinner in place of the status icon */
  isLoading?: boolean;
  /** Vertical alignment of the icon. Use 'start' for textareas. Default 'center' */
  iconAlignment?: IconAlignment;
}

const statusTextClass: Record<FieldStatus, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
};

export const FieldControl: React.FC<FieldControlProps> = ({
  status = 'default',
  statusMessage,
  successIcon = <Check className="h-4 w-4 text-success" />,
  warningIcon = <AlertTriangle className="h-4 w-4 text-warning" />,
  errorIcon = <AlertCircle className="h-4 w-4 text-destructive" />,
  className,
  children,
  showStatusIcon = true,
  isLoading = false,
  iconAlignment = 'center',
}) => {
  const icon = isLoading 
    ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    : status === 'success' ? successIcon : status === 'warning' ? warningIcon : errorIcon;

  const shouldShowIcon = (showStatusIcon && status !== 'default') || isLoading;

  return (
    <div className={cn('field-control space-y-1', className)}>
      <div className="field-control-input relative">
        {children}
        {shouldShowIcon && (
          <span className={cn(
            "absolute right-3 text-current pointer-events-none",
            iconAlignment === 'center' ? "top-1/2 -translate-y-1/2" : "top-3"
          )}>
            {icon}
          </span>
        )}
      </div>
      {statusMessage && (
        <p className={cn('field-control-message text-xs', statusTextClass[status])}>{statusMessage}</p>
      )}
    </div>
  );
};

export default FieldControl;
