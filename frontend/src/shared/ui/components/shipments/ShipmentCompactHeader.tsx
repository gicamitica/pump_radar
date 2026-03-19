import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ShipmentCompactHeaderProps {
  trackingNumber: string;
  statusBadge?: React.ReactNode;
  shippingDate: string;
  orderId: string;
  orderLinkPath?: string; // Default: /orders
  actions?: React.ReactNode; // Flexible actions slot
  extraInfo?: React.ReactNode; // Flexible slot for additional badges/info
}

/**
 * ShipmentCompactHeader - A pure presentational header for shipment/order tracking.
 * Zero internal business logic.
 */
export function ShipmentCompactHeader({
  trackingNumber,
  statusBadge,
  shippingDate,
  orderId,
  orderLinkPath = '/orders',
  actions,
  extraInfo
}: ShipmentCompactHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl lg:text-2xl font-bold">{trackingNumber}</h3>
          <div className="flex items-center gap-2">
            {statusBadge}
            {extraInfo}
          </div>
        </div>

        <span className="hidden sm:inline text-muted-foreground">•</span>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>{format(new Date(shippingDate), 'MMM dd, yyyy')}</span>
          <span>•</span>
          <Link 
            to={`${orderLinkPath}/${orderId}`} 
            className="text-primary hover:underline font-medium"
          >
            {orderId}
          </Link>
        </div>
      </div>
      
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
