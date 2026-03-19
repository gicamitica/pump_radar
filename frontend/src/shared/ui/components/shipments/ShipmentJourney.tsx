import React from 'react';
import { Package, Truck, MapPin, Info } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { format } from 'date-fns';

interface ShipmentJourneyProps {
  departureTime: string | null;
  expectedArrival: string;
  progress?: number;
  className?: string;
  detailValue?: string;
  labels?: {
    departure?: string;
    expectedArrival?: string;
    info?: string;
  };
  departureIcon?: React.ReactNode;
  arrivalIcon?: React.ReactNode;
  progressIcon?: React.ReactNode;
  infoIcon?: React.ReactNode;
  progressColorClass?: string; // Custom gradient/color
}

/**
 * ShipmentJourney - A pure presentational component for journey progress.
 * Zero internal time calculation logic.
 */
export function ShipmentJourney({
  departureTime,
  expectedArrival,
  progress = 0,
  className,
  detailValue,
  labels,
  departureIcon,
  arrivalIcon,
  progressIcon,
  infoIcon,
  progressColorClass = 'to-blue-500'
}: ShipmentJourneyProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yy HH:mm');
    } catch {
      return dateString;
    }
  };

  const desktopProgressStyles = `bg-gradient-to-r from-transparent ${progressColorClass}`;
  const mobileProgressStyles = `bg-gradient-to-b from-transparent ${progressColorClass}`;

  return (
    <div className={cn("", className)}>
      {/* Journey Icons Timeline */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-8 px-3 py-4 bg-muted/20 rounded-lg border">
        <div className="flex flex-col items-center z-10">
          <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center bg-background">
            {departureIcon || <Package className="h-5 w-5 text-primary" />}
          </div>
        </div>

        <div className="h-16 w-[2px] md:h-[2px] md:w-auto md:flex-1 bg-border relative">
          <div 
            className={cn(
              "hidden md:block absolute left-0 top-0 h-full transition-all duration-500 rounded-full",
              desktopProgressStyles
            )}
            style={{ width: `${progress}%` }}
          />
          
          <div 
            className={cn(
              "md:hidden absolute top-0 left-0 w-full transition-all duration-500 rounded-full",
              mobileProgressStyles
            )}
            style={{ height: `${progress}%` }}
          />

          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-10 left-1/2 top-[var(--progress)] md:left-[var(--progress)] md:top-1/2"
            style={{ 
              '--progress': `${progress}%`
            } as React.CSSProperties}
          >
            <div className={cn(
              "h-9 w-9 rounded-full bg-background border-2 shadow-sm flex items-center justify-center transition-colors duration-300",
              progress >= 100 ? "border-emerald-500 text-emerald-500" :
              progress > 75 ? "border-indigo-500 text-indigo-500" :
              "border-blue-500 text-blue-500"
            )}>
              {progressIcon || <Truck className="h-4 w-4 fill-current" />}
            </div>
            
            {progress > 5 && progress < 95 && (
               <div className={cn(
                 "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold md:block hidden",
                 progress > 75 ? "text-indigo-500" : "text-blue-500"
               )}>
                 {progress}%
               </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="h-10 w-10 rounded-full bg-muted border-2 border-border flex items-center justify-center bg-background">
            {arrivalIcon || <MapPin className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* Timeline Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-3 mt-4 px-1">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">
            {infoIcon || <Info className="h-3 w-3" />}
            <span>{labels?.info || 'Info'}</span>
          </div>
          <div className="text-xs font-bold text-foreground capitalize">{detailValue || 'N/A'}</div>
        </div>

        <div className="flex flex-col items-center sm:items-center text-center">
          <div className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">
            {labels?.departure || 'Departure Time'}
          </div>
          <div className="text-xs font-bold text-foreground">{formatTime(departureTime)}</div>
        </div>

        <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
          <div className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">
            {labels?.expectedArrival || 'Expected Arrival'}
          </div>
          <div className="text-xs font-bold text-foreground">{formatTime(expectedArrival)}</div>
        </div>
      </div>
    </div>
  );
}
