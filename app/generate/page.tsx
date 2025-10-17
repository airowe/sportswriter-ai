"use client";
import React, { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [sport, setSport] = useState('');
  const [contentType, setContentType] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setSaved(false);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setResult(data.content);
  };

  const handleSaveToTraining = async () => {
    if (!result || !prompt) {
      alert('Generate content first');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/training-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          response: result,
          sport: sport || undefined,
          contentType: contentType || undefined,
          status: 'draft',
          source: 'generated',
        }),
      });

      if (res.ok) {
        setSaved(true);
        alert('Saved to training data! You can review and approve it in the Training Data tab.');
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  const handleApproveAndSave = async () => {
    if (!result || !prompt) {
      alert('Generate content first');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/training-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          response: result,
          sport: sport || undefined,
          contentType: contentType || undefined,
          status: 'approved',
          source: 'generated',
        }),
      });

      if (res.ok) {
        setSaved(true);
        alert('Saved and approved! This will be included in the next fine-tuning batch.');
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Article</h1>
      
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Prompt</label>
        <textarea
          className="w-full border p-2"
          placeholder="Enter a prompt, e.g. 'Write a recap of Duke vs UNC'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 font-semibold">Sport (optional)</label>
          <input
            type="text"
            className="w-full border p-2"
            placeholder="e.g., Football, Basketball"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Content Type (optional)</label>
          <input
            type="text"
            className="w-full border p-2"
            placeholder="e.g., Recap, Preview"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={handleGenerate} 
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
      >
        Generate
      </button>

      {result && (
        <>
          <div className="mt-6 whitespace-pre-wrap border p-4 bg-gray-100">{result}</div>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleSaveToTraining}
              disabled={saving || saved}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saved ? 'Saved!' : 'Save as Draft'}
            </button>
            <button
              onClick={handleApproveAndSave}
              disabled={saving || saved}
              className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              Approve & Save for Training
            </button>
          </div>
        </>
      )}
    </div>
  );
}
