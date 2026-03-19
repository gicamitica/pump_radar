import { MapPin, ArrowRight, Package } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import type { ShipmentLocation, ShipmentCarrier } from './types';

interface ShipmentRouteInfoProps {
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  carrier?: ShipmentCarrier;
  labels?: {
    origin?: string;
    destination?: string;
  }
}

export function ShipmentRouteInfo({
  origin,
  destination,
  carrier,
  labels
}: ShipmentRouteInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
      {/* Origin */}
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            {labels?.origin || 'Origin'}
          </p>
          <p className="font-medium text-foreground leading-tight">
            {origin.city}, {origin.state} {origin.postalCode}
          </p>
        </div>
      </div>
      
      {/* Arrow Separator - Hidden on mobile */}
      <div className="hidden sm:flex items-center justify-center shrink-0">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Destination */}
      <div className="flex items-start gap-2 flex-1">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            {labels?.destination || 'Destination'}
          </p>
          <p className="font-medium text-foreground leading-tight">
            {destination.city}, {destination.state} {destination.postalCode}
          </p>
        </div>
      </div>

      {/* Carrier Badge - Inline on large screens */}
      {carrier && (
        <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1 text-xs shrink-0">
          <Package className="h-3.5 w-3.5" />
          {carrier.name}
        </Badge>
      )}
    </div>
  );
}
