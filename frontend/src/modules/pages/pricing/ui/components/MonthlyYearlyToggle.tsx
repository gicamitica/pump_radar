import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { cn } from '@/shadcn/lib/utils';
import type { BillingCycle } from '../../domain/models';

interface MonthlyYearlyToggleProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (billingCycle: BillingCycle) => void;
  savingsPercent?: number;
}

export function MonthlyYearlyToggle({ 
  billingCycle, 
  onBillingCycleChange,
  savingsPercent = 17,
}: MonthlyYearlyToggleProps) {
  const { t } = useTranslation('pricing');

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex items-center rounded-full bg-muted p-1">
        <button
          onClick={() => onBillingCycleChange('monthly')}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-medium transition-all',
            billingCycle === 'monthly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('monthly')}
        </button>
        <button
          onClick={() => onBillingCycleChange('yearly')}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
            billingCycle === 'yearly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('yearly')}
          {billingCycle !== 'yearly' && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
              {t('savePercent', { percent: savingsPercent })}
            </Badge>
          )}
        </button>
      </div>
      {billingCycle === 'yearly' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {t('yearlySavingsApplied', { percent: savingsPercent })}
        </p>
      )}
    </div>
  );
}
