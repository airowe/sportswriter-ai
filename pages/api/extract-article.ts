import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getLogger, withApiLogging } from '@/lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  const requestId = req.headers['x-request-id'];
  const log = getLogger({
    route: 'extract-article',
    requestId: Array.isArray(requestId) ? requestId[0] : requestId,
  });

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract common article parts - tweak as needed
    const title = $('h1').first().text().trim();
    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    // Metadata extraction
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

    res.status(200).json({ title, body, author, publishDate });
  } catch (error: Error | unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    log.error({ error: detail }, 'article extraction failed');
    res.status(500).json({ error: 'Failed to extract article', detail });
  }
}

export default withApiLogging(handler, { name: 'extract-article' });
