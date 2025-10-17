'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export class EnhancedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorInfo });

    if (typeof window !== 'undefined' && (window as any).MONITORING_ENABLED) {
      console.log('[ErrorBoundary] Would send to monitoring service:', {
        error,
        errorInfo,
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            fontFamily: 'sans-serif',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
          }}
        >
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem', color: '#7f1d1d' }}>
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#991b1b' }}>
              Error Details
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#fff',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                color: '#7f1d1d',
              }}
            >
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </details>

          <button
            onClick={this.resetError}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
