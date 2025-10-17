import type { NextApiRequest, NextApiResponse } from 'next';
import { handleApiError } from './errors';
import { generateCorrelationId, getCorrelationIdFromHeaders } from './correlation';
import { createLogger } from './logger';

export interface ApiRequestContext {
  correlationId: string;
  logger: ReturnType<typeof createLogger>;
  startTime: number;
}

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: ApiRequestContext
) => Promise<void> | void;

export function withApiMiddleware(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const correlationId = getCorrelationIdFromHeaders(req.headers) || generateCorrelationId();
    
    const requestLogger = createLogger({
      correlationId,
      method: req.method,
      url: req.url,
    });

    res.setHeader('x-correlation-id', correlationId);

    requestLogger.info(
      {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
      },
      'Incoming API request'
    );

    const context: ApiRequestContext = {
      correlationId,
      logger: requestLogger,
      startTime,
    };

    try {
      await handler(req, res, context);

      const duration = Date.now() - startTime;
      requestLogger.info(
        {
          statusCode: res.statusCode,
          duration,
        },
        `API request completed in ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.error(
        {
          error,
          duration,
        },
        'API request failed'
      );
      
      handleApiError(error, res, context);
    }
  };
}
