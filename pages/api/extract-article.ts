import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { withApiMiddleware } from '@/lib/apiMiddleware';
import { ValidationError, ExternalServiceError } from '@/lib/errors';

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', statusCode: 405 } });
  }

  const { url } = req.body;

  if (!url) {
    throw new ValidationError('Missing URL parameter');
  }

  if (typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
    throw new ValidationError('Invalid URL format. Must be a valid HTTP/HTTPS URL');
  }

  logger.info({ url }, 'Extracting article from URL');

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SportswriterAI/1.0)',
      },
    });

    logger.debug({ statusCode: response.status, contentLength: response.data.length }, 'Article fetched successfully');

    const $ = cheerio.load(response.data);

    const title = $('h1').first().text().trim();
    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    let author =
      $('meta[name="author"]').attr('content') ||
      $('[itemprop="author"], .author, .byline').first().text().trim() ||
      '';
    let publishDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="pubdate"]').attr('content') ||
      $('time').first().attr('datetime') ||
      $('time').first().text().trim() ||
      '';

    const body = paragraphs.join('\n\n');

    if (!title || !body) {
      logger.warn({ url, hasTitle: !!title, hasBody: !!body }, 'Extracted content is incomplete');
      throw new ValidationError('Could not extract article content. The page may not contain a valid article.');
    }

    logger.info({ url, titleLength: title.length, bodyLength: body.length, author, publishDate }, 'Article extracted successfully');

    res.status(200).json({ title, body, author, publishDate });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error({ url, error: error.message, code: error.code }, 'Failed to fetch article');
      
      if (error.code === 'ECONNABORTED') {
        throw new ExternalServiceError(url, 'Request timeout - the server took too long to respond');
      }
      
      if (error.response) {
        throw new ExternalServiceError(url, `Server responded with status ${error.response.status}`, {
          status: error.response.status,
        });
      }
      
      throw new ExternalServiceError(url, 'Failed to fetch article. Please check the URL and try again.');
    }
    throw error;
  }
});