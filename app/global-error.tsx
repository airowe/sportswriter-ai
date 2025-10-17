'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            fontFamily: 'sans-serif',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
          }}
        >
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            ⚠️ Application Error
          </h2>
          <p style={{ marginBottom: '1rem', color: '#7f1d1d' }}>
            A critical error occurred. Please refresh the page to continue.
          </p>
          
          {error.digest && (
            <p style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '1rem' }}>
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginRight: '0.5rem',
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Go Home
          </button>
        </div>
      </body>
    </html>
  );
}
