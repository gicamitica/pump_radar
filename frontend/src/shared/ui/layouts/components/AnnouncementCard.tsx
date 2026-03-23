import React, { useState } from 'react';
import { X, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'pumpradar_promo_dismissed';

const AnnouncementCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isDismissed) {
      const t = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const onDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className={cn(
            'relative overflow-hidden rounded-2xl p-4 shadow-2xl transition-all duration-500',
            'border border-emerald-500/20 bg-gradient-to-br from-emerald-950/95 via-slate-900/98 to-black',
            'backdrop-blur-xl'
          )}
        >
          <div className="absolute -right-4 -top-10 size-28 bg-emerald-500 blur-3xl opacity-10 pointer-events-none" />
          <div className="absolute -left-4 -bottom-10 size-28 bg-blue-500 blur-3xl opacity-10 pointer-events-none" />

          <button
            aria-label="Dismiss"
            onClick={onDismiss}
            className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white z-20"
          >
            <X className="size-3.5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/40 blur-xl rounded-full" />
              <div className="relative size-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg border border-white/20">
                <TrendingUp className="size-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Pro Access</div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                Complete AI Signals
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock all PUMP & DUMP signals with real-time AI analysis.
              </p>
            </div>

            <button
              onClick={() => { navigate('/subscription'); onDismiss(); }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
            >
              <Zap className="size-3.5" />
              View Plans
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementCard;
