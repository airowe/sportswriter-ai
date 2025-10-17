'use client';

import { useEffect } from 'react';

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).MONITORING_ENABLED = !!process.env.NEXT_PUBLIC_MONITORING_DSN;
      
      if ((window as any).MONITORING_ENABLED) {
        console.log('[Monitoring] Client-side monitoring enabled');
      }

      const handleError = (event: ErrorEvent) => {
        console.error('[Unhandled Error]', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        console.error('[Unhandled Promise Rejection]', {
          reason: event.reason,
          promise: event.promise,
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  }, []);

  return <>{children}</>;
}
