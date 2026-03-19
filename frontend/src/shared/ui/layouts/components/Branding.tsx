import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import logo from '@/assets/logo.png';
import { useLayout } from '@/shared/ui/layouts/app';
import { useTranslation } from 'react-i18next';

interface BrandingProps {
  className?: string;
}

/**
 * Branding - Logo and brand name component
 * 
 * Displays the application logo and name
 */
export const Branding: React.FC<BrandingProps> = ({ className }) => {
  const { collapsed } = useLayout();
  const { t } = useTranslation('navigation');

  return (
    <div className={cn('flex items-center gap-2', collapsed && 'justify-center', className)}>

      <img src={logo} alt={t('brand')} className="size-8 rounded-full" />

      {!collapsed && (
        <span className="font-semibold tracking-tight text-lg whitespace-nowrap">{t('brand')}</span>
      )}
    </div>
  );
};

export default Branding;
