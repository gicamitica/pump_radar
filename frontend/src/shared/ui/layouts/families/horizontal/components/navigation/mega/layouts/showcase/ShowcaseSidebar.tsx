import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Zap, Shield, Rocket } from 'lucide-react';
import dashboardPreview from '@/assets/dashboard-preview.png';

interface ShowcaseSidebarProps {
  onNavigate?: () => void;
}

export const ShowcaseSidebar: React.FC<ShowcaseSidebarProps> = ({ onNavigate }) => {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "relative flex flex-col h-full overflow-hidden rounded-xl border border-border/50",
        "bg-gradient-to-br from-slate-900 to-slate-950 text-white"
      )}>
        {/* Background Image/Gradient Effect */}
        <div 
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-top mix-blend-overlay" 
          style={{ backgroundImage: `url(${dashboardPreview})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950/95" />

        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
              {t('mega.showcase.premium', { defaultValue: 'New Release' })}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">
              {t('mega.showcase.upgradeTitle', { defaultValue: 'Featured Features' })}
            </h3>
            <p className="text-slate-400 text-sm">
              {t('mega.showcase.upgradeDesc', { defaultValue: 'Unlock unlimited possibilities' })}
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3 mb-8 mt-auto">
            <CtaOption 
              icon={Zap} 
              title={t('mega.showcase.cta.library', { defaultValue: 'Real Estate' })} 
              desc={t('mega.showcase.cta.libraryDesc', { defaultValue: 'Property Management' })} 
              onClick={() => handleLinkClick('/dashboards/real-estate')}
            />
            <CtaOption 
              icon={Shield} 
              title={t('mega.showcase.cta.support', { defaultValue: 'Shipment Tracking' })} 
              desc={t('mega.showcase.cta.supportDesc', { defaultValue: 'Real-time Updates' })} 
              delay={100}
              onClick={() => handleLinkClick('/dashboards/shipments')}
            />
            <CtaOption 
              icon={Rocket} 
              title={t('mega.showcase.cta.enterprise', { defaultValue: 'Delivery Tracking' })} 
              desc={t('mega.showcase.cta.enterpriseDesc', { defaultValue: 'Fleet Management' })} 
              delay={200}
              onClick={() => handleLinkClick('/dashboards/deliveries')}
            />
          </div>

          {/* Action */}
          <div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 mb-3"
              onClick={() => handleLinkClick('/subscription')}
            >
              {t('mega.showcase.getStarted', { defaultValue: 'Get Started Today' })}
            </Button>
            <p className="text-[10px] text-center text-slate-500">
              {t('mega.showcase.guarantee', { defaultValue: 'Cancel anytime • 30-day money back' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CtaOptionProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay?: number;
  onClick?: () => void;
}

const CtaOption = ({ icon: Icon, title, desc, delay = 0, onClick }: CtaOptionProps) => (
  <div 
    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both group"
    style={{ animationDelay: `${delay}ms` }}
    onClick={onClick}
    role="button"
  >
    <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 shrink-0 group-hover:bg-blue-500/30 transition-colors">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{title}</h4>
      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{desc}</p>
    </div>
  </div>
);
