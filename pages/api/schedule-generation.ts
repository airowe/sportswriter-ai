import type { NextApiRequest, NextApiResponse } from 'next';
import { createJob } from '@/lib/queue';
import { JobType } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, type = 'preview', scheduledFor, priority = 0 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (!scheduledFor) {
      return res.status(400).json({ error: 'scheduledFor is required for scheduled generation' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledFor date' });
    }

    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: 'scheduledFor must be in the future' });
    }

    const normalizedType = typeof type === 'string' ? type.toLowerCase() : 'preview';
    const jobType = normalizedType === 'recap' ? JobType.RECAP_GENERATION : JobType.PREVIEW_GENERATION;

    const job = await createJob({
      type: jobType,
      payload: { prompt },
      scheduledFor: scheduledDate,
      priority,
    });

    res.status(201).json({
      message: 'Generation scheduled successfully',
      jobId: job.id,
      scheduledFor: job.scheduledFor,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule generation';
    res.status(500).json({ error: message });
  }
}
