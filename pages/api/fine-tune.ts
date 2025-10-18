import {
  createJobRecord,
  updateJobStatus,
  recordJobEvent,
} from '@/lib/jobs';
import { enqueueFineTuneExportJob } from '@/jobs/queues';
import { getLogger, withApiLogging } from '@/lib/logger';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const samples = req.body.samples;
  const requestId = req.headers['x-request-id'];
  const log = getLogger({
    route: 'fine-tune',
    requestId: Array.isArray(requestId) ? requestId[0] : requestId,
  });

  if (!Array.isArray(samples) || samples.length === 0) {
    res.status(400).json({ error: 'Samples array is required' });
    return;
  }

  const jobId = await createJobRecord({
    type: 'fine_tune_export',
    payload: { sampleCount: samples.length },
  });

  try {
    const queueJobId = await enqueueFineTuneExportJob(jobId, { samples });
    log.info({
      message: 'queued_fine_tune_job',
      jobId,
      queueJobId,
      sampleCount: samples.length,
    });
    res
      .status(202)
      .json({
        message: 'Training job enqueued.',
        jobId,
        queueJobId,
      });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to format samples';
    log.error(
      {
        message: 'enqueue_failed',
        error: message,
        jobId,
      },
      'Failed to enqueue fine tune job',
    );
    await updateJobStatus(jobId, 'failed', {
      completedAt: new Date(),
      errorMessage: message,
    });
    await recordJobEvent(jobId, 'failed', { stage: 'enqueue', error: message });
    res
      .status(500)
      .json({ error: 'Failed to create training file', jobId });
  }
}

export default withApiLogging(handler, { name: 'fine-tune' });
