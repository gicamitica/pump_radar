/**
 * @file App.tsx
 * 
 * This file is the main entry point for the application. It is responsible for providing
 * the necessary providers for the entire application and rendering the `AppRouter` component.
 * 
 * @author pg@5Studios.net
 * @since 2025-03-12
 * @version 1.0.0
 */
import React from 'react';
import { AppProviders } from '@/app/providers/AppProviders';
import AppRouter from '@/app/router/AppRouter';

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;
