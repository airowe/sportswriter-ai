import { eq } from 'drizzle-orm';

import {
  contentJobs,
  jobEvents,
  jobEventTypeEnumValues,
  jobStatusEnumValues,
  jobTypeEnumValues,
} from '@/drizzle/schema';
import { db } from '@/lib/db';

type JobType = (typeof jobTypeEnumValues)[number];
type JobStatus = (typeof jobStatusEnumValues)[number];
type JobEventType = (typeof jobEventTypeEnumValues)[number];

export async function createJobRecord(input: {
  type: JobType;
  payload: Record<string, unknown>;
  status?: JobStatus;
}): Promise<string> {
  const [job] = await db
    .insert(contentJobs)
    .values({
      type: input.type,
      payload: input.payload,
      status: input.status ?? 'pending',
    })
    .returning({ id: contentJobs.id });

  return job.id;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  fields: Partial<{
    queueJobId: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    errorMessage: string | null;
  }> = {},
) {
  await db
    .update(contentJobs)
    .set({
      status,
      ...fields,
    })
    .where(eq(contentJobs.id, jobId));
}

export async function recordJobEvent(
  jobId: string,
  eventType: JobEventType,
  data: Record<string, unknown> = {},
) {
  await db.insert(jobEvents).values({
    jobId,
    eventType,
    data,
  });
}

export async function getJob(jobId: string) {
  return db.query.contentJobs.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, jobId);
    },
  });
}
