import { cn } from '@/shadcn/lib/utils';
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shadcn/components/ui/button';

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  className?: string;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isOpen,
  onClose,
  onFinish,
  className = ''
}) => {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [popupRect, setPopupRect] = useState<DOMRect | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Reset step when tour opens
  // This pattern ensures the tour always starts from step 0 when opened, regardless of previous state
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reset tour to first step when dialog opens
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Find and measure the target element
  useEffect(() => {
    if (!isOpen) return;

    const updateTargetRect = () => {
      const currentTarget = steps[currentStep]?.target;
      if (!currentTarget) return;

      const element = document.querySelector(currentTarget);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Element not found, skip to next step or close
        console.warn(`Tour target not found: ${currentTarget}`);
        setTargetRect(null);
      }
    };

    // Small delay to allow DOM to settle
    const timeoutId = setTimeout(updateTargetRect, 100);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, currentStep, steps]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!popupRef.current) return;
    setPopupRect(popupRef.current.getBoundingClientRect());
  }, [isOpen, currentStep, targetRect]);

  const handleFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    } 
    else {
      handleFinish();
    }
  }, [currentStep, steps.length, handleFinish]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, isOpen, onClose]);

  // Calculate popup position with viewport boundary checking
  const getPopupPosition = () => {
    if (!targetRect || !popupRect) return { style: {}, arrowStyle: {} };
    
    const position = steps[currentStep]?.position || 'bottom';
    const padding = 16;
    const viewportPadding = 16;
    const style: CSSProperties = {};
    const arrowStyle: CSSProperties = {};
    
    let left: number;
    let top: number;

    switch (position) {
      case 'top':
        left = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
        top = targetRect.top - popupRect.height - padding;
        arrowStyle.left = '50%';
        arrowStyle.bottom = '-6px';
        arrowStyle.transform = 'translateX(-50%) rotate(45deg)';
        break;
      case 'right':
        left = targetRect.right + padding;
        top = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
        arrowStyle.left = '-6px';
        arrowStyle.top = '50%';
        arrowStyle.transform = 'translateY(-50%) rotate(45deg)';
        break;
      case 'left':
        left = targetRect.left - popupRect.width - padding;
        top = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
        arrowStyle.right = '-6px';
        arrowStyle.top = '50%';
        arrowStyle.transform = 'translateY(-50%) rotate(45deg)';
        break;
      case 'bottom':
      default:
        left = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
        top = targetRect.bottom + padding;
        arrowStyle.left = '50%';
        arrowStyle.top = '-6px';
        arrowStyle.transform = 'translateX(-50%) rotate(45deg)';
        break;
    }

    // Clamp to viewport boundaries
    const maxLeft = window.innerWidth - popupRect.width - viewportPadding;
    const maxTop = window.innerHeight - popupRect.height - viewportPadding;
    
    style.left = Math.max(viewportPadding, Math.min(left, maxLeft));
    style.top = Math.max(viewportPadding, Math.min(top, maxTop));

    // Adjust arrow if popup was clamped horizontally
    if (position === 'top' || position === 'bottom') {
      const originalCenter = targetRect.left + targetRect.width / 2;
      const popupCenter = (style.left as number) + popupRect.width / 2;
      const offset = originalCenter - popupCenter;
      arrowStyle.left = `calc(50% + ${offset}px)`;
    }

    return { style, arrowStyle };
  };

  if (!isOpen || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const { style: popupStyle, arrowStyle } = getPopupPosition();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={cn('fixed inset-0 z-50', className)}>
      {/* Dark overlay - only show when no target (fallback) */}
      {!targetRect && (
        <div 
          className="absolute inset-0 bg-black/60 transition-opacity duration-300" 
          onClick={onClose}
        />
      )}

      {/* Spotlight with cutout - the shadow creates the dark overlay around the highlighted element */}
      {targetRect && (
        <>
          {/* Click overlay for closing - covers everything except spotlight */}
          <div 
            className="absolute inset-0"
            onClick={onClose}
          />
          {/* Spotlight highlight */}
          <div 
            className={cn(
              'absolute rounded-lg pointer-events-none transition-all duration-300 ease-out',
              'ring-4 ring-primary/80 ring-offset-2 ring-offset-background',
              'shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]',
              'bg-transparent',
              isTransitioning && 'opacity-0'
            )}
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      )}

      {/* Popup */}
      <div
        ref={popupRef}
        className={cn(
          'absolute bg-popover text-popover-foreground rounded-xl shadow-2xl p-5 w-80 z-10',
          'border border-border',
          'transition-all duration-300 ease-out',
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        )}
        style={popupStyle}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-popover border-l border-t border-border"
          style={arrowStyle}
        />

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
        <div className="text-sm text-muted-foreground mb-4">{currentStepData.content}</div>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button 
                size="sm"
                variant="ghost"
                onClick={handlePrevious}
              >
                {t('tour.previous', 'Previous')}
              </Button>
            )}
            <Button 
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? t('tour.finish', 'Finish') : t('tour.next', 'Next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
