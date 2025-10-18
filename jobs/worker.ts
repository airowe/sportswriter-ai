#!/usr/bin/env node

import { QueueEvents, Worker } from 'bullmq';

import { getLogger } from '@/lib/logger';
import { recordJobEvent, updateJobStatus } from '@/lib/jobs';
import { getRedisConnectionOptions } from '@/lib/redis';
import {
  CONTENT_QUEUE_NAME,
  FINE_TUNE_EXPORT_JOB,
  type FineTuneExportJobData,
} from './types';
import { processFineTuneExport } from './processors/fineTuneExport';

const concurrency = Number(process.env.JOB_MAX_CONCURRENCY ?? '3');
const log = getLogger({
  component: 'job-worker',
  queue: CONTENT_QUEUE_NAME,
  concurrency,
});

const worker = new Worker<FineTuneExportJobData>(
  CONTENT_QUEUE_NAME,
  async (job) => {
    const jobLogger = log.child({
      jobId: job.data.jobId,
      queueJobId: job.id,
      jobName: job.name,
    });
    jobLogger.info({ message: 'job_started' });

    if (job.name === FINE_TUNE_EXPORT_JOB) {
      try {
        const result = await processFineTuneExport(job, jobLogger);
        jobLogger.info({ message: 'job_completed' });
        return result;
      } catch (error) {
        jobLogger.error(
          {
            message: 'job_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Job processor threw an error',
        );
        throw error;
      }
    }

    throw new Error(`Unsupported job name: ${job.name}`);
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency,
  },
);
log.info({ message: 'worker_started' });

const queueEvents = new QueueEvents(CONTENT_QUEUE_NAME, {
  connection: getRedisConnectionOptions(),
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  if (!jobId) return;
  const errorMessage = failedReason ?? 'Job failed';
  log.error({ jobId, message: 'queue_event_failed', error: errorMessage });
  await updateJobStatus(jobId, 'failed', {
    completedAt: new Date(),
    errorMessage,
  });
  await recordJobEvent(jobId, 'failed', { error: errorMessage });
});

const gracefulShutdown = async () => {
  log.info({ message: 'worker_shutting_down' });
  await queueEvents.close();
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
