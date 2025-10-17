import { ContentJob, JobType } from '@prisma/client';
import { openai } from '@/lib/openai';

interface GenerationJobPayload {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function handlePreviewGeneration(job: ContentJob) {
  if (job.type !== JobType.PREVIEW_GENERATION) {
    throw new Error(`Invalid job type for preview handler: ${job.type}`);
  }

  const payload = job.payload as unknown as GenerationJobPayload;

  if (!payload?.prompt) {
    throw new Error('Preview generation job payload missing "prompt"');
  }

  const model = payload.model || 'ft:gpt-3.5-turbo:yourname:sportswriter:abc123';

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: payload.prompt },
    ],
    temperature: payload.temperature ?? 0.7,
    max_tokens: payload.maxTokens ?? 1000,
  });

  const content = completion.choices[0].message.content;

  return {
    prompt: payload.prompt,
    content,
    model,
    usage: completion.usage,
  };
}

export async function handleRecapGeneration(job: ContentJob) {
  if (job.type !== JobType.RECAP_GENERATION) {
    throw new Error(`Invalid job type for recap handler: ${job.type}`);
  }

  const payload = job.payload as unknown as GenerationJobPayload;

  if (!payload?.prompt) {
    throw new Error('Recap generation job payload missing "prompt"');
  }

  const model = payload.model || 'ft:gpt-3.5-turbo:yourname:sportswriter:abc123';

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: payload.prompt },
    ],
    temperature: payload.temperature ?? 0.7,
    max_tokens: payload.maxTokens ?? 2000,
  });

  const content = completion.choices[0].message.content;

  return {
    prompt: payload.prompt,
    content,
    model,
    usage: completion.usage,
  };
}
