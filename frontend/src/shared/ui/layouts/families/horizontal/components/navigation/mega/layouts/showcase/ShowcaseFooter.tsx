import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

interface ShowcaseFooterProps {
  className?: string;
}

export const ShowcaseFooter: React.FC<ShowcaseFooterProps> = ({ className }) => {
  const { t } = useTranslation('navigation');

  return (
    <div className={cn(className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {t('mega.showcase.questions', { defaultValue: 'Did you find everything?' })}
        </p>

        <a 
          href="https://5studios.net/contact" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {t('mega.showcase.contact', { defaultValue: 'Contact Us' })}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
};
