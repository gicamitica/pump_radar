/*
 * @file NavigationProvider.tsx
 * 
 * This file is responsible for providing the necessary navigation context for the entire application.
 * It includes providers for navigation state and navigation functions.
 * 
 * Provider component that connects the NavigationService with React Router
 * This allows non-React components (like event handlers) to use navigation
 * 
 * @author pg@5Studios.net
 * @since 2025-03-20
 * @version 1.0.0
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { diContainer } from '@/core/di/container';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { INavigationService } from '@/shared/infrastructure/navigation/NavigationService';
import type { ILogger } from '@/shared/utils/Logger';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const isInitialized = useRef(false);
  const logger = diContainer.get<ILogger>(CORE_SYMBOLS.ILogger);
  
  useEffect(() => {
    //logger.info('NavigationProvider: Initializing');
    
    try {
      // Get the NavigationService from DI container
      const navigationService = diContainer.get<INavigationService>(CORE_SYMBOLS.INavigationService);
      
      // Set the navigation function to be used by the service
      navigationService.setNavigationFunction((path: string) => {
        //logger.info(`NavigationProvider: Navigating to ${path}`);
        navigate(path);
      });
      
      isInitialized.current = true;
      //logger.info('NavigationProvider: Successfully initialized');
      
      // Test navigation is working
      // Uncomment for testing only
      // setTimeout(() => {
      //   navigationService.navigateTo('/dashboard');
      // }, 1000);
    } catch (error) {
      logger.error('NavigationProvider: Error initializing', error);
    }
    
    // No cleanup needed as the NavigationService is a singleton
  }, [navigate, logger]);
  
  return <>{children}</>;
};
