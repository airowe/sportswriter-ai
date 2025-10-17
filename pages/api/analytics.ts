import type { NextApiRequest, NextApiResponse } from 'next';
import { readTrainingSamples, readMetadata, calculateMetadata, writeMetadata } from '../../lib/trainingData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const samples = readTrainingSamples();
  const metadata = calculateMetadata(samples);
  writeMetadata(metadata);

  return res.status(200).json(metadata);
}
