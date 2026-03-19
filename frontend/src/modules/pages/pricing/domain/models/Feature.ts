import type { PlanId } from './PricingPlan';

export interface Feature {
  id: string;
  name: string;
  description?: string;
  availability: {
    [key in PlanId]: boolean | string;
  };
}
