import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '@/shared/ui/layouts/app';

interface BrandingProps {
  className?: string;
}

const PumpRadarLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
    <g stroke="currentColor" strokeWidth="0.5" opacity="0.35">
      <line x1="50" y1="10" x2="50" y2="14"/><line x1="50" y1="86" x2="50" y2="90"/>
      <line x1="10" y1="50" x2="14" y2="50"/><line x1="86" y1="50" x2="90" y2="50"/>
      <line x1="21.7" y1="21.7" x2="24.5" y2="24.5"/><line x1="75.5" y1="75.5" x2="78.3" y2="78.3"/>
      <line x1="78.3" y1="21.7" x2="75.5" y2="24.5"/><line x1="24.5" y1="75.5" x2="21.7" y2="78.3"/>
    </g>
    <path d="M50 4 L53.5 13 L50 10 L46.5 13 Z" fill="currentColor"/>
    <path d="M50 96 L53.5 87 L50 90 L46.5 87 Z" fill="currentColor"/>
    <path d="M4 50 L13 46.5 L10 50 L13 53.5 Z" fill="currentColor"/>
    <path d="M96 50 L87 46.5 L90 50 L87 53.5 Z" fill="currentColor"/>
    <path d="M50 16 L79 68 L21 68 Z" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M50 16 L21 68 L27 68 L50 24 Z" fill="currentColor" opacity="0.2"/>
    <path d="M50 16 L79 68 L73 68 L50 24 Z" fill="currentColor" opacity="0.1"/>
    <line x1="50" y1="16" x2="50" y2="68" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    <path d="M50 74 L62 56 L38 56 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.25"/>
    <path d="M50 74 L62 56 L38 56 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const Branding: React.FC<BrandingProps> = ({ className }) => {
  const { collapsed } = useLayout();

  return (
    <div className={cn('flex items-center gap-2', collapsed && 'justify-center', className)}>
      <PumpRadarLogo className="size-8 text-emerald-500" />
      {!collapsed && (
        <span className="font-bold tracking-tight text-lg whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-300 bg-clip-text text-transparent">
          PumpRadar
        </span>
      )}
    </div>
  );
};

export default Branding;
