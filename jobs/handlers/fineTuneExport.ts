import path from 'path';
import { promises as fs } from 'fs';
import { ContentJob, JobType } from '@prisma/client';
import { formatSamples } from '@/lib/formatSamples';

interface FineTuneJobPayload {
  samples: { prompt: string; response: string }[];
  exportName?: string;
}

export async function handleFineTuneExport(job: ContentJob) {
  if (job.type !== JobType.FINE_TUNE_EXPORT) {
    throw new Error(`Invalid job type for fine-tune handler: ${job.type}`);
  }

  const payload = job.payload as unknown as FineTuneJobPayload;

  if (!payload?.samples || !Array.isArray(payload.samples)) {
    throw new Error('Fine-tune job payload missing "samples" array');
  }

  if (payload.samples.length === 0) {
    throw new Error('At least one sample is required for fine-tune job');
  }

  const jsonl = formatSamples(payload.samples);
  const fileName = payload.exportName?.trim() || `training-${job.id}.jsonl`;
  const filePath = path.resolve(process.cwd(), 'public', fileName);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, jsonl, 'utf-8');

  return {
    fileName,
    filePath,
    sampleCount: payload.samples.length,
  };
}
