"use client";
import React, { useState } from 'react';

import parse, { Element } from 'html-react-parser';

export default function Home() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    setArticle(null);
    try {
      const res = await fetch('/api/extract-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract');
      setArticle(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article) return;
    setSaved(false);
    setError('');
    try {
      const res = await fetch('/api/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, url }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Paste Article Link</h1>
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com/article"
        className="w-full p-2 text-base border border-gray-300 rounded mb-4"
      />
      <button
        onClick={handleExtract}
        disabled={loading || !url}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded mb-4 disabled:opacity-60"
      >
        {loading ? 'Loading...' : 'Preview'}
      </button>
      {error && <div className="text-red-600 mt-2 mb-2">{error}</div>}
      {article && (
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-2">
            {typeof article.title === 'string'
              ? article.title
              : JSON.stringify(article.title)}
          </h2>
          <div className="text-gray-500 text-sm mb-2">
            {article.author && (
              <span>
                {typeof article.author === 'string'
                  ? `By ${article.author} `
                  : JSON.stringify(article.author)}
              </span>
            )}
            {article.publishDate && (
              <span>
                {typeof article.publishDate === 'string'
                  ? `(${article.publishDate})`
                  : JSON.stringify(article.publishDate)}
              </span>
            )}
          </div>
          <div className="prose max-w-none mt-4">
            {typeof article.body === 'string' && /<img|<figure|<picture|<iframe|<video/i.test(article.body)
              ? parse(article.body, {
                  replace(domNode: any) {
                    if (domNode.type === 'tag' && domNode.name === 'img' && domNode.attribs) {
                      return (
                        <img
                          {...domNode.attribs}
                          className="max-w-full h-auto rounded shadow mb-4 mx-auto"
                          style={{ maxHeight: 400 }}
                        />
                      );
                    }
                  },
                })
              : typeof article.body === 'string'
              ? article.body
              : Array.isArray(article.body)
              ? article.body.join('\n\n')
              : JSON.stringify(article.body)}
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            disabled={saved}
          >
            {saved ? 'Saved!' : 'Save to Training Data'}
          </button>
        </div>
      )}
    </div>
  );
}