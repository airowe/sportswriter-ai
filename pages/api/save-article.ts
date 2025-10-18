import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getLogger, withApiLogging } from '@/lib/logger';

const DATA_FILE = path.join(process.cwd(), 'training-data.json');

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'];
  const log = getLogger({
    route: 'save-article',
    requestId: Array.isArray(requestId) ? requestId[0] : requestId,
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, title, body, author, publishDate } = req.body;
  if (!url || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    data = fileContent ? JSON.parse(fileContent) : [];
  }

  const newEntry = { url, title, body, author, publishDate, savedAt: new Date().toISOString() };
  data.push(newEntry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  log.info({
    message: 'article_saved',
    url,
    totalEntries: data.length,
  });

  res.status(200).json({ success: true });
}

export default withApiLogging(handler, { name: 'save-article' });
