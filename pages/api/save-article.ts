import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'training-data.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  res.status(200).json({ success: true });
}
