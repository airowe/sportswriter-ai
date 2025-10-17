"use client";
import React from 'react';
import { useState } from 'react';

export default function UploadPage() {
  const [samples, setSamples] = useState([{ prompt: '', response: '', sport: '', contentType: '' }]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (index: number, field: 'prompt' | 'response' | 'sport' | 'contentType', value: string) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handleAddSample = () => {
    setSamples([...samples, { prompt: '', response: '', sport: '', contentType: '' }]);
  };

  const handleRemoveSample = (index: number) => {
    setSamples(samples.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      // Save each sample individually
      for (const sample of samples) {
        if (sample.prompt && sample.response) {
          await fetch('/api/training-samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: sample.prompt,
              response: sample.response,
              sport: sample.sport || undefined,
              contentType: sample.contentType || undefined,
              status: 'draft',
              source: 'imported',
            }),
          });
        }
      }
      alert('Training samples saved! You can review and categorize them in the Training Data tab.');
      setSamples([{ prompt: '', response: '', sport: '', contentType: '' }]);
    } catch (err) {
      alert('Failed to save samples');
    }
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Training Data</h1>
      <p className="text-gray-600 mb-6">
        Add prompt/response pairs for training. These will be saved as draft samples that you can review and approve.
      </p>
      
      {samples.map((s, i) => (
        <div key={i} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Sample {i + 1}</h3>
            {samples.length > 1 && (
              <button 
                onClick={() => handleRemoveSample(i)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          
          <div className="mb-3">
            <label className="block mb-1 font-semibold text-sm">Prompt</label>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="e.g., Write a game recap for Duke vs UNC"
              value={s.prompt}
              onChange={(e) => handleChange(i, 'prompt', e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="mb-3">
            <label className="block mb-1 font-semibold text-sm">Article Response</label>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="The complete article text..."
              value={s.response}
              onChange={(e) => handleChange(i, 'response', e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-semibold text-sm">Sport (optional)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="e.g., Football"
                value={s.sport}
                onChange={(e) => handleChange(i, 'sport', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Content Type (optional)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="e.g., Recap"
                value={s.contentType}
                onChange={(e) => handleChange(i, 'contentType', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex gap-4">
        <button 
          onClick={handleAddSample} 
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Add Another Sample
        </button>
        <button 
          onClick={handleUpload} 
          disabled={uploading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Save Training Samples'}
        </button>
      </div>
    </div>
  );
}
