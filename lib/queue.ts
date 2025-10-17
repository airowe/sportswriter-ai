import { prisma } from './prisma';
import { JobType, JobStatus } from '@prisma/client';

export interface JobPayload {
  [key: string]: any;
}

import type { Prisma } from '@prisma/client';

export interface CreateJobOptions {
  type: JobType;
  payload: JobPayload;
  priority?: number;
  scheduledFor?: Date;
  maxRetries?: number;
}

export interface UpdateJobOptions {
  result?: Prisma.JsonValue;
  error?: string | null;
  retryCount?: number;
  scheduledFor?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  payload?: JobPayload;
}

export async function createJob(options: CreateJobOptions) {
  return prisma.contentJob.create({
    data: {
      type: options.type,
      payload: options.payload as Prisma.JsonValue,
      priority: options.priority ?? 0,
      scheduledFor: options.scheduledFor ?? null,
      maxRetries: options.maxRetries ?? 3,
    },
  });
}

export async function getJob(id: string) {
  return prisma.contentJob.findUnique({
    where: { id },
  });
}

export async function getJobs(params: {
  status?: JobStatus;
  type?: JobType;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'priority' | 'scheduledFor' | 'startedAt';
  order?: 'asc' | 'desc';
}) {
  const {
    status,
    type,
    limit = 50,
    orderBy = 'createdAt',
    order = 'desc',
  } = params;

  return prisma.contentJob.findMany({
    where: {
      ...(status && { status }),
      ...(type && { type }),
    },
    orderBy: {
      [orderBy]: order,
    },
    take: limit,
  });
}

export async function claimNextJob() {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const job = await tx.contentJob.findFirst({
      where: {
        status: JobStatus.PENDING,
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!job) {
      return null;
    }

    const claimed = await tx.contentJob.updateMany({
      where: { id: job.id, status: JobStatus.PENDING },
      data: {
        status: JobStatus.PROCESSING,
        startedAt: now,
        updatedAt: now,
        error: null,
      },
    });

    if (claimed === 0) {
      return null;
    }

    return tx.contentJob.findUnique({
      where: { id: job.id },
    });
  });
}

export async function updateJobStatus(id: string, status: JobStatus, data: UpdateJobOptions = {}) {
  const updateData: Prisma.ContentJobUpdateInput = {
    status,
    updatedAt: new Date(),
  };

  if (data.result !== undefined) {
    updateData.result = data.result;
  }

  if (data.error !== undefined) {
    updateData.error = data.error;
  }

  if (data.retryCount !== undefined) {
    updateData.retryCount = data.retryCount;
  }

  if (data.scheduledFor !== undefined) {
    updateData.scheduledFor = data.scheduledFor;
  }

  if (data.startedAt !== undefined) {
    updateData.startedAt = data.startedAt;
  }

  if (data.completedAt !== undefined) {
    updateData.completedAt = data.completedAt;
  }

  if (data.payload !== undefined) {
    updateData.payload = data.payload as Prisma.JsonValue;
  }

  if (status === JobStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }

  if (status === JobStatus.PROCESSING) {
    updateData.startedAt = data.startedAt ?? new Date();
  }

  return prisma.contentJob.update({
    where: { id },
    data: updateData,
  });
}

export async function retryJob(id: string) {
  const job = await prisma.contentJob.findUnique({
    where: { id },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.retryCount >= job.maxRetries) {
    throw new Error('Job has exceeded maximum retry attempts');
  }

  return prisma.contentJob.update({
    where: { id },
    data: {
      status: JobStatus.PENDING,
      retryCount: job.retryCount + 1,
      startedAt: null,
      error: null,
    },
  });
}

export async function deleteJob(id: string) {
  return prisma.contentJob.delete({
    where: { id },
  });
}
