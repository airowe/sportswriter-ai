# Logging Overview

## Logger
Structured logging is powered by [pino](https://github.com/pinojs/pino). Use `getLogger()` from `lib/logger.ts` to create a contextual logger. Example:

```ts
import { getLogger } from '@/lib/logger';

const log = getLogger({ route: 'extract-article' });
log.info({ message: 'fetching', url });
```

## API Routes
Wrap API handlers with `withApiLogging(handler, { name: 'route-name' })` to automatically log start, completion, errors, and attach an `x-request-id` header. Inside handlers you can call `getLogger()` and include the request ID from `req.headers['x-request-id']`.

## Background Jobs
BullMQ queue helpers and the worker use the logger to record enqueues, status transitions, and failures. When writing new processors, accept an optional logger parameter or create a contextual one with `getLogger({ component: 'job-worker', jobId })`.

## Configuration
- `LOG_LEVEL` sets the global level (`debug` in development by default, `info` in production).
- `LOG_SERVICE_NAME` overrides the `service` field attached to every log entry.
- In development, logs are rendered via `pino-pretty` for readability; production keeps structured JSON.
