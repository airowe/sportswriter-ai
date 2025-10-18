import { Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';

import { formatSamples } from '@/lib/formatSamples';
import { recordJobEvent, updateJobStatus } from '@/lib/jobs';
import { getLogger } from '@/lib/logger';
import { FINE_TUNE_EXPORT_JOB, type FineTuneExportJobData } from '../types';

export async function processFineTuneExport(
  job: Job<FineTuneExportJobData, unknown>,
  jobLogger?: ReturnType<typeof getLogger>,
) {
  const { jobId, samples } = job.data;
  const logger =
    jobLogger ??
    getLogger({
      route: 'fine_tune_export',
      jobId,
    });

  await updateJobStatus(jobId, 'active', {
    startedAt: new Date(),
  });
  await recordJobEvent(jobId, 'progress', {
    stage: 'formatting',
    totalSamples: samples.length,
  });
  logger.info({ message: 'formatting_samples', totalSamples: samples.length });

  const jsonl = formatSamples(samples);
  const filePath = path.resolve(process.cwd(), 'public', 'training.jsonl');

  await fs.writeFile(filePath, jsonl, 'utf8');
  logger.info({ message: 'file_written', filePath });

  await updateJobStatus(jobId, 'succeeded', {
    completedAt: new Date(),
    errorMessage: null,
  });
  await recordJobEvent(jobId, 'completed', { path: filePath });
  logger.info({ message: 'job_status_updated', status: 'succeeded' });

  return { filePath };
}
