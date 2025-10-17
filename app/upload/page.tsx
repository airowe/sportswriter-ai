"use client";
import React from 'react';
import { useState } from 'react';
import { fetchWithErrorHandling, ClientLogger } from '@/lib/clientLogger';

export default function UploadPage() {
  const [samples, setSamples] = useState([{ prompt: '', response: '' }]);
  const [loading, setLoading] = useState(false);

  const handleChange = (index: number, field: 'prompt' | 'response', value: string) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const addSample = () => {
    setSamples([...samples, { prompt: '', response: '' }]);
  };

  const removeSample = (index: number) => {
    if (samples.length > 1) {
      setSamples(samples.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    const validSamples = samples.filter(s => s.prompt.trim() && s.response.trim());
    
    if (validSamples.length === 0) {
      ClientLogger.error('Please fill in at least one complete sample');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWithErrorHandling('/api/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: validSamples }),
      });
      ClientLogger.success(`Training data formatted: ${data.sampleCount} samples`);
    } catch (error) {
      ClientLogger.error('Failed to format training data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Training Data</h1>
      {samples.map((s, i) => (
        <div key={i} className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <strong>Sample {i + 1}</strong>
            {samples.length > 1 && (
              <button
                onClick={() => removeSample(i)}
                className="text-red-600 text-sm hover:underline"
                disabled={loading}
              >
                Remove
              </button>
            )}
          </div>
          <textarea
            className="w-full border mb-2 p-2"
            placeholder="Prompt"
            value={s.prompt}
            onChange={(e) => handleChange(i, 'prompt', e.target.value)}
            disabled={loading}
            rows={2}
          />
          <textarea
            className="w-full border p-2"
            placeholder="Your Article Response"
            value={s.response}
            onChange={(e) => handleChange(i, 'response', e.target.value)}
            disabled={loading}
            rows={6}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button 
          onClick={addSample} 
          className="bg-gray-600 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          Add Another Sample
        </button>
        <button 
          onClick={handleUpload} 
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit for Fine-Tuning'}
        </button>
      </div>
    </div>
  );
}
