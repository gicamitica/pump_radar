import type { PricingPlan } from '../../domain/models';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small teams getting started.',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Up to 10 projects',
      'Basic analytics',
      '2GB of storage',
      'Email support',
    ],
    ctaLabel: 'Get started for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams that need more power and features.',
    price: {
      monthly: 29,
      yearly: 290,
    },
    isPopular: true,
    features: [
      'Unlimited projects',
      'Advanced analytics',
      '100GB of storage',
      'Priority email support',
      'API access',
    ],
    ctaLabel: 'Start your 14-day trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs.',
    price: {
      monthly: 99,
      yearly: 990,
    },
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 phone support',
      'SAML SSO',
    ],
    ctaLabel: 'Contact sales',
  },
];
