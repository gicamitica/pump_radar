import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Zap, Calendar, Crown, Lock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';

const getToken = () => localStorage.getItem('pumpradar_auth_token') || sessionStorage.getItem('pumpradar_auth_token');

const PLANS = [
  {
    id: 'trial',
    name: 'Trial Gratuit',
    price: 0,
    period: '24 ore',
    icon: <Zap className="h-6 w-6" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    features: [
      'Primele 3 semnale PUMP',
      'Primele 3 semnale DUMP',
      'Rezumat AI zilnic',
      'Acces 24 de ore',
    ],
    cta: 'Activat la înregistrare',
    disabled: true,
  },
  {
    id: 'monthly',
    name: 'Pro Lunar',
    price: 29.99,
    period: '/lună',
    icon: <Calendar className="h-6 w-6" />,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950',
    featured: true,
    badge: 'Popular',
    features: [
      'Toate semnalele PUMP & DUMP',
      'Analiză AI în timp real',
      'Date LunarCrush + CoinGecko',
      'Actualizare orară',
      'Rezumat AI detaliat',
      'Acces 30 de zile',
    ],
    cta: 'Abonare Lunar',
  },
  {
    id: 'annual',
    name: 'Pro Anual',
    price: 199.99,
    period: '/an',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-950',
    badge: '-44%',
    badgeColor: 'bg-purple-500',
    features: [
      'Tot ce include Pro Lunar',
      'Economisești 160€/an',
      'Acces 12 luni',
      'Prioritate la noi funcții',
      'Suport prioritar',
    ],
    cta: 'Abonare Anual',
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
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
      setError(err.response?.data?.detail || 'Eroare la procesarea plății');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8" data-testid="subscription-page">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Alege Planul Tău</h1>
        <p className="text-muted-foreground">
          Acces la semnale AI Pump & Dump generate din date reale de piață
        </p>
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
                <span className="text-3xl font-bold">{plan.price === 0 ? 'Gratuit' : `€${plan.price}`}</span>
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
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se procesează...</>
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
        Plăți securizate prin Stripe. Anulați oricând. Prețuri în EUR.
      </p>
    </div>
  );
}
