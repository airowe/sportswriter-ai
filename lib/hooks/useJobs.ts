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

interface UseJobsOptions {
  status?: string;
  type?: string;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  pollInterval?: number;
  autoPoll?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    status,
    type,
    limit,
    orderBy,
    order,
    pollInterval = 5000,
    autoPoll = false,
  } = options;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (status) params.append('status', status);
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit.toString());
      if (orderBy) params.append('orderBy', orderBy);
      if (order) params.append('order', order);

      const response = await fetch(`/api/jobs?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, type, limit, orderBy, order]);

  useEffect(() => {
    fetchJobs();

    if (autoPoll) {
      const interval = setInterval(fetchJobs, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchJobs, autoPoll, pollInterval]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  };
}
