import type { NextApiRequest, NextApiResponse } from 'next';
import { formatSamples } from '../../lib/formatSamples';
import fs from 'fs';
import path from 'path';
import { withApiMiddleware } from '@/lib/apiMiddleware';
import { ValidationError, AppError } from '@/lib/errors';

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', statusCode: 405 } });
  }

  const { samples } = req.body;

  if (!samples || !Array.isArray(samples)) {
    throw new ValidationError('Invalid request: samples must be an array');
  }

  if (samples.length === 0) {
    throw new ValidationError('At least one sample is required');
  }

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.prompt || !sample.response) {
      throw new ValidationError(`Sample at index ${i} is missing prompt or response`, {
        index: i,
        hasPrompt: !!sample.prompt,
        hasResponse: !!sample.response,
      });
    }
  }

  logger.info({ sampleCount: samples.length }, 'Formatting training samples');

  try {
    const jsonl = formatSamples(samples);
    const filePath = path.resolve(process.cwd(), 'public', 'training.jsonl');

    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      logger.info('Creating public directory');
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(filePath, jsonl, 'utf-8');
    
    logger.info({ filePath, sampleCount: samples.length, fileSize: jsonl.length }, 'Training data formatted successfully');

    res.status(200).json({
      message: 'Training data formatted successfully',
      path: filePath,
      sampleCount: samples.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to write training data file');
    throw new AppError('Failed to save training data. Please try again.', 500, 'FILE_WRITE_ERROR');
  }
});
