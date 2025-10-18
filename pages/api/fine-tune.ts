import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createJobRecord,
  updateJobStatus,
  recordJobEvent,
} from '@/lib/jobs';
import { enqueueFineTuneExportJob } from '@/jobs/queues';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const samples = req.body.samples;

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
