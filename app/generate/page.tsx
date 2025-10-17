"use client";
import React, { useState } from 'react';

import { SparklesIcon } from '@heroicons/react/24/solid';
import { Spinner } from '../components/Spinner';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data.content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SparklesIcon className="w-7 h-7 text-green-500" /> Generate Article
      </h1>
      <textarea
        className="w-full border border-gray-300 rounded p-3 mb-4 min-h-[120px] focus:ring-2 focus:ring-green-200 focus:outline-none bg-white text-lg"
        placeholder="Enter a prompt, e.g. 'Write a recap of Duke vs UNC'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      <button
        onClick={handleGenerate}
        className="relative bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded shadow transition disabled:opacity-60 flex items-center gap-2"
        disabled={loading || !prompt.trim()}
      >
        {loading ? <Spinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 whitespace-pre-wrap text-base text-gray-900 shadow-inner">
          {result}
        </div>
      )}
    </div>
  );
}
