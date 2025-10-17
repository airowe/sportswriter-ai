"use client";
import React from 'react';
import { useState } from 'react';
import { useJob } from '@/lib/hooks/useJob';

export default function UploadPage() {
  const [samples, setSamples] = useState([{ prompt: '', response: '' }]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { job, isProcessing, isCompleted, isFailed, loading } = useJob(jobId);

  const handleChange = (index: number, field: 'prompt' | 'response', value: string) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handleUpload = async () => {
    setSubmissionError(null);
    try {
      const response = await fetch('/api/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobId(data.jobId);
      } else {
        const data = await response.json();
        setSubmissionError(data.error || 'Failed to submit job');
      }
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Network error');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Training Data</h1>
      {samples.map((s, i) => (
        <div key={i} className="mb-4">
          <textarea
            className="w-full border mb-2 p-2"
            placeholder="Prompt"
            value={s.prompt}
            onChange={(e) => handleChange(i, 'prompt', e.target.value)}
          />
          <textarea
            className="w-full border p-2"
            placeholder="Your Article Response"
            value={s.response}
            onChange={(e) => handleChange(i, 'response', e.target.value)}
          />
        </div>
      ))}
      <button 
        onClick={handleUpload} 
        className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
        disabled={loading || isProcessing}
      >
        {loading || isProcessing ? 'Processing...' : 'Submit for Fine-Tuning'}
      </button>

      {submissionError && (
        <div className="mt-4 p-4 border border-red-400 rounded bg-red-50 text-red-700">
          {submissionError}
        </div>
      )}

      {job && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">Job Status</h3>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}</p>
          
          {isProcessing && (
            <div className="mt-2 text-blue-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Processing your fine-tune export...</span>
              </div>
            </div>
          )}
          
          {isCompleted && job.result && (
            <div className="mt-2 text-green-600">
              <p>✓ Export completed successfully!</p>
              <p className="text-sm text-gray-600 mt-1">File: {job.result.fileName}</p>
              <p className="text-sm text-gray-600">Samples: {job.result.sampleCount}</p>
            </div>
          )}
          
          {isFailed && (
            <div className="mt-2 text-red-600">
              <p>✗ Export failed</p>
              {job.error && <p className="text-sm">{job.error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
