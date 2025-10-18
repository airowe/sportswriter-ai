"use client";

import React, { useMemo, useState } from 'react';

import {
  PlusIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/solid';

import { Spinner } from '../components/Spinner';

type Sample = {
  prompt: string;
  response: string;
};

export default function UploadPage() {
  const [samples, setSamples] = useState<Sample[]>([{ prompt: '', response: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (index: number, field: keyof Sample, value: string) => {
    setSamples((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSample = () => {
    setSamples((prev) => [...prev, { prompt: '', response: '' }]);
  };

  const handleUpload = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setJobId(null);

    try {
      const res = await fetch('/api/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to queue fine-tune job');
      }

      setSuccess(true);
      setJobId(data.jobId ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to queue fine-tune job';
      setError(message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const canSubmit = useMemo(
    () =>
      samples.some(
        (sample) => sample.prompt.trim() && sample.response.trim(),
      ),
    [samples],
  );

  const jobStatusMessage = success
    ? jobId
      ? `Job ${jobId} queued for fine-tune export.`
      : 'Job queued for fine-tune export.'
    : null;

  return (
    <div className="rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <DocumentArrowUpIcon className="h-6 w-6 text-blue-500" />
        Upload Training Data
      </h1>

      <div className="space-y-6">
        {samples.map((sample, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <textarea
              className="rounded border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Prompt"
              value={sample.prompt}
              onChange={(event) =>
                handleChange(index, 'prompt', event.target.value)
              }
              rows={2}
            />
            <label className="text-sm font-medium text-gray-700">Response</label>
            <textarea
              className="rounded border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Your Article Response"
              value={sample.response}
              onChange={(event) =>
                handleChange(index, 'response', event.target.value)
              }
              rows={3}
            />
          </div>
        ))}

        <button
          type="button"
          className="flex items-center gap-2 rounded bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
          onClick={handleAddSample}
        >
          <PlusIcon className="h-4 w-4" />
          Add Sample
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={handleUpload}
          className="relative rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
          disabled={loading || !canSubmit}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-5 w-5" />
              Uploading...
            </span>
          ) : success ? (
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              Queued!
            </span>
          ) : (
            'Submit for Fine-Tuning'
          )}
        </button>

        {error && (
          <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 underline-offset-2 hover:underline"
            >
              dismiss
            </button>
          </div>
        )}

        {jobStatusMessage && (
          <p className="text-sm text-gray-600">{jobStatusMessage}</p>
        )}
      </div>
    </div>
  );
}
