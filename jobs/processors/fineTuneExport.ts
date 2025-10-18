import { Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';

import { formatSamples } from '@/lib/formatSamples';
import { recordJobEvent, updateJobStatus } from '@/lib/jobs';
import { FINE_TUNE_EXPORT_JOB, type FineTuneExportJobData } from '../types';

export async function processFineTuneExport(
  job: Job<FineTuneExportJobData, unknown, typeof FINE_TUNE_EXPORT_JOB>,
) {
  const { jobId, samples } = job.data;

  await updateJobStatus(jobId, 'active', {
    startedAt: new Date(),
  });
  await recordJobEvent(jobId, 'progress', {
    stage: 'formatting',
    totalSamples: samples.length,
  });

  const jsonl = formatSamples(samples);
  const filePath = path.resolve(process.cwd(), 'public', 'training.jsonl');

  await fs.writeFile(filePath, jsonl, 'utf8');

  await updateJobStatus(jobId, 'succeeded', {
    completedAt: new Date(),
    errorMessage: null,
  });
  await recordJobEvent(jobId, 'completed', { path: filePath });

  return { filePath };
}
