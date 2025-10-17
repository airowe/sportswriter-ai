# Logging, Observability, and Error Handling

This document describes the logging, observability, and error handling infrastructure in the Sportswriter AI application.

## Overview

The application implements comprehensive logging and error handling with:

- **Structured logging** using Pino
- **Correlation IDs** for request tracing
- **Standardized error responses** with consistent shapes
- **Client-side toast notifications** for user feedback
- **Enhanced error boundaries** for graceful error handling
- **Monitoring hooks** ready for production observability services

## Architecture

### Server-Side (API Routes)

#### Structured Logger (`lib/logger.ts`)

The centralized logger uses Pino for high-performance structured logging:

```typescript
import { logger, createLogger } from '@/lib/logger';

// Use the default logger
logger.info('Application started');

// Create a child logger with context
const requestLogger = createLogger({ userId: '123', action: 'login' });
requestLogger.info('User logged in');
```

Features:
- JSON-formatted logs in production
- Pretty-printed logs in development
- Configurable log levels via `LOG_LEVEL` environment variable
- Automatic environment and timestamp metadata

#### API Middleware (`lib/apiMiddleware.ts`)

All API routes are wrapped with `withApiMiddleware` which provides:

- **Correlation ID generation/propagation** via `x-correlation-id` header
- **Request logging** with method, URL, query parameters
- **Response logging** with status code and duration
- **Automatic error handling** with proper error formatting

Example usage:

```typescript
import { withApiMiddleware } from '@/lib/apiMiddleware';

export default withApiMiddleware(async (req, res, context) => {
  const { logger, correlationId } = context;
  
  logger.info({ userId: req.body.userId }, 'Processing request');
  
  // Your handler logic here
  
  res.status(200).json({ success: true });
});
```

#### Error Classes (`lib/errors.ts`)

Standardized error classes for different scenarios:

- `AppError` - Base error class with status code and error code
- `ValidationError` - 400 errors for invalid input
- `UnauthorizedError` - 401 errors for authentication failures
- `NotFoundError` - 404 errors for missing resources
- `ExternalServiceError` - 502 errors for third-party service failures

Example usage:

```typescript
import { ValidationError, ExternalServiceError } from '@/lib/errors';

// Validation error
if (!email) {
  throw new ValidationError('Email is required');
}

// External service error
if (apiCallFailed) {
  throw new ExternalServiceError('OpenAI', 'Rate limit exceeded');
}
```

#### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "correlationId": "req_1234567890_abc123",
    "details": {}
  }
}
```

### Client-Side

#### Client Logger (`lib/clientLogger.ts`)

Provides logging and automatic toast notifications:

```typescript
import { ClientLogger } from '@/lib/clientLogger';

// Error with toast notification
ClientLogger.error('Failed to save article', { url, correlationId });

// Success with toast notification
ClientLogger.success('Article saved!');

// Warning without toast
ClientLogger.warn('Cache miss', { key: 'user-data' });

// Info without toast
ClientLogger.info('Page viewed', { page: '/generate' });
```

#### Fetch with Error Handling (`lib/clientLogger.ts`)

Wrapper around `fetch` that handles errors and displays toast notifications:

```typescript
import { fetchWithErrorHandling } from '@/lib/clientLogger';

try {
  const data = await fetchWithErrorHandling('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  
  // Success - toast shown automatically
  console.log(data);
} catch (error) {
  // Error - toast shown automatically with correlation ID
  console.error(error);
}
```

#### Enhanced Error Boundary (`app/EnhancedErrorBoundary.tsx`)

Catches React component errors and displays user-friendly error UI:

- Logs errors to console with full context
- Shows collapsible error details for debugging
- Provides "Try Again" button to reset error state
- Ready for integration with monitoring services

### Correlation IDs

Every API request gets a unique correlation ID that:

- Is generated on the server if not provided by the client
- Is returned in the `x-correlation-id` response header
- Is included in all log entries for that request
- Is shown in error messages and toasts
- Can be used to trace a request through the entire system

Format: `req_<timestamp>_<random_hex>`

Example: `req_1697500800000_a1b2c3d4e5f6g7h8`

## Configuration

### Environment Variables

```bash
# Logging level (debug, info, warn, error)
LOG_LEVEL=info

# Node environment (development, production)
NODE_ENV=production

# Optional: External monitoring service DSN
MONITORING_DSN=https://your-monitoring-service.com/dsn
```

### Log Levels

- `debug` - Detailed information for debugging (only in development)
- `info` - General informational messages
- `warn` - Warning messages that don't prevent operation
- `error` - Error messages for failures

## Monitoring Integration

The application is ready for integration with external monitoring services like Sentry, DataDog, or LogRocket.

To enable:

1. Set the `MONITORING_DSN` environment variable
2. Implement the `captureException` function in `lib/errors.ts`
3. Errors will automatically be sent to your monitoring service

Example integration with Sentry:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.MONITORING_DSN,
  environment: process.env.NODE_ENV,
});

function captureException(error: unknown, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}
```

## Best Practices

### API Routes

1. Always use `withApiMiddleware` for consistent logging and error handling
2. Use the provided `logger` from context for all logging
3. Throw specific error types (ValidationError, etc.) instead of generic Error
4. Log important operations with relevant context
5. Include timing information for performance-sensitive operations

Example:

```typescript
export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;
  
  logger.info({ operation: 'fetchUser' }, 'Starting user fetch');
  
  const startTime = Date.now();
  const user = await fetchUser(req.body.userId);
  const duration = Date.now() - startTime;
  
  logger.info({ userId: user.id, duration }, 'User fetched successfully');
  
  res.status(200).json(user);
});
```

### Client Components

1. Use `fetchWithErrorHandling` for API calls
2. Use `ClientLogger` for user feedback
3. Handle loading and error states in UI
4. Don't show technical error details to users

Example:

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    const result = await fetchWithErrorHandling('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    ClientLogger.success('Operation completed!');
  } catch (error) {
    // Error toast already shown by fetchWithErrorHandling
  } finally {
    setLoading(false);
  }
};
```

## Troubleshooting

### Finding Related Logs

Use correlation IDs to find all logs related to a specific request:

```bash
# In development (pretty logs)
grep "req_1697500800000_a1b2c3d4" logs/app.log

# In production (JSON logs)
cat logs/app.log | jq 'select(.correlationId == "req_1697500800000_a1b2c3d4")'
```

### Common Issues

**Problem**: Logs not appearing in console

**Solution**: Check `LOG_LEVEL` environment variable. Set to `debug` for maximum verbosity.

---

**Problem**: Correlation IDs not appearing in client logs

**Solution**: Check browser network tab for `x-correlation-id` header in API responses.

---

**Problem**: Toast notifications not showing

**Solution**: Verify `ToastProvider` is included in the root layout.

## Future Enhancements

- [ ] Implement log aggregation service integration
- [ ] Add performance monitoring and metrics
- [ ] Implement rate limiting with logging
- [ ] Add audit logging for sensitive operations
- [ ] Implement log retention policies
- [ ] Add distributed tracing for microservices
