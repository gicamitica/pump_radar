import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Zap, Calendar, Crown, Lock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { readStoredToken } from '@/shared/utils/tokenStorage';

const getToken = () => readStoredToken();

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: 0,
    period: '7 days',
    icon: <Zap className="h-6 w-6" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    features: [
      'Start your 7-day free trial',
      'Full Pro access',
      'No charge today',
      'Cancel anytime before billing',
      'Secure checkout with Stripe',
      'Reminder email before billing',
    ],
    cta: 'Included with paid plans',
    disabled: true,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 29.99,
    period: '/month',
    icon: <Calendar className="h-6 w-6" />,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950',
    featured: true,
    badge: 'Popular',
    features: [
      'All pump & dump signals',
      'Full AI signal analysis',
      'LunarCrush + CoinGecko data',
      'Hourly signal refresh',
      'Morning & evening signal digest',
      'Priority support',
    ],
    cta: 'Start 7-Day Trial',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 299.99,
    period: '/year',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-950',
    badge: 'Save 2 months',
    badgeColor: 'bg-purple-500',
    features: [
      'All pump & dump signals',
      'Full AI signal analysis',
      'Live LunarCrush data',
      'Hourly signal refresh',
      'Morning & evening signal digest',
      'Priority support',
      'Save 2 months vs monthly',
    ],
    cta: 'Start 7-Day Trial',
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (planId: string) => {
    if (planId === 'trial') return;
    const token = getToken();
    if (!token) {
      navigate('/auth/login');
      return;
    }
    setLoading(planId);
    setError('');
    try {
      const originUrl = window.location.origin;
      const res = await axios.post('/api/payments/checkout', {
        plan: planId,
        origin_url: originUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error processing payment');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    const token = getToken();
    if (!token) {
      navigate('/auth/login');
      return;
    }
    setPortalLoading(true);
    setError('');
    try {
      const originUrl = window.location.origin;
      const res = await axios.post('/api/payments/portal', {
        origin_url: originUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail?.error?.message || err.response?.data?.detail || 'Error opening billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8" data-testid="subscription-page">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Start with a 7-day free trial, then continue automatically unless canceled
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading} data-testid="manage-billing-btn">
            {portalLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening billing...</> : 'Manage Billing / Cancel Trial'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400 text-sm text-center" data-testid="payment-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`relative flex flex-col ${plan.featured ? 'border-primary shadow-lg shadow-primary/10 scale-105' : ''}`}
            data-testid={`plan-card-${plan.id}`}
          >
            {plan.badge && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2`}>
                <Badge className={`${plan.badgeColor || 'bg-primary'} text-white px-3 py-1`}>
                  {plan.badge}
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className={`w-14 h-14 ${plan.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 ${plan.color}`}>
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.featured ? 'default' : 'outline'}
                disabled={!!plan.disabled || loading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
                data-testid={`subscribe-btn-${plan.id}`}
              >
                {loading === plan.id ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                ) : plan.disabled ? (
                  <><Lock className="h-4 w-4 mr-2" />{plan.cta}</>
                ) : (
                  plan.cta
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payments via Stripe. Billing details are collected at checkout. Cancel before the trial ends to avoid the first charge.
      </p>
    </div>
  );
}
