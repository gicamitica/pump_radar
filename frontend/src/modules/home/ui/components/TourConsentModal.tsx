import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/components/ui/dialog';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Compass, X } from 'lucide-react';

interface TourConsentModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function TourConsentModal({ open, onStartTour, onSkip }: TourConsentModalProps) {
  const { t } = useTranslation('home');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('tour.consent.title')}</DialogTitle>
              <DialogDescription className="mt-1">
                {t('tour.consent.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('tour.consent.features.navigation')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('tour.consent.features.modules')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('tour.consent.features.shortcuts')}
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            {t('tour.consent.duration')}
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onSkip} className="gap-2">
            <X className="h-4 w-4" />
            {t('tour.consent.skip')}
          </Button>
          <Button onClick={onStartTour} className="gap-2">
            <Compass className="h-4 w-4" />
            {t('tour.consent.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
