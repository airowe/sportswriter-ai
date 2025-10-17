"use client";
import React, { useState } from 'react';
import { useJobs } from '@/lib/hooks/useJobs';

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { jobs, loading, error, refetch } = useJobs({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    limit: 50,
    orderBy: 'createdAt',
    order: 'desc',
    autoPoll: true,
    pollInterval: 5000,
  });

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Background Jobs</h1>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Filter by Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All</option>
            <option value="FINE_TUNE_EXPORT">Fine-Tune Export</option>
            <option value="PREVIEW_GENERATION">Preview Generation</option>
            <option value="RECAP_GENERATION">Recap Generation</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-400 rounded bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {jobs.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No jobs found
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{formatType(job.type)}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  {job.scheduledFor && (
                    <span className="text-xs text-gray-500">
                      ⏱ Scheduled: {new Date(job.scheduledFor).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                  <div>
                    <strong>ID:</strong> <span className="font-mono text-xs">{job.id}</span>
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}
                  </div>
                  {job.startedAt && (
                    <div>
                      <strong>Started:</strong> {new Date(job.startedAt).toLocaleString()}
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      <strong>Completed:</strong> {new Date(job.completedAt).toLocaleString()}
                    </div>
                  )}
                  {job.retryCount > 0 && (
                    <div>
                      <strong>Retries:</strong> {job.retryCount} / {job.maxRetries}
                    </div>
                  )}
                  {job.priority !== 0 && (
                    <div>
                      <strong>Priority:</strong> {job.priority}
                    </div>
                  )}
                </div>

                {job.status === 'PROCESSING' && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </div>
                )}

                {job.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {job.error}
                  </div>
                )}

                {job.result && job.status === 'COMPLETED' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      View Result
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 border rounded text-sm">
                      <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                        {JSON.stringify(job.result, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                {job.payload && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Payload
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 border rounded text-sm">
                      <pre className="whitespace-pre-wrap overflow-auto max-h-48">
                        {JSON.stringify(job.payload, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
