import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { withApiMiddleware } from '@/lib/apiMiddleware';
import { ValidationError, AppError } from '@/lib/errors';

const DATA_FILE = path.join(process.cwd(), 'training-data.json');

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', statusCode: 405 } });
  }

  const { url, title, body, author, publishDate } = req.body;
  
  if (!url || !title || !body) {
    throw new ValidationError('Missing required fields: url, title, and body are required', {
      provided: { url: !!url, title: !!title, body: !!body },
    });
  }

  logger.info({ url, titleLength: title.length, bodyLength: body.length }, 'Saving article to training data');

  try {
    let data = [];
    
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      try {
        data = fileContent ? JSON.parse(fileContent) : [];
      } catch (parseError) {
        logger.error({ parseError }, 'Failed to parse existing training data file');
        throw new AppError('Training data file is corrupted. Please contact support.', 500, 'DATA_CORRUPTION');
      }
    }

    const existingEntry = data.find((entry: any) => entry.url === url);
    if (existingEntry) {
      logger.warn({ url }, 'Article already exists in training data');
      throw new ValidationError('This article has already been saved to training data', { url });
    }

    const newEntry = {
      url,
      title,
      body,
      author: author || null,
      publishDate: publishDate || null,
      savedAt: new Date().toISOString(),
    };

    data.push(newEntry);

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      logger.info({ url, totalEntries: data.length }, 'Article saved successfully');
    } catch (writeError) {
      logger.error({ writeError }, 'Failed to write training data file');
      throw new AppError('Failed to save article. Please try again.', 500, 'FILE_WRITE_ERROR');
    }

    res.status(200).json({ success: true, totalEntries: data.length });
  } catch (error) {
    throw error;
  }
});
