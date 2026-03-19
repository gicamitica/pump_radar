import { format } from 'date-fns';
import { cn } from '@/shadcn/lib/utils';
import { MapPin } from 'lucide-react';
import type { ShipmentEvent } from './types';

interface ShipmentTimelineProps {
  events: ShipmentEvent[];
  className?: string;
  reverse?: boolean;
}

/**
 * Shared component to display shipment event timeline
 * Shows chronological list of shipment events with icons and details
 */
export function ShipmentTimeline({ events, className, reverse = true }: ShipmentTimelineProps) {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return reverse ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className={cn("space-y-0", className)}>
      {sortedEvents.map((event, index) => {
        const isLast = index === sortedEvents.length - 1;
        
        return (
          <div key={event.id} className="flex gap-4 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-border" />
            )}
            
            {/* Icon Slot */}
            <div className="relative z-10 mt-1">
              <div className={cn(
                "h-7 w-7 rounded-full border-2 bg-background flex items-center justify-center shrink-0",
                index === 0 ? "border-primary" : "border-border"
              )}>
                {event.icon || (
                  <MapPin className={cn(
                    "h-3.5 w-3.5",
                    index === 0 ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
              <div className="flex items-baseline gap-2">
                <h4 className="text-sm font-semibold">{event.description}</h4>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.details}
              </p>
              {event.location && event.location.city && (
                <p className="text-xs text-muted-foreground mt-1">
                  @ {event.location.city}, {event.location.state}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
