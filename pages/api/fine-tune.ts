import type { NextApiRequest, NextApiResponse } from 'next';
import { formatSamples } from '../../lib/formatSamples';
import { readTrainingSamples, readMetadata, writeMetadata } from '../../lib/trainingData';
import { TrainingSample } from '../../lib/types';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { samples, sport, contentType, status, useFilters } = req.body;

  let samplesToFormat: TrainingSample[] | { prompt: string; response: string }[];

  if (useFilters) {
    // Load from training-samples.json and filter
    let allSamples = readTrainingSamples();

    if (sport && sport !== 'all') {
      allSamples = allSamples.filter(s => s.sport === sport);
    }
    if (contentType && contentType !== 'all') {
      allSamples = allSamples.filter(s => s.contentType === contentType);
    }
    if (status && status !== 'all') {
      allSamples = allSamples.filter(s => s.status === status);
    }

    samplesToFormat = allSamples;
  } else {
    // Use provided samples (legacy behavior)
    samplesToFormat = samples || [];
  }

  if (samplesToFormat.length === 0) {
    return res.status(400).json({ error: 'No samples to format' });
  }

  const jsonl = formatSamples(samplesToFormat);
  const filePath = path.resolve(process.cwd(), 'public', 'training.jsonl');
  
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  
  fs.writeFileSync(filePath, jsonl);

  // Update metadata with fine-tune date
  const metadata = readMetadata();
  metadata.lastFineTuneDate = new Date().toISOString();
  writeMetadata(metadata);

  res.status(200).json({ 
    message: 'Training data formatted.', 
    path: filePath,
    sampleCount: samplesToFormat.length 
  });
}
