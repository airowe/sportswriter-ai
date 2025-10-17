"use client";
import React from 'react';
import { useState } from 'react';

import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Spinner } from '../components/Spinner';

export default function UploadPage() {
  const [samples, setSamples] = useState([{ prompt: '', response: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (index: number, field: 'prompt' | 'response', value: string) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handleAddSample = () => {
    setSamples([...samples, { prompt: '', response: '' }]);
  };

  const handleUpload = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await fetch('/api/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      });
      setSuccess(true);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <DocumentArrowUpIcon className="w-7 h-7 text-blue-500" /> Upload Training Data
      </h1>
      <div className="space-y-6">
        {samples.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="font-medium text-gray-700">Prompt</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white"
              placeholder="Prompt"
              value={s.prompt}
              onChange={(e) => handleChange(i, 'prompt', e.target.value)}
              rows={2}
            />
            <label className="font-medium text-gray-700">Response</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white"
              placeholder="Your Article Response"
              value={s.response}
              onChange={(e) => handleChange(i, 'response', e.target.value)}
              rows={3}
            />
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
          onClick={handleAddSample}
        >
          <PlusIcon className="w-5 h-5" /> Add Sample
        </button>
      </div>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleUpload}
          className="relative bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded shadow transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2"><Spinner className="w-5 h-5" /> Uploading...</span>
          ) : success ? (
            <span className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-400" /> Uploaded!</span>
          ) : (
            'Submit for Fine-Tuning'
          )}
        </button>
      </div>
    </div>
  );
}
