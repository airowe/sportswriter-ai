import { randomUUID } from 'crypto';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import pino from 'pino';

const level =
  process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  base: {
    service: process.env.LOG_SERVICE_NAME ?? 'sportswriter-ai',
    env: process.env.NODE_ENV,
  },
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true,
          },
        },
});

export type LogFields = Record<string, unknown>;

export function getLogger(context?: LogFields) {
  return context ? logger.child(context) : logger;
}

export { logger };

const REQUEST_ID_HEADER = 'x-request-id';

export function withApiLogging(
  handler: NextApiHandler,
  options?: { name?: string },
): NextApiHandler {
  const routeName = options?.name ?? handler.name ?? 'api-route';

  return async function loggedHandler(
    req: NextApiRequest,
    res: NextApiResponse,
  ): Promise<void> {
    const startedAt = Date.now();
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    const apiLogger = getLogger({
      route: routeName,
      requestId,
      method: req.method,
      url: req.url,
    });

    apiLogger.info({ message: 'request_started' });

    try {
      await handler(req, res);
      const durationMs = Date.now() - startedAt;
      apiLogger.info({ message: 'request_completed', statusCode: res.statusCode, durationMs });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      apiLogger.error(
        {
          message: 'request_failed',
          durationMs,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'API handler threw an error',
      );
      res
        .status(500)
        .json({ error: 'Internal server error', requestId });
    }
  };
}
