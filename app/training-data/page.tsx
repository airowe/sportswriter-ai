"use client";
import React, { useState, useEffect } from 'react';
import { TrainingSample, FineTuneMetadata } from '@/lib/types';

export default function TrainingDataPage() {
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [analytics, setAnalytics] = useState<FineTuneMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filters
  const [sportFilter, setSportFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // Batch update form
  const [batchSport, setBatchSport] = useState('');
  const [batchContentType, setBatchContentType] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  
  // Edit modal
  const [editingSample, setEditingSample] = useState<TrainingSample | null>(null);
  
  // Fine-tune modal
  const [showFineTuneModal, setShowFineTuneModal] = useState(false);
  const [fineTuneSport, setFineTuneSport] = useState('all');
  const [fineTuneContentType, setFineTuneContentType] = useState('all');
  const [fineTuneStatus, setFineTuneStatus] = useState('approved');

  useEffect(() => {
    loadData();
    loadAnalytics();
  }, [sportFilter, contentTypeFilter, statusFilter, sourceFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport: sportFilter,
        contentType: contentTypeFilter,
        status: statusFilter,
        source: sourceFilter,
      });
      const res = await fetch(`/api/training-samples?${params}`);
      const data = await res.json();
      setSamples(data);
    } catch (err) {
      console.error('Failed to load samples:', err);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === samples.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(samples.map(s => s.id));
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) {
      alert('No samples selected');
      return;
    }

    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          sport: batchSport || undefined,
          contentType: batchContentType || undefined,
          status: batchStatus || undefined,
        }),
      });
      const data = await res.json();
      alert(data.message);
      setSelectedIds([]);
      setBatchSport('');
      setBatchContentType('');
      setBatchStatus('');
      loadData();
      loadAnalytics();
    } catch (err) {
      alert('Failed to update samples');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/training-samples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      loadData();
      loadAnalytics();
    } catch (err) {
      alert('Failed to approve sample');
    }
  };

  const handleEdit = (sample: TrainingSample) => {
    setEditingSample({ ...sample });
  };

  const handleSaveEdit = async () => {
    if (!editingSample) return;

    try {
      await fetch(`/api/training-samples/${editingSample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSample),
      });
      setEditingSample(null);
      loadData();
      loadAnalytics();
    } catch (err) {
      alert('Failed to save changes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sample?')) return;

    try {
      await fetch(`/api/training-samples/${id}`, {
        method: 'DELETE',
      });
      loadData();
      loadAnalytics();
    } catch (err) {
      alert('Failed to delete sample');
    }
  };

  const handleFineTune = async () => {
    try {
      const res = await fetch('/api/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useFilters: true,
          sport: fineTuneSport,
          contentType: fineTuneContentType,
          status: fineTuneStatus,
        }),
      });
      const data = await res.json();
      alert(`${data.message}\nSamples included: ${data.sampleCount}\nFile: ${data.path}`);
      setShowFineTuneModal(false);
      loadAnalytics();
    } catch (err) {
      alert('Failed to generate training file');
    }
  };

  const uniqueSports = analytics ? Object.keys(analytics.samplesBySport) : [];
  const uniqueContentTypes = analytics ? Object.keys(analytics.samplesByContentType) : [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Training Data Management
      </h1>

      {/* Analytics Dashboard */}
      {analytics && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#f9f9f9' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Total Samples</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold' }}>{analytics.totalSamples}</p>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#f9f9f9' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Approved</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#0070f3' }}>
              {analytics.samplesByStatus.approved || 0}
            </p>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#f9f9f9' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Drafts</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#888' }}>
              {analytics.samplesByStatus.draft || 0}
            </p>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#f9f9f9' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Last Fine-Tune</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
              {analytics.lastFineTuneDate 
                ? new Date(analytics.lastFineTuneDate).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1rem', 
        flexWrap: 'wrap',
        alignItems: 'center' 
      }}>
        <select 
          value={sportFilter} 
          onChange={e => setSportFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="all">All Sports</option>
          {uniqueSports.map(sport => (
            <option key={sport} value={sport}>{sport}</option>
          ))}
        </select>

        <select 
          value={contentTypeFilter} 
          onChange={e => setContentTypeFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="all">All Content Types</option>
          {uniqueContentTypes.map(ct => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>

        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
        </select>

        <select 
          value={sourceFilter} 
          onChange={e => setSourceFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="all">All Sources</option>
          <option value="imported">Imported</option>
          <option value="generated">Generated</option>
        </select>

        <button 
          onClick={() => setShowFineTuneModal(true)}
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: 4, 
            background: '#0070f3', 
            color: 'white', 
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}
        >
          Generate Training JSONL
        </button>
      </div>

      {/* Batch Update */}
      {selectedIds.length > 0 && (
        <div style={{ 
          border: '1px solid #0070f3', 
          borderRadius: 8, 
          padding: '1rem', 
          marginBottom: '1rem',
          background: '#f0f8ff'
        }}>
          <h3 style={{ margin: '0 0 1rem' }}>Batch Update ({selectedIds.length} selected)</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Sport</label>
              <input
                type="text"
                value={batchSport}
                onChange={e => setBatchSport(e.target.value)}
                placeholder="e.g., Football"
                style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Content Type</label>
              <input
                type="text"
                value={batchContentType}
                onChange={e => setBatchContentType(e.target.value)}
                placeholder="e.g., Recap"
                style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Status</label>
              <select
                value={batchStatus}
                onChange={e => setBatchStatus(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">No change</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
            <button 
              onClick={handleBatchUpdate}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: 4, 
                background: '#0070f3', 
                color: 'white', 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Apply to Selected
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: 4, 
                background: '#888', 
                color: 'white', 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div>Loading...</div>
      ) : samples.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          No training samples found. Import articles or generate content to get started.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                  <input 
                    type="checkbox" 
                    checked={samples.length > 0 && selectedIds.length === samples.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Prompt</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Response</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Sport</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Content Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Source</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {samples.map(sample => (
                <tr key={sample.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(sample.id)}
                      onChange={() => handleToggleSelect(sample.id)}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', maxWidth: 200 }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {sample.prompt}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', maxWidth: 300 }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {sample.response}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 4, 
                      background: '#e3f2fd',
                      fontSize: '0.75rem'
                    }}>
                      {sample.sport || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 4, 
                      background: '#f3e5f5',
                      fontSize: '0.75rem'
                    }}>
                      {sample.contentType || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 4, 
                      background: sample.status === 'approved' ? '#e8f5e9' : 
                                  sample.status === 'published' ? '#e1f5fe' : '#fafafa',
                      color: sample.status === 'approved' ? '#2e7d32' : 
                             sample.status === 'published' ? '#01579b' : '#666',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {sample.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {sample.source}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {sample.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(sample.id)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.75rem',
                            borderRadius: 4, 
                            background: '#4caf50', 
                            color: 'white', 
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(sample)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem',
                          borderRadius: 4, 
                          background: '#2196f3', 
                          color: 'white', 
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sample.id)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem',
                          borderRadius: 4, 
                          background: '#f44336', 
                          color: 'white', 
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingSample && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: '2rem',
            maxWidth: 600,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Training Sample</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Prompt
              </label>
              <textarea
                value={editingSample.prompt}
                onChange={e => setEditingSample({ ...editingSample, prompt: e.target.value })}
                style={{ 
                  width: '100%', 
                  minHeight: 100, 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Response
              </label>
              <textarea
                value={editingSample.response}
                onChange={e => setEditingSample({ ...editingSample, response: e.target.value })}
                style={{ 
                  width: '100%', 
                  minHeight: 200, 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Sport
                </label>
                <input
                  type="text"
                  value={editingSample.sport || ''}
                  onChange={e => setEditingSample({ ...editingSample, sport: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Content Type
                </label>
                <input
                  type="text"
                  value={editingSample.contentType || ''}
                  onChange={e => setEditingSample({ ...editingSample, contentType: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                value={editingSample.status}
                onChange={e => setEditingSample({ 
                  ...editingSample, 
                  status: e.target.value as 'draft' | 'approved' | 'published' 
                })}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingSample(null)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 4, 
                  background: '#ccc', 
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 4, 
                  background: '#0070f3', 
                  color: 'white', 
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fine-Tune Modal */}
      {showFineTuneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: '2rem',
            maxWidth: 500,
            width: '90%'
          }}>
            <h2 style={{ marginTop: 0 }}>Generate Training JSONL</h2>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Select which categories to include in the training data export.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Sport
              </label>
              <select
                value={fineTuneSport}
                onChange={e => setFineTuneSport(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="all">All Sports</option>
                {uniqueSports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Content Type
              </label>
              <select
                value={fineTuneContentType}
                onChange={e => setFineTuneContentType(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="all">All Content Types</option>
                {uniqueContentTypes.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                value={fineTuneStatus}
                onChange={e => setFineTuneStatus(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowFineTuneModal(false)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 4, 
                  background: '#ccc', 
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFineTune}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 4, 
                  background: '#0070f3', 
                  color: 'white', 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Generate JSONL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
