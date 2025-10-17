"use client";
import React, { useState } from 'react';
import { useJob } from '@/lib/hooks/useJob';
import { useJobs } from '@/lib/hooks/useJobs';

const PREVIEW_TYPE = 'PREVIEW_GENERATION';
const RECAP_TYPE = 'RECAP_GENERATION';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [variant, setVariant] = useState<'preview' | 'recap'>('preview');
  const [jobId, setJobId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { job, isProcessing, isCompleted, isFailed } = useJob(jobId);

  const {
    jobs: previewJobs,
    loading: previewLoading,
    error: previewError,
    refetch: refetchPreviewJobs,
  } = useJobs({
    type: PREVIEW_TYPE,
    status: 'PENDING',
    orderBy: 'scheduledFor',
    order: 'asc',
    limit: 10,
    autoPoll: true,
    pollInterval: 10000,
  });

  const {
    jobs: recapJobs,
    loading: recapLoading,
    error: recapError,
    refetch: refetchRecapJobs,
  } = useJobs({
    type: RECAP_TYPE,
    status: 'PENDING',
    orderBy: 'scheduledFor',
    order: 'asc',
    limit: 10,
    autoPoll: true,
    pollInterval: 10000,
  });

  const handleGenerate = async () => {
    setSubmissionError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, variant }),
      });

      if (res.ok) {
        const data = await res.json();
        setJobId(data.jobId);
        if (variant === 'preview') {
          refetchPreviewJobs();
        } else {
          refetchRecapJobs();
        }
      } else {
        const data = await res.json();
        setSubmissionError(data.error || 'Failed to create generation job');
      }
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Network error');
    }
  };

  const renderScheduledList = (
    title: string,
    items: typeof previewJobs,
    loading: boolean,
    error: string | null,
  ) => (
    <section className="border rounded bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        {loading && <span className="text-sm text-gray-500">Refreshing…</span>}
      </div>
      {error && (
        <div className="mb-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No scheduled jobs</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border border-gray-200 rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{item.status}</span>
                {item.scheduledFor && (
                  <span className="text-xs text-gray-500">
                    Scheduled {new Date(item.scheduledFor).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Job ID: <span className="font-mono">{item.id}</span></p>
              {item.payload?.prompt && (
                <p className="text-sm text-gray-700 mt-1">
                  {item.payload.prompt.length > 140
                    ? `${item.payload.prompt.slice(0, 140)}…`
                    : item.payload.prompt}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Article</h1>
      
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Content Type:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="preview"
              checked={variant === 'preview'}
              onChange={(e) => setVariant(e.target.value as 'preview' | 'recap')}
              className="mr-2"
            />
            Preview
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="recap"
              checked={variant === 'recap'}
              onChange={(e) => setVariant(e.target.value as 'preview' | 'recap')}
              className="mr-2"
            />
            Recap
          </label>
        </div>
      </div>

      <textarea
        className="w-full border p-2 mb-4"
        placeholder="Enter a prompt, e.g. 'Write a recap of Duke vs UNC'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      
      <button 
        onClick={handleGenerate} 
        className="bg-green-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
        disabled={!prompt || isProcessing}
      >
        {isProcessing ? 'Generating...' : 'Generate'}
      </button>

      {submissionError && (
        <div className="mt-4 p-4 border border-red-400 rounded bg-red-50 text-red-700">
          {submissionError}
        </div>
      )}

      {job && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">Generation Status</h3>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Type:</strong> {job.type.replace('_', ' ')}</p>
          <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}</p>
          
          {isProcessing && (
            <div className="mt-2 text-blue-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Generating content...</span>
              </div>
            </div>
          )}
          
          {isCompleted && job.result && (
            <div className="mt-4">
              <p className="text-green-600 mb-2">✓ Generation completed successfully!</p>
              <div className="mt-2 p-4 border bg-white rounded">
                <h4 className="font-semibold mb-2">Generated Content:</h4>
                <div className="whitespace-pre-wrap">{job.result.content}</div>
              </div>
              {job.result.usage && (
                <div className="mt-2 text-sm text-gray-600">
                  Tokens used: {job.result.usage.total_tokens}
                </div>
              )}
            </div>
          )}
          
          {isFailed && (
            <div className="mt-2 text-red-600">
              <p>✗ Generation failed</p>
              {job.error && <p className="text-sm">{job.error}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold">Scheduled Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderScheduledList('Scheduled Previews', previewJobs, previewLoading, previewError)}
          {renderScheduledList('Scheduled Recaps', recapJobs, recapLoading, recapError)}
        </div>
      </div>
    </div>
  );
}
