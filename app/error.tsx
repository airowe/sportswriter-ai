'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Page Error]', {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '600px',
        margin: '2rem auto',
        fontFamily: 'sans-serif',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        backgroundColor: '#fffbeb',
      }}
    >
      <h2 style={{ color: '#d97706', marginBottom: '1rem' }}>
        ⚠️ Page Error
      </h2>
      <p style={{ marginBottom: '1rem', color: '#78350f' }}>
        Something went wrong while loading this page. Please try again.
      </p>
      
      {error.digest && (
        <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '1rem' }}>
          Error ID: {error.digest}
        </p>
      )}

      <details style={{ marginBottom: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#b45309' }}>
          Technical Details
        </summary>
        <pre
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            backgroundColor: '#fff',
            border: '1px solid #fcd34d',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.875rem',
            color: '#78350f',
          }}
        >
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      </details>

      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f59e0b',
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
