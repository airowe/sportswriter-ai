import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setResult(data.content);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Article</h1>
      <textarea
        className="w-full border p-2 mb-4"
        placeholder="Enter a prompt, e.g. 'Write a recap of Duke vs UNC'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={handleGenerate} className="bg-green-600 text-white py-2 px-4 rounded">Generate</button>
      <div className="mt-6 whitespace-pre-wrap border p-4 bg-gray-100">{result}</div>
    </div>
  );
}
