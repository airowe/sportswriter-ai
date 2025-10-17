import { openai } from '../../lib/openai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware } from '@/lib/apiMiddleware';
import { ValidationError, ExternalServiceError } from '@/lib/errors';

export default withApiMiddleware(async (req, res, context) => {
  const { logger } = context;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', statusCode: 405 } });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    throw new ValidationError('Missing or invalid prompt parameter');
  }

  if (prompt.length < 10) {
    throw new ValidationError('Prompt must be at least 10 characters long');
  }

  if (prompt.length > 5000) {
    throw new ValidationError('Prompt must be less than 5000 characters');
  }

  logger.info({ promptLength: prompt.length }, 'Generating article with OpenAI');

  try {
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_FINETUNED_MODEL || "ft:gpt-3.5-turbo:yourname:sportswriter:abc123",
      messages: [
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    });

    const duration = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      logger.error({ completion }, 'OpenAI returned empty content');
      throw new ExternalServiceError('OpenAI', 'No content was generated. Please try again.');
    }

    logger.info(
      {
        duration,
        promptLength: prompt.length,
        responseLength: content.length,
        model: completion.model,
        usage: completion.usage,
      },
      'Article generated successfully'
    );

    res.status(200).json({
      content,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        duration,
      },
    });
  } catch (err: any) {
    logger.error({ error: err.message, type: err.type, code: err.code }, 'OpenAI API error');

    if (err.status === 401) {
      throw new ExternalServiceError('OpenAI', 'API authentication failed. Please check your API key.');
    }

    if (err.status === 429) {
      throw new ExternalServiceError('OpenAI', 'Rate limit exceeded. Please try again later.');
    }

    if (err.status === 404) {
      throw new ExternalServiceError('OpenAI', 'Model not found. Please check your fine-tuned model configuration.');
    }

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw new ExternalServiceError('OpenAI', 'Request timeout. Please try again.');
    }

    throw new ExternalServiceError('OpenAI', err.message || 'Failed to generate content');
  }
});
