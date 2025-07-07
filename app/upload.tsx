import React from 'react';
import { useState } from 'react';

export default function UploadPage() {
  const [samples, setSamples] = useState([{ prompt: '', response: '' }]);

  const handleChange = (index: number, field: 'prompt' | 'response', value: string) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handleUpload = async () => {
    await fetch('/api/fine-tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samples }),
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Writing Samples</h1>
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
      <button onClick={handleUpload} className="bg-blue-600 text-white py-2 px-4 rounded">Submit for Fine-Tuning</button>
    </div>
  );
}
