import { useTranslation } from 'react-i18next';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { cn } from '@/shadcn/lib/utils';
import type { PricingPlan, BillingCycle } from '../../domain/models';

interface PricingTierCardProps {
  plan: PricingPlan;
  billingCycle: BillingCycle;
  onCtaClick: (planId: string) => void;
}

export function PricingTierCard({ plan, billingCycle, onCtaClick }: PricingTierCardProps) {
  const { t } = useTranslation('pricing');
  const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
  const isEnterprise = plan.id === 'enterprise';
  const monthlyEquivalent = billingCycle === 'yearly' && plan.price.yearly > 0 
    ? Math.round(plan.price.yearly / 12) 
    : null;

  return (
    <Card className={cn(
      'relative flex flex-col transition-all duration-200',
      plan.isPopular 
        ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' 
        : 'hover:border-primary/50 hover:shadow-md'
    )}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="h-3 w-3" />
            {t('popular')}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Pricing */}
        <div className="mb-6">
          {isEnterprise ? (
            <div className="space-y-1">
              <span className="text-3xl font-bold">{t('custom')}</span>
              <p className="text-sm text-muted-foreground">{t('contactForPricing')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">${price}</span>
                <span className="text-muted-foreground">/{billingCycle === 'yearly' ? t('year') : t('month')}</span>
              </div>
              {monthlyEquivalent && (
                <p className="text-sm text-muted-foreground">
                  {t('equivalentMonthly', { price: monthlyEquivalent })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button 
          onClick={() => onCtaClick(plan.id)} 
          className={cn('w-full gap-2', plan.isPopular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}
          variant={plan.isPopular ? 'default' : 'secondary'}
          size="lg"
        >
          {plan.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
