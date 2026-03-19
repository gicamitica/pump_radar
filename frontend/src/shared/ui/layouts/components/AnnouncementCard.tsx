import React, { useState } from 'react';
import { X, Play, Sparkles, Send, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import { PremiumButton } from '@/shared/ui/components/PremiumButton';

const STORAGE_KEY = 'katalyst_announcement_dismissed';

type CardMode = 'intro' | 'active' | 'success';

const AnnouncementCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<CardMode>('intro');
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation('navigation');

  React.useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const onDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleAction = () => {
    setMode('active');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMode('success');
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
            'relative overflow-hidden rounded-2xl p-5 shadow-2xl transition-all duration-500',
            'border border-white/10 bg-gradient-to-br from-indigo-950/95 via-slate-900/98 to-black',
            'backdrop-blur-xl group'
          )}
        >
          {/* Background Glow Orbs */}
          <motion.div 
            animate={{ 
              scale: mode === 'intro' ? 1 : 1.5,
              opacity: mode === 'intro' ? 0.1 : 0.2 
            }}
            className="absolute -right-4 -top-10 size-32 bg-indigo-500 blur-3xl pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              scale: mode === 'intro' ? 1 : 1.2,
              opacity: mode === 'intro' ? 0.1 : 0.15 
            }}
            className="absolute -left-4 -bottom-10 size-32 bg-blue-500 blur-3xl pointer-events-none" 
          />

          <button
            aria-label={t('announcement.dismiss', 'Dismiss')}
            onClick={onDismiss}
            className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white z-20"
          >
            <X className="size-3.5" />
          </button>

          <motion.div layout className="flex flex-col items-center text-center space-y-4">
            {/* Header / Icon Section */}
            <motion.div layout className="relative">
              <div className="absolute inset-0 bg-indigo-500/40 blur-xl rounded-full" />
              <motion.div 
                layout
                className="relative size-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg border border-white/20"
              >
                {mode === 'success' ? (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                     <Sparkles className="size-6 text-white animate-pulse" />
                   </motion.div>
                ) : (
                   <Sparkles className="size-6 text-white" />
                )}
              </motion.div>
            </motion.div>

            {/* Content Switcher */}
            <AnimatePresence mode="wait">
              {mode === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-1"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80">Premium Access</div>
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    Evolve Your Workflow
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mx-auto">
                    Unlock next-generation productivity with integrated intelligence.
                  </p>
                  <div className="pt-3">
                    <PremiumButton
                      variant="nebula"
                      fullWidth
                      icon={<Play className="size-3 fill-current" />}
                      onClick={handleAction}
                    >
                      Try Magic Now
                    </PremiumButton>
                  </div>
                </motion.div>
              )}

              {mode === 'active' && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Spark your creativity...</h3>
                    <p className="text-[12px] text-slate-500 italic">Your AI companion is ready to assist.</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="relative group/input">
                    <input 
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="e.g. Brainstorm marketing ideas..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1 top-1 bottom-1 px-2 flex items-center justify-center bg-indigo-500 rounded-lg text-white hover:bg-indigo-400 transition-colors"
                    >
                      <Send className="size-3" />
                    </button>
                  </form>
                  
                  <button 
                     onClick={() => setMode('intro')}
                     className="text-[12px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Go back
                  </button>
                </motion.div>
              )}

              {mode === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-3 py-2"
                >
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                    <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                      "I've prepared a fresh perspective tailored to your current project. Ready to dive in?"
                    </p>
                  </div>
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={<ArrowRight className="size-3" />}
                    onClick={() => setMode('intro')}
                  >
                    Reveal Deep Dive
                  </PremiumButton>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementCard;
