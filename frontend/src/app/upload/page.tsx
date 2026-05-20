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
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <header className="mb-8 pt-8">
        <h1 className="page-heading text-3xl md:text-4xl font-bold mb-2">Ingest Data</h1>
        <p className="page-subtitle font-medium">Upload your customer reviews (CSV/JSON) to ground Sylon&apos;s advice.</p>
      </header>

      <div className="glass-card rounded-3xl p-6 md:p-8">
        <form onSubmit={handleUpload} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark dark:text-white">Business ID</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-brand-dark/30 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-lightbrown text-brand-dark dark:text-white placeholder:text-brand-dark/50 dark:placeholder:text-white/40"
              placeholder="e.g., my_business_123" 
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark dark:text-white">Review File (CSV or JSON)</label>
            <div className="border-2 border-dashed border-brand-dark/30 dark:border-white/20 rounded-xl p-8 flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 transition-colors">
              <input 
                type="file" 
                accept=".csv,.json"
                className="block w-full text-sm text-brand-dark dark:text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-lightbrown file:text-white hover:file:bg-brand-brown cursor-pointer transition-all file:mb-2 md:file:mb-0 whitespace-normal md:whitespace-nowrap overflow-hidden text-ellipsis"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="self-start text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown hover:opacity-90 px-6 py-3 rounded-full transition-opacity shadow-md font-bold disabled:opacity-50 mt-2"
            disabled={!file || loading}
          >
            {loading ? 'Processing...' : 'Upload & Excavate Personas'}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-brand-dark/10">
            <h3 className="mb-4 font-bold text-brand-brown text-lg">Ingestion Complete</h3>
            <pre className="whitespace-pre-wrap text-[#2a1610] dark:text-white/80 text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
