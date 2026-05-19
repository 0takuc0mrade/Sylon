'use client';
import { useState } from 'react';

type UploadResult = {
  status?: string;
  message?: string;
  reviews_ingested?: number;
  total_reviews?: number;
  painpoints?: number;
  personas?: number;
  business_id?: string;
  persistence?: {
    database?: string;
    status?: string;
  };
  [key: string]: unknown;
};

const BUSINESS_ID_STORAGE_KEY = 'sylon_business_id';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'biz_demo_123';
    }
    return localStorage.getItem(BUSINESS_ID_STORAGE_KEY) || 'biz_demo_123';
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('business_id', businessId);

    try {
      const res = await fetch('/api/business/upload-reviews', {
        method: 'POST',
        body: formData
      });
      const data: UploadResult = await res.json();
      setResult(data);
      if (data.business_id) {
        setBusinessId(data.business_id);
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.business_id);
      }
    } catch (err) {
      console.error(err);
      setResult({ status: 'error', message: 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: "fadeIn 0.5s ease-out" }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ingest Data</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your customer reviews (CSV/JSON) to ground Sylon&apos;s advice.</p>
      </header>

      <div className="glass-card">
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Business ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Review File (CSV or JSON)</label>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: '8px', 
              padding: '3rem', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <input 
                type="file" 
                accept=".csv,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'block', margin: '0 auto' }}
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={!file || loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Processing...' : 'Upload & Excavate Personas'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Ingestion Complete</h3>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
