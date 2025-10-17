import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobs, createJob } from '@/lib/queue';
import { JobType, JobStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, type, limit, orderBy, order } = req.query;

      const jobs = await getJobs({
        ...(status && { status: status as JobStatus }),
        ...(type && { type: type as JobType }),
        ...(limit && { limit: parseInt(limit as string, 10) }),
        ...(orderBy && { orderBy: orderBy as any }),
        ...(order && { order: order as 'asc' | 'desc' }),
      });

      res.status(200).json(jobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
      res.status(500).json({ error: message });
    }
  } else if (req.method === 'POST') {
    try {
      const { type, payload, priority, scheduledFor, maxRetries } = req.body;

      if (!type || !payload) {
        return res.status(400).json({ error: 'type and payload are required' });
      }

      const job = await createJob({
        type,
        payload,
        priority,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        maxRetries,
      });

      res.status(201).json(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create job';
      res.status(500).json({ error: message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
