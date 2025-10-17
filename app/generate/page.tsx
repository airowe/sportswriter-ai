"use client";
import React, { useState } from 'react';
import { fetchWithErrorHandling, ClientLogger } from '@/lib/clientLogger';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      ClientLogger.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setResult('');
    setMetadata(null);
    
    try {
      const data = await fetchWithErrorHandling('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      setResult(data.content);
      setMetadata(data.metadata);
      ClientLogger.success('Article generated successfully!');
    } catch (error) {
      ClientLogger.error('Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Article</h1>
      <textarea
        className="w-full border p-2 mb-4"
        placeholder="Enter a prompt, e.g. 'Write a recap of Duke vs UNC'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
        rows={4}
      />
      <button 
        onClick={handleGenerate} 
        className="bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || !prompt.trim()}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && (
        <>
          {metadata && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Generation Info:</strong> {metadata.model} • {metadata.tokensUsed} tokens • {metadata.duration}ms
            </div>
          )}
          <div className="mt-6 whitespace-pre-wrap border p-4 bg-gray-100">{result}</div>
        </>
      )}
    </div>
  );
}
