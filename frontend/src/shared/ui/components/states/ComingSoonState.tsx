import { Rocket, Sparkles, Clock, ArrowRight, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { cn } from '@/shadcn/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export interface ComingSoonStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onBackToHome?: () => void;
  ctaText?: string;
  progress?: number;
}

/**
 * Determines the progress bar color based on the current percentage
 */
const getProgressColor = (value: number) => {
  if (value >= 90) return 'bg-emerald-500';
  if (value >= 70) return 'bg-blue-500';
  if (value >= 50) return 'bg-amber-500';
  if (value >= 30) return 'bg-orange-500';
  return 'bg-rose-500';
};

export const ComingSoonState: React.FC<ComingSoonStateProps> = ({
  title,
  description = "We are working to bring you the best experience, let us know if you're interested",
  icon,
  onBackToHome,
  ctaText = 'Notify Me',
  progress = 84,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Direct API call to the external server
      const API_BASE_URL = 'https://5studios.net/themes/api';
      const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          interest: title 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSuccess(true);
      toast.success(data.message || "Interest registered!", {
        description: "We'll notify you as soon as this feature is ready."
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressColor = getProgressColor(progress);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 blur-3xl opacity-20 animate-pulse rounded-full bg-primary" />
        
        {/* Icon Container */}
        <div className={cn(
          "relative flex items-center justify-center w-24 h-24 rounded-3xl bg-card border border-border/50 shadow-2xl",
          "after:absolute after:inset-0 after:rounded-3xl after:opacity-10 after:bg-gradient-to-br after:from-white after:to-transparent"
        )}>
          {isSuccess ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-300" />
          ) : (
            icon || <Rocket className="w-12 h-12 text-primary" />
          )}
          
          {/* Floating Accents */}
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-amber-500 animate-bounce" />
          <Clock className="absolute -bottom-2 -left-4 w-6 h-6 text-muted-foreground animate-spin-slow" />
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-outfit uppercase">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] animate-in slide-in-from-bottom-2">
            You're on the list! We'll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="email"
                placeholder="Enter your email for updates..." 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-11 pr-4 rounded-2xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className={cn(
                  "h-12 has-[>svg]:px-8 rounded-full shadow-xl transition-all hover:scale-105 hover:shadow-primary/10",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {ctaText}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
              
              {onBackToHome && (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={onBackToHome}
                  className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs"
                >
                  Back to Dashboard
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Release Progress (Visual Only) */}
      <div className="mt-16 w-full max-w-xs space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Development Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50 p-0.5">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", progressColor)} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default ComingSoonState;
