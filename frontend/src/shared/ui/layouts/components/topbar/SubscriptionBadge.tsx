import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Crown, Clock } from 'lucide-react';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';

const SubscriptionBadge: React.FC = () => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const navigate = useNavigate();
  const user = auth.getCurrentUser() as any;
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  if (!user) return null;

  const sub = user.subscription || 'trial';
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const isExpired = expiry && new Date() > expiry;

  if (sub === 'monthly' || sub === 'annual') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
        <Crown className="h-3.5 w-3.5" />
        Pro {sub === 'annual' ? 'Annual' : 'Monthly'}
      </div>
    );
  }

  if (sub === 'trial' && !isExpired) {
    return (
      <button
        onClick={() => navigate('/subscription')}
        className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors"
        data-testid="subscription-badge"
      >
        <Clock className={`h-3.5 w-3.5 transition-opacity ${pulse ? 'opacity-100' : 'opacity-40'}`} />
        Free Trial
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/subscription')}
      className="hidden sm:flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-colors animate-pulse"
      data-testid="subscription-badge-expired"
    >
      <Zap className="h-3.5 w-3.5" />
      Upgrade to Pro
    </button>
  );
};

export default SubscriptionBadge;
