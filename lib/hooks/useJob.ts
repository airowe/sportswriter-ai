'use client';

import { useState, useEffect, useCallback } from 'react';

interface Job {
  id: string;
  type: string;
  status: string;
  payload: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  priority: number;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function useJob(jobId: string | null, pollInterval = 2000) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch job');
      }

      const data = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    fetchJob();

    const interval = setInterval(() => {
      if (job?.status !== 'COMPLETED' && job?.status !== 'FAILED') {
        fetchJob();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, pollInterval, fetchJob, job?.status]);

  const isPending = job?.status === 'PENDING';
  const isProcessing = job?.status === 'PROCESSING';
  const isCompleted = job?.status === 'COMPLETED';
  const isFailed = job?.status === 'FAILED';
  const isFinished = isCompleted || isFailed;

  return {
    job,
    loading,
    error,
    isPending,
    isProcessing,
    isCompleted,
    isFailed,
    isFinished,
    refetch: fetchJob,
  };
}
