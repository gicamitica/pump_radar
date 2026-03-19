export type PlanId = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  isPopular?: boolean;
  features: string[];
  ctaLabel: string;
}
