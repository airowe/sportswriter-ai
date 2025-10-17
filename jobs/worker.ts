import 'dotenv/config';
import { JobType, JobStatus } from '@prisma/client';
import { claimNextJob, updateJobStatus } from '../lib/queue';
import { handleFineTuneExport } from './handlers/fineTuneExport';
import { handlePreviewGeneration, handleRecapGeneration } from './handlers/generation';
import { prisma } from '../lib/prisma';

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_ERRORS = 5;

let isShuttingDown = false;
let consecutiveErrors = 0;

async function processJob() {
  const job = await claimNextJob();

  if (!job) {
    return false;
  }

  console.log(`[Worker] Processing job ${job.id} (type: ${job.type}, retry: ${job.retryCount})`);

  try {
    let result;

    switch (job.type) {
      case JobType.FINE_TUNE_EXPORT:
        result = await handleFineTuneExport(job);
        break;

      case JobType.PREVIEW_GENERATION:
        result = await handlePreviewGeneration(job);
        break;

      case JobType.RECAP_GENERATION:
        result = await handleRecapGeneration(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await updateJobStatus(job.id, JobStatus.COMPLETED, { result });
    console.log(`[Worker] Job ${job.id} completed successfully`);
    consecutiveErrors = 0;
    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker] Job ${job.id} failed:`, errorMessage);

    if (job.retryCount + 1 <= job.maxRetries) {
      const attempt = job.retryCount + 1;
      console.log(`[Worker] Job ${job.id} will be retried (attempt ${attempt}/${job.maxRetries})`);
      const backoffDelay = Math.min(1000 * Math.pow(2, job.retryCount), 30000);
      const nextAttempt = new Date(Date.now() + backoffDelay);

      await updateJobStatus(job.id, JobStatus.PENDING, {
        error: errorMessage,
        retryCount: attempt,
        scheduledFor: nextAttempt,
        startedAt: null,
      });
    } else {
      console.log(`[Worker] Job ${job.id} exceeded max retries, marking as failed`);
      await updateJobStatus(job.id, JobStatus.FAILED, { error: errorMessage });
    }

    return true;
  }
}

async function runWorker() {
  console.log('[Worker] Starting background job worker...');

  while (!isShuttingDown) {
    try {
      const processed = await processJob();

      if (!processed) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      consecutiveErrors = 0;

    } catch (error) {
      consecutiveErrors++;
      console.error(`[Worker] Unexpected error in worker loop (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('[Worker] Too many consecutive errors, shutting down');
        process.exit(1);
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  console.log('[Worker] Worker shut down gracefully');
}

function handleShutdown(signal: string) {
  console.log(`[Worker] Received ${signal}, shutting down gracefully...`);
  isShuttingDown = true;

  setTimeout(() => {
    console.error('[Worker] Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

runWorker().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
