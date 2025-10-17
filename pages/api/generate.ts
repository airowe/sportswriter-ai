import type { NextApiRequest, NextApiResponse } from 'next';
import { createJob } from '@/lib/queue';
import { JobType } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, variant = 'preview', scheduledFor, priority, model, temperature, maxTokens } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const normalizedVariant = typeof variant === 'string' ? variant.toLowerCase() : 'preview';
    const jobType = normalizedVariant === 'recap' ? JobType.RECAP_GENERATION : JobType.PREVIEW_GENERATION;

    const job = await createJob({
      type: jobType,
      payload: {
        prompt,
        model: model ?? null,
        temperature: temperature ?? null,
        maxTokens: maxTokens ?? null,
      },
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      priority: priority ?? 0,
    });

    res.status(202).json({
      message: 'Generation job enqueued',
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create generation job';
    res.status(500).json({ error: message });
  }
}
