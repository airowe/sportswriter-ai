import fs from 'fs';
import path from 'path';
import { TrainingSample, FineTuneMetadata } from './types';

const SAMPLES_FILE = path.join(process.cwd(), 'training-samples.json');
const METADATA_FILE = path.join(process.cwd(), 'fine-tune-metadata.json');

export function readTrainingSamples(): TrainingSample[] {
  if (!fs.existsSync(SAMPLES_FILE)) {
    return [];
  }
  const content = fs.readFileSync(SAMPLES_FILE, 'utf-8');
  return content ? JSON.parse(content) : [];
}

export function writeTrainingSamples(samples: TrainingSample[]): void {
  fs.writeFileSync(SAMPLES_FILE, JSON.stringify(samples, null, 2));
}

export function readMetadata(): FineTuneMetadata {
  if (!fs.existsSync(METADATA_FILE)) {
    return {
      totalSamples: 0,
      samplesBySport: {},
      samplesByContentType: {},
      samplesByStatus: {},
    };
  }
  const content = fs.readFileSync(METADATA_FILE, 'utf-8');
  return JSON.parse(content);
}

export function writeMetadata(metadata: FineTuneMetadata): void {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

export function calculateMetadata(samples: TrainingSample[]): FineTuneMetadata {
  const metadata: FineTuneMetadata = {
    totalSamples: samples.length,
    samplesBySport: {},
    samplesByContentType: {},
    samplesByStatus: {},
  };

  samples.forEach(sample => {
    if (sample.sport) {
      metadata.samplesBySport[sample.sport] = (metadata.samplesBySport[sample.sport] || 0) + 1;
    }
    if (sample.contentType) {
      metadata.samplesByContentType[sample.contentType] = 
        (metadata.samplesByContentType[sample.contentType] || 0) + 1;
    }
    metadata.samplesByStatus[sample.status] = 
      (metadata.samplesByStatus[sample.status] || 0) + 1;
  });

  const existingMetadata = readMetadata();
  metadata.lastFineTuneDate = existingMetadata.lastFineTuneDate;

  return metadata;
}
