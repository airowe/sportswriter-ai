import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob, updateJobStatus, deleteJob } from '@/lib/queue';
import { JobStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
  } = req;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job id' });
  }

  try {
    if (method === 'GET') {
      const job = await getJob(id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.status(200).json(job);
    }

    if (method === 'PATCH') {
      const { status, result, error } = req.body;

      if (!status || !Object.values(JobStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const job = await updateJobStatus(id, status, { result, error });
      return res.status(200).json(job);
    }

    if (method === 'DELETE') {
      await deleteJob(id);
      return res.status(204).end();
    }

    res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({ error: message });
  }
}
