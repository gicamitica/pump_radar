/**
 * ConnectionStatus Component
 * 
 * A reusable component for displaying realtime connection status.
 * Shows a pulsing indicator when connected and a static indicator when disconnected.
 */

import { cn } from '@/shadcn/lib/utils';
import { Wifi, Radio } from 'lucide-react';
import type { RealtimeMode } from '@/shared/infrastructure/realtime';

export interface ConnectionStatusProps {
  /** Whether the connection is active */
  isConnected: boolean;
  /** Current realtime mode */
  mode?: RealtimeMode;
  /** Show mode indicator */
  showMode?: boolean;
  /** Show text label */
  showLabel?: boolean;
  /** Custom labels */
  labels?: {
    connected?: string;
    connecting?: string;
    disconnected?: string;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

const sizeClasses = {
  sm: {
    dot: 'h-1.5 w-1.5',
    icon: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    dot: 'h-2 w-2',
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
  },
  lg: {
    dot: 'h-2.5 w-2.5',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
};

const defaultLabels = {
  connected: 'Live',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
};

export function ConnectionStatus({
  isConnected,
  mode = 'websocket',
  showMode = true,
  showLabel = true,
  labels = defaultLabels,
  size = 'md',
  className,
}: ConnectionStatusProps) {
  const sizes = sizeClasses[size];
  const ModeIcon = mode === 'websocket' ? Wifi : Radio;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Mode indicator */}
      {showMode && (
        <div className={cn('flex items-center gap-1 text-muted-foreground', sizes.text)}>
          <ModeIcon className={sizes.icon} />
          <span className="hidden sm:inline">
            {mode === 'websocket' ? 'WS' : 'Poll'}
          </span>
        </div>
      )}
      
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <span className={cn('relative flex', sizes.dot, !isConnected && 'opacity-50')}>
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              isConnected ? 'animate-ping bg-green-400' : 'bg-yellow-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full',
              sizes.dot,
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            )}
          />
        </span>
        
        {showLabel && (
          <span className={cn('text-muted-foreground', sizes.text)}>
            {isConnected ? labels.connected : labels.connecting}
          </span>
        )}
      </div>
    </div>
  );
}
