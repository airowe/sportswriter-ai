import type { NextApiRequest, NextApiResponse } from 'next';

import { getLogger, withApiLogging } from '@/lib/logger';
import { openai } from '@/lib/openai';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;
  const requestId = req.headers['x-request-id'];
  const log = getLogger({
    route: 'generate',
    requestId: Array.isArray(requestId) ? requestId[0] : requestId,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "ft:gpt-3.5-turbo:yourname:sportswriter:abc123",
      messages: [
        { role: "user", content: prompt },
      ],
    });

    res.status(200).json({ content: completion.choices[0].message.content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error({ err }, 'generate handler failed');
    res.status(500).json({ error: message });
  }
}

export default withApiLogging(handler, { name: 'generate' });
