import type { NextApiRequest, NextApiResponse } from 'next';
import { readTrainingSamples, writeTrainingSamples, calculateMetadata, writeMetadata } from '../../../lib/trainingData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const samples = readTrainingSamples();
    const index = samples.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    const updates = req.body;
    samples[index] = {
      ...samples[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeTrainingSamples(samples);

    const metadata = calculateMetadata(samples);
    writeMetadata(metadata);

    return res.status(200).json(samples[index]);
  }

  if (req.method === 'DELETE') {
    const samples = readTrainingSamples();
    const filtered = samples.filter(s => s.id !== id);

    if (filtered.length === samples.length) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    writeTrainingSamples(filtered);

    const metadata = calculateMetadata(filtered);
    writeMetadata(metadata);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
