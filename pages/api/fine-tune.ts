import type { NextApiRequest, NextApiResponse } from 'next';
import { createJob } from '@/lib/queue';
import { JobType } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { samples, exportName, priority } = req.body;

    if (!samples || !Array.isArray(samples)) {
      return res.status(400).json({ error: 'samples array is required' });
    }

    const job = await createJob({
      type: JobType.FINE_TUNE_EXPORT,
      payload: { samples, exportName },
      priority: priority ?? 0,
    });

    res.status(202).json({
      message: 'Fine-tune export job created',
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create fine-tune job';
    res.status(500).json({ error: message });
  }
}
