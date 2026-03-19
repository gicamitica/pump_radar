/**
 * @file AppProviders.tsx
 * 
 * This file is responsible for providing the necessary providers for the entire application.
 * It includes providers for i18n, theme, query client, navigation, tour, and dependency injection.
 * 
 * The `AppProviders` component is the entry point for providing all the necessary providers
 * for the application. It takes in children components as props and renders them wrapped
 * inside the necessary providers.
 * 
 * The `AppProviders` component also sets the document's direction (RTL/LTR) based on the
 * active language using the `useEffect` hook.
 * 
 * @author pg@5Studios.net
 * @since 2025-03-06
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { DIProvider } from '@/app/providers/DIProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { TourProvider } from '@/app/providers/TourProvider';
import ErrorBoundary from '@/app/providers/ErrorBoundary';
import { Toaster } from '@/shared/ui/shadcn/components/ui/sonner';

// Init query client
const queryClient = new QueryClient();

export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  // Init i18n dir support (RTL/LTR) based on active language
  useEffect(() => {
    document.documentElement.setAttribute('dir', i18n.dir());

    const onLangChanged = (lng: string) => {
      document.documentElement.setAttribute('dir', i18n.dir(lng));
    };

    i18n.on('languageChanged', onLangChanged);

    return () => { 
      i18n.off('languageChanged', onLangChanged); 
    };
  }, []);

  return (
    <ErrorBoundary name="App">
      <DIProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <TourProvider>
                {children}
                <Toaster />
              </TourProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </DIProvider>
    </ErrorBoundary>
  );
};
