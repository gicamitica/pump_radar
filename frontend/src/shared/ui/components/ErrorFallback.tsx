import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Card } from '@/shared/ui/shadcn/components/ui/card';

interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
  /** Show full error details (stack trace) - only in development */
  showDetails?: boolean;
}

/**
 * ErrorFallback - User-friendly error display component
 * 
 * Shows a friendly error message with options to retry or go home.
 * In development mode, also shows error details for debugging.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onReset,
  showDetails = import.meta.env.DEV,
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>

        {/* Error details - development only */}
        {showDetails && error && (
          <div className="mb-6 p-4 bg-muted rounded-lg text-left overflow-auto max-h-48">
            <p className="font-mono text-sm text-destructive font-medium mb-2">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onReset && (
            <Button onClick={onReset} variant="default" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          <Button onClick={handleGoHome} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Go to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ErrorFallback;
