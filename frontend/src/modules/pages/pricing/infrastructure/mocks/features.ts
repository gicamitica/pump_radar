import type { Feature } from '../../domain/models';

export const featureComparison: Feature[] = [
  {
    id: 'projects',
    name: 'Projects',
    availability: {
      free: 'Up to 10',
      pro: 'Unlimited',
      enterprise: 'Unlimited',
    },
  },
  {
    id: 'analytics',
    name: 'Analytics',
    availability: {
      free: 'Basic',
      pro: 'Advanced',
      enterprise: 'Advanced',
    },
  },
  {
    id: 'storage',
    name: 'Storage',
    availability: {
      free: '2GB',
      pro: '100GB',
      enterprise: 'Unlimited',
    },
  },
  {
    id: 'support',
    name: 'Support',
    availability: {
      free: 'Email',
      pro: 'Priority email',
      enterprise: '24/7 phone',
    },
  },
  {
    id: 'api',
    name: 'API access',
    availability: {
      free: false,
      pro: true,
      enterprise: true,
    },
  },
  {
    id: 'sso',
    name: 'SAML SSO',
    availability: {
      free: false,
      pro: false,
      enterprise: true,
    },
  },
];
