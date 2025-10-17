import { logger } from './logger';

export interface MonitoringContext {
  user?: {
    id: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

let monitoringInitialized = false;

export function initMonitoring() {
  if (monitoringInitialized) {
    return;
  }

  const dsn = process.env.MONITORING_DSN;

  if (!dsn) {
    logger.info('Monitoring DSN not configured - running without external monitoring');
    return;
  }

  logger.info({ dsn: dsn.substring(0, 20) + '...' }, 'Initializing monitoring service');

  monitoringInitialized = true;
}

export function captureException(error: Error | unknown, context?: MonitoringContext) {
  if (!process.env.MONITORING_DSN) {
    logger.debug({ error, context }, 'Would capture exception to monitoring service (DSN not configured)');
    return;
  }

  logger.error(
    {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      ...context,
    },
    'Capturing exception to monitoring service'
  );
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: MonitoringContext) {
  if (!process.env.MONITORING_DSN) {
    logger.debug({ message, level, context }, 'Would capture message to monitoring service (DSN not configured)');
    return;
  }

  const logLevel = level === 'warning' ? 'warn' : level;
  logger[logLevel]({ message, ...context }, 'Capturing message to monitoring service');
}

export function setMonitoringUser(user: { id: string; email?: string }) {
  if (!process.env.MONITORING_DSN) {
    return;
  }

  logger.debug({ userId: user.id }, 'Setting monitoring user context');
}

export function addMonitoringBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  if (!process.env.MONITORING_DSN) {
    return;
  }

  logger.debug({ message, category, data }, 'Adding monitoring breadcrumb');
}

if (typeof window === 'undefined') {
  initMonitoring();
}
