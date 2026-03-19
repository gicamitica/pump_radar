import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/shadcn/components/ui/card';
import { pricingPlans, featureComparison, faqs } from '../../infrastructure/mocks';
import { PricingTierCard, FeatureComparisonTable, FaqAccordion, MonthlyYearlyToggle } from '../components';
import type { BillingCycle } from '../../domain/models';

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleCtaClick = (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@example.com?subject=Enterprise%20Pricing%20Inquiry';
    } else {
      console.log('Starting checkout for plan:', planId);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero section */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          {t('description')}
        </p>
        
        <MonthlyYearlyToggle 
          billingCycle={billingCycle} 
          onBillingCycleChange={setBillingCycle} 
        />
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {pricingPlans.map((plan) => (
            <PricingTierCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onCtaClick={handleCtaClick}
            />
          ))}
        </div>
      </div>

      {/* Feature comparison */}
      <div className="bg-muted/30 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">{t('compareFeatures')}</h2>
            <p className="text-muted-foreground">{t('compareFeaturesDescription')}</p>
          </div>
          <Card className="overflow-hidden">
            <FeatureComparisonTable features={featureComparison} plans={pricingPlans} />
          </Card>
        </div>
      </div>

      {/* FAQ section */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">{t('faqTitle')}</h2>
            <p className="text-muted-foreground">{t('faqDescription')}</p>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary/5 py-16 px-4 rounded-xl">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">{t('ctaTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('ctaDescription')}</p>
          <p className="text-sm text-muted-foreground">
            {t('ctaHelpText')}
          </p>
        </div>
      </div>
    </div>
  );
}
