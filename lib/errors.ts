import { NextApiResponse } from 'next';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error: ${service} - ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    correlationId?: string;
    details?: any;
  };
}

export function formatErrorResponse(
  error: Error | AppError | unknown,
  correlationId?: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        correlationId,
        details: error.details,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        correlationId,
      },
    };
  }

  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      correlationId,
    },
  };
}

export function handleApiError(
  error: Error | AppError | unknown,
  res: NextApiResponse,
  context?: Record<string, any>
) {
  const correlationId = context?.correlationId;
  const errorResponse = formatErrorResponse(error, correlationId);
  const { statusCode, message, code, details } = errorResponse.error;

  const logContext = {
    ...context,
    error: {
      message,
      code,
      statusCode,
      stack: error instanceof Error ? error.stack : undefined,
      details,
    },
  };

  if (statusCode >= 500) {
    logger.error(logContext, `API Error: ${message}`);
  } else {
    logger.warn(logContext, `API Warning: ${message}`);
  }

  if (process.env.MONITORING_DSN) {
    const { captureException: captureToMonitoring } = require('./monitoring');
    captureToMonitoring(error, {
      extra: logContext,
    });
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const responsePayload: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      correlationId,
      ...(isDevelopment && error instanceof Error ? { details: error.stack } : {}),
    },
  };

  res.status(statusCode).json(responsePayload);
}
