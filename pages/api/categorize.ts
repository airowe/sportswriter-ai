import type { NextApiRequest, NextApiResponse } from 'next';
import { readTrainingSamples, writeTrainingSamples, calculateMetadata, writeMetadata } from '../../lib/trainingData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids, sport, contentType, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const samples = readTrainingSamples();
  let updatedCount = 0;

  samples.forEach(sample => {
    if (ids.includes(sample.id)) {
      if (sport) sample.sport = sport;
      if (contentType) sample.contentType = contentType;
      if (status) sample.status = status;
      sample.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  });

  writeTrainingSamples(samples);

  const metadata = calculateMetadata(samples);
  writeMetadata(metadata);

  return res.status(200).json({ 
    success: true, 
    updatedCount,
    message: `Updated ${updatedCount} sample(s)` 
  });
}
