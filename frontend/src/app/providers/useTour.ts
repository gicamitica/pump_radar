import { createContext, useContext } from 'react';

export interface TourContextType {
  isTourOpen: boolean;
  currentTourId: string | null;
  openTour: (tourId: string) => void;
  closeTour: () => void;
  finishTour: () => void;
  setTourCompleted: (tourId: string) => void;
  isTourCompleted: (tourId: string) => boolean;
}

export const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
