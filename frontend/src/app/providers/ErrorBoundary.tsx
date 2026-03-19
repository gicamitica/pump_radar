import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from '@/shared/ui/components/ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional name for identifying which boundary caught the error */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child component tree
 * 
 * Usage:
 * - Wrap components that might throw errors
 * - Provide custom fallback UI or use default ErrorFallback
 * - Optionally provide onError callback for logging
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error(
        `[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}] Caught error:`,
        error,
        errorInfo
      );
    }

    // Call optional error handler (for analytics, logging services, etc.)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default to ErrorFallback component
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
