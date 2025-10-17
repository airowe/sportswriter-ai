"use client";
import React, { useState } from 'react';
import { fetchWithErrorHandling, ClientLogger } from '@/lib/clientLogger';

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
      const data = await fetchWithErrorHandling('/api/extract-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      setArticle(data);
      ClientLogger.success('Article extracted successfully!');
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
      await fetchWithErrorHandling('/api/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, url }),
      });
      setSaved(true);
      ClientLogger.success('Article saved to training data!');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Paste Article Link</h1>
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com/article"
        style={{ width: '100%', padding: 8, fontSize: 16 }}
      />
      <button onClick={handleExtract} disabled={loading || !url} style={{ marginTop: 12 }}>
        {loading ? 'Loading...' : 'Preview'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {article && (
        <>
          <div style={{ marginTop: 24, border: '1px solid #ccc', padding: 16, borderRadius: 8 }}>
            <h2>
              {typeof article.title === 'string'
                ? article.title
                : JSON.stringify(article.title)}
            </h2>
            <div style={{ color: '#888', fontSize: 14 }}>
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
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: 16 }}>
              {typeof article.body === 'string'
                ? article.body
                : Array.isArray(article.body)
                  ? article.body.join('\n\n')
                  : JSON.stringify(article.body)}
            </pre>
            <button onClick={handleSave} style={{ marginTop: 16 }} disabled={saved}>
              {saved ? 'Saved!' : 'Save to Training Data'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}