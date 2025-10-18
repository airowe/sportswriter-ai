#!/usr/bin/env node

import { QueueEvents, Worker } from 'bullmq';

import { getRedisConnectionOptions } from '@/lib/redis';
import { recordJobEvent, updateJobStatus } from '@/lib/jobs';
import {
  CONTENT_QUEUE_NAME,
  FINE_TUNE_EXPORT_JOB,
  type FineTuneExportJobData,
} from './types';
import { processFineTuneExport } from './processors/fineTuneExport';

const concurrency = Number(process.env.JOB_MAX_CONCURRENCY ?? '3');

const worker = new Worker<FineTuneExportJobData>(
  CONTENT_QUEUE_NAME,
  async (job) => {
    if (job.name === FINE_TUNE_EXPORT_JOB) {
      return processFineTuneExport(job);
    }

    throw new Error(`Unsupported job name: ${job.name}`);
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency,
  },
);

console.log(
  `Worker started for ${CONTENT_QUEUE_NAME} with concurrency ${concurrency}`,
);

const queueEvents = new QueueEvents(CONTENT_QUEUE_NAME, {
  connection: getRedisConnectionOptions(),
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  if (!jobId) return;
  const errorMessage = failedReason ?? 'Job failed';
  await updateJobStatus(jobId, 'failed', {
    completedAt: new Date(),
    errorMessage,
  });
  await recordJobEvent(jobId, 'failed', { error: errorMessage });
});

const gracefulShutdown = async () => {
  await queueEvents.close();
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
