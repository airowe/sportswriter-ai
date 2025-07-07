import { openai } from '@/lib/openai';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "ft:gpt-3.5-turbo:yourname:sportswriter:abc123",
      messages: [
        { role: "user", content: prompt },
      ],
    });

    res.status(200).json({ content: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
