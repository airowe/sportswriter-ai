import type { NextApiRequest, NextApiResponse } from 'next';
import { readTrainingSamples, writeTrainingSamples, calculateMetadata, writeMetadata } from '../../lib/trainingData';
import { TrainingSample } from '../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const samples = readTrainingSamples();
    const { sport, contentType, status, source } = req.query;

    let filtered = samples;

    if (sport && sport !== 'all') {
      filtered = filtered.filter(s => s.sport === sport);
    }
    if (contentType && contentType !== 'all') {
      filtered = filtered.filter(s => s.contentType === contentType);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(s => s.status === status);
    }
    if (source && source !== 'all') {
      filtered = filtered.filter(s => s.source === source);
    }

    return res.status(200).json(filtered);
  }

  if (req.method === 'POST') {
    const { prompt, response, sport, contentType, status, source, url } = req.body;

    if (!prompt || !response) {
      return res.status(400).json({ error: 'prompt and response are required' });
    }

    const samples = readTrainingSamples();
    const newSample: TrainingSample = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      prompt,
      response,
      sport,
      contentType,
      status: status || 'draft',
      source: source || 'imported',
      url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    samples.push(newSample);
    writeTrainingSamples(samples);

    const metadata = calculateMetadata(samples);
    writeMetadata(metadata);

    return res.status(201).json(newSample);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
