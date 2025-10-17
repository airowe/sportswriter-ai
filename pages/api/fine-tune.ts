import type { NextApiRequest, NextApiResponse } from 'next';
import { formatSamples } from '../../lib/formatSamples';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const samples = req.body.samples;

  const jsonl = formatSamples(samples);
  const filePath = path.resolve(process.cwd(), 'public', 'training.jsonl');
  fs.writeFileSync(filePath, jsonl);

  res.status(200).json({ message: 'Training data formatted.', path: filePath });
}
