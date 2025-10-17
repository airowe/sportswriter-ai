import type { NextApiRequest, NextApiResponse } from 'next';
import { testMcpServer } from '../../../lib/secureSettings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { id } = req.body || {};
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing server id' });
    }
    const result = await testMcpServer(id);
    if (!result) return res.status(404).json({ error: 'Server not found' });
    return res.status(200).json({ ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}
