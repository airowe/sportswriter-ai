import React from 'react';

export class ErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red' }}>Error: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
