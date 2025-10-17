import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { readTrainingSamples, writeTrainingSamples, calculateMetadata, writeMetadata } from '../../lib/trainingData';
import { TrainingSample } from '../../lib/types';

const DATA_FILE = path.join(process.cwd(), 'training-data.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, title, body, author, publishDate } = req.body;
  if (!url || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Save to legacy training-data.json for backward compatibility
  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    data = fileContent ? JSON.parse(fileContent) : [];
  }
  const legacyEntry = { url, title, body, author, publishDate, savedAt: new Date().toISOString() };
  data.push(legacyEntry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  // Also save as training sample in new format
  const samples = readTrainingSamples();
  const prompt = `Write a sports article about: ${title}`;
  const response = typeof body === 'string' ? body : Array.isArray(body) ? body.join('\n\n') : JSON.stringify(body);

  const newSample: TrainingSample = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    prompt,
    response,
    sport: undefined,
    contentType: undefined,
    status: 'draft',
    source: 'imported',
    url,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  samples.push(newSample);
  writeTrainingSamples(samples);

  const metadata = calculateMetadata(samples);
  writeMetadata(metadata);

  res.status(200).json({ success: true, sampleId: newSample.id });
}
