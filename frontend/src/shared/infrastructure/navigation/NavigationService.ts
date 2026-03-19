import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { ILogger } from '@/shared/utils/Logger';
import { inject, injectable } from 'inversify';

/**
 * Interface for navigation service
 */
export interface INavigationService {
  /**
   * Navigate to a specific route
   */
  navigateTo(path: string): void;
  
  /**
   * Set the navigation function to be used
   */
  setNavigationFunction(navigateFunction: (path: string) => void): void;
}

/**
 * Service for handling navigation across the application
 * This allows components that don't have direct access to React Router's
 * navigate function (like event handlers) to perform navigation
 */
@injectable()
export class NavigationService implements INavigationService {
  private navigateFunction: ((path: string) => void) | null = null;

  constructor(
    @inject(CORE_SYMBOLS.ILogger) private logger: ILogger
  ) {}

  /**
   * Navigate to the specified path
   * @param path The path to navigate to
   */
  navigateTo(path: string): void {
    //this.logger.info('NavigationService: Attempting to navigate to', { path, hasNavigateFunction: !!this.navigateFunction });
    
    if (this.navigateFunction) {
      try {
        //this.logger.info('NavigationService: Using React Router navigation');
        this.navigateFunction(path);
        // this.logger.info('NavigationService: Navigation function called successfully');
      } catch (error) {
        this.logger.error('NavigationService: Error using navigation function', error);
        // Fallback to window.location on error
        this.logger.info('NavigationService: Falling back to window.location.href');
        window.location.href = path;
      }
    } else {
      // this.logger.warn('NavigationService: No navigation function set. Falling back to window.location.href for path:', path);
      
      // Fallback to window.location if no navigation function is set
      window.location.href = path;
    }
  }

  /**
   * Set the navigation function to be used by the service
   * This should be called from a component that has access to React Router's navigate
   * @param navigateFunction The navigation function from React Router
   */
  setNavigationFunction(navigateFunction: (path: string) => void): void {
    //this.logger.info('NavigationService: Setting navigation function');
    this.navigateFunction = navigateFunction;
    //this.logger.info('NavigationService: Navigation function set successfully', { hasFunction: !!this.navigateFunction });
  }
}
