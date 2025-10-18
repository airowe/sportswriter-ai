import { Queue } from 'bullmq';

import { getLogger } from '@/lib/logger';
import { getRedisConnectionOptions } from '@/lib/redis';
import {
  CONTENT_QUEUE_NAME,
  FINE_TUNE_EXPORT_JOB,
  type FineTuneExportJobData,
} from './types';
import { recordJobEvent, updateJobStatus } from '@/lib/jobs';

const defaultAttempts = Number(process.env.JOB_DEFAULT_ATTEMPTS ?? '3');
const removeOnCompleteCount = Number(process.env.JOB_REMOVE_ON_COMPLETE ?? '100');
const removeOnFailCount = Number(process.env.JOB_REMOVE_ON_FAIL ?? '100');
const log = getLogger({
  component: 'queue',
  queue: CONTENT_QUEUE_NAME,
});

declare global {
  // eslint-disable-next-line no-var
  var __contentQueue:
    | Queue<FineTuneExportJobData, unknown, typeof FINE_TUNE_EXPORT_JOB>
    | undefined;
}

function createQueue() {
  return new Queue<FineTuneExportJobData, unknown, typeof FINE_TUNE_EXPORT_JOB>(
    CONTENT_QUEUE_NAME,
    {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: defaultAttempts,
        backoff: {
          type: 'exponential',
          delay: 1500,
        },
        removeOnComplete: {
          count: removeOnCompleteCount,
        },
        removeOnFail: {
          count: removeOnFailCount,
        },
      },
    },
  );
}

export const contentQueue =
  globalThis.__contentQueue ?? createQueue();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__contentQueue = contentQueue;
}

export async function enqueueFineTuneExportJob(
  jobId: string,
  data: Omit<FineTuneExportJobData, 'jobId'>,
) {
  const job = await contentQueue.add(FINE_TUNE_EXPORT_JOB, { jobId, ...data });
  log.info({
    message: 'job_enqueued',
    jobId,
    queueJobId: job.id,
    jobName: FINE_TUNE_EXPORT_JOB,
    sampleCount: data.samples.length,
  });

  await updateJobStatus(jobId, 'queued', {
    queueJobId: job.id,
  });
  await recordJobEvent(jobId, 'enqueued', {
    queueJobId: job.id,
    sampleCount: data.samples.length,
  });

  return job.id;
}
