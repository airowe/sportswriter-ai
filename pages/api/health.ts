import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware } from '@/lib/apiMiddleware';

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;

  logger.info('Health check requested');

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    correlationId: context.correlationId,
  });
});
