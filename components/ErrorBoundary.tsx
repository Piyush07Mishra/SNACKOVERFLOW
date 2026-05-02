'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                Please try refreshing the page or contact support if the problem persists.
              </div>
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
export const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ error, reset }) => (
  <div className="text-center p-8">
    <div className="mb-4">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
    </div>
    <h2 className="text-2xl font-semibold mb-2">Application Error</h2>
    <p className="text-muted-foreground mb-4">
      {error?.message || 'The application encountered an unexpected error.'}
    </p>
    <Button onClick={reset} variant="outline">
      <RefreshCw className="w-4 h-4 mr-2" />
      Reload Page
    </Button>
  </div>
);
