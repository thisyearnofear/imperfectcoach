import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  Bug,
  Home,
  Copy,
  CheckCircle,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isOnline: boolean;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  resetTimeWindow?: number; // Reset retry count after this time (ms)
}

interface PerformanceMetrics {
  renderTime: number;
  errorCount: number;
  retryCount: number;
  lastUpdate: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private performanceMetrics: PerformanceMetrics;
  private renderStartTime: number = 0;
  private onlineHandler: () => void;
  private offlineHandler: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
      lastErrorTime: 0,
    };

    this.performanceMetrics = {
      renderTime: 0,
      errorCount: 0,
      retryCount: 0,
      lastUpdate: Date.now(),
    };

    // Network status handlers
    this.onlineHandler = () => {
      this.setState({ isOnline: true });
      if (this.state.hasError) {
        toast.success("Connection restored - you can retry now");
      }
    };

    this.offlineHandler = () => {
      this.setState({ isOnline: false });
      toast.error("Connection lost - some features may not work");
    };
  }

  componentDidMount() {
    this.renderStartTime = performance.now();
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  componentDidUpdate() {
    // Track render performance
    if (this.renderStartTime > 0) {
      const renderTime = performance.now() - this.renderStartTime;
      this.performanceMetrics.renderTime = renderTime;
      this.performanceMetrics.lastUpdate = Date.now();

      // Warn about slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    const { maxRetries = 3, resetTimeWindow = 30000 } = this.props;

    // Reset retry count if enough time has passed
    const timeSinceLastError = now - this.state.lastErrorTime;
    const shouldResetRetries = timeSinceLastError > resetTimeWindow;

    const newRetryCount = shouldResetRetries ? 1 : this.state.retryCount + 1;

    this.setState({
      error,
      errorInfo,
      retryCount: newRetryCount,
      lastErrorTime: now,
    });

    // Update performance metrics
    this.performanceMetrics.errorCount++;
    this.performanceMetrics.retryCount = newRetryCount;

    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error(`Application error occurred (${newRetryCount}/${maxRetries})`, {
      description: error.message,
      duration: 5000,
    });

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error) && newRetryCount < maxRetries) {
      setTimeout(() => {
        this.handleRetry();
      }, Math.min(1000 * Math.pow(2, newRetryCount), 10000)); // Exponential backoff
    }
  }

  shouldAutoRetry = (error: Error): boolean => {
    const retryableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'Failed to fetch',
    ];

    return retryableErrors.some(pattern =>
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
    toast.success("Retrying...");
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      lastErrorTime: 0,
    });
    this.performanceMetrics.retryCount = 0;
    toast.success("Error boundary reset");
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorToClipboard = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: this.performanceMetrics,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      toast.success("Error details copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy error details");
    }
  };

  renderErrorUI = () => {
    const { error, errorInfo, isOnline, retryCount } = this.state;
    const { maxRetries = 3 } = this.props;
    const canRetry = retryCount < maxRetries;

    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Application Error
            </CardTitle>
            <CardDescription>
              Something went wrong while rendering this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="secondary" className="text-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Badge variant="outline">
                <Activity className="h-3 w-3 mr-1" />
                Attempts: {retryCount}/{maxRetries}
              </Badge>
            </div>

            {/* Error Message */}
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{error?.name}: {error?.message}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="text-xs">
                      <summary className="cursor-pointer hover:underline">
                        Technical Details (Development)
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {error?.stack}
                      </pre>
                      {errorInfo?.componentStack && (
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          Component Stack:{errorInfo.componentStack}
                        </pre>
                      )}
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Performance Metrics (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-xs space-y-1">
                    <p><strong>Performance Metrics:</strong></p>
                    <p>Last Render: {this.performanceMetrics.renderTime.toFixed(2)}ms</p>
                    <p>Total Errors: {this.performanceMetrics.errorCount}</p>
                    <p>Last Update: {new Date(this.performanceMetrics.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={!isOnline}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isOnline ? 'Try Again' : 'Waiting for Connection'}
                </Button>
              )}

              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Copy Error Details */}
            <Button
              onClick={this.copyErrorToClipboard}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy Error Details for Support
            </Button>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              {!canRetry && (
                <p className="text-destructive">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </p>
              )}
              <p>
                If this problem persists, try refreshing the page or clearing your browser cache.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorUI();
    }

    // Track render start time
    this.renderStartTime = performance.now();

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for manually triggering error reporting
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Manual error report${context ? ` (${context})` : ''}:`, error);
    toast.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`);

    // You could send to error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  };

  return { handleError };
};

export default ErrorBoundary;
