export type ShipmentStatus = 
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'exception'
  | 'cancelled'
  | 'returned';

export interface ShipmentLocation {
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  address?: string;
}

export interface ShipmentCarrier {
  id?: string;
  name: string;
  code?: string;
  logo?: string;
}

export interface ShipmentEvent {
  id: string;
  timestamp: string;
  status?: ShipmentStatus;
  location?: ShipmentLocation;
  description: string;
  details?: string | null;
  icon?: React.ReactNode;
}

export interface ShipmentAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface ShipmentRouteSegment {
  duration: number; // in minutes
}
