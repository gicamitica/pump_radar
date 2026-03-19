/*
 * @file TourProvider.tsx
 * 
 * This file is responsible for providing the necessary tour context for the entire application.
 * It includes providers for tour state and tour steps.
 * 
 * The `TourProvider` component is the entry point for providing all the necessary tour providers
 * for the application. It takes in children components as props and renders them wrapped
 * inside the necessary tour providers.
 * 
 * @author 5Studios
 * @since 2025-10-20
 * @version 1.0.0
 */
import React, { useState } from 'react';
import { TourContext } from './useTour';

interface TourProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

// Helper to load tours from localStorage
function loadCompletedTours(storageKey: string): string[] {
  try {
    const savedTours = localStorage.getItem(storageKey);
    if (savedTours) {
      return JSON.parse(savedTours);
    }
  } catch (error) {
    console.error('Error loading completed tours:', error);
  }
  return [];
}

export const TourProvider: React.FC<TourProviderProps> = ({ 
  children,
  storageKey = 'katalyst_completed_tours'
}) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);
  //const [currentTourSteps, setCurrentTourSteps] = useState<TourStep[]>([]);
  const [completedTours, setCompletedTours] = useState<string[]>(() => loadCompletedTours(storageKey));

  // Save completed tours to localStorage
  const saveCompletedTours = (tours: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tours));
    } catch (error) {
      console.error('Error saving completed tours:', error);
    }
  };

  const openTour = (tourId: string) => {
    setCurrentTourId(tourId);
    //setCurrentTourSteps(steps);
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const finishTour = () => {
    if (currentTourId) {
      setTourCompleted(currentTourId);
    }
    closeTour();
  };

  const setTourCompleted = (tourId: string) => {
    if (!completedTours.includes(tourId)) {
      const updatedTours = [...completedTours, tourId];
      setCompletedTours(updatedTours);
      saveCompletedTours(updatedTours);
    }
  };

  const isTourCompleted = (tourId: string) => {
    return completedTours.includes(tourId);
  };

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        currentTourId,
        openTour,
        closeTour,
        finishTour,
        //currentTourSteps,
        setTourCompleted,
        isTourCompleted,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

