/**
 * RealtimeDevSettings Component
 * 
 * A developer settings dropdown for switching between polling and WebSocket modes.
 * Only visible in development mode. Can be used in any dashboard.
 */

import { useRealtimeMode, type RealtimeMode } from '@/shared/infrastructure/realtime';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/components/ui/dropdown-menu';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Settings2, Radio, Wifi, Check, Lightbulb } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';

export interface RealtimeDevSettingsProps {
  className?: string;
}

const MODE_OPTIONS: { value: RealtimeMode; label: string; icon: typeof Radio; description: string }[] = [
  {
    value: 'polling',
    label: 'HTTP Polling',
    icon: Radio,
    description: 'Fetch data periodically via REST API',
  },
  {
    value: 'websocket',
    label: 'WebSocket',
    icon: Wifi,
    description: 'Real-time push via WebSocket connection',
  },
];

/**
 * Developer settings dropdown for switching realtime data mode
 */
export function RealtimeDevSettings({ className }: RealtimeDevSettingsProps) {
  const { mode, setMode } = useRealtimeMode();

  // Only show in development
  // if (import.meta.env.PROD) {
  //   return null;
  // }

  const currentOption = MODE_OPTIONS.find((opt) => opt.value === mode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings2 className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Realtime:</span>
          <Badge variant="secondary" className="ml-2">
            {currentOption?.label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Realtime Data Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = mode === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setMode(option.value)}
              className="flex flex-col items-start gap-1 py-2"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{option.label}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-xs text-muted-foreground pl-6">
                {option.description}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="text-xs bg-muted/50 flex items-start p-2">
          <div className="p-2">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              This setting enables realtime data updates. <span className="font-medium">Realtime feature works out of the box.</span>
            </p>
            <a href="https://docs.5studios.net/katalyst/components/realtime" target="_blank" rel="noopener noreferrer" className="text-xs text-primary">Learn more</a>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
