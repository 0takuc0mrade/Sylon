'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@privy-io/react-auth";

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
const COMPARISON_DEMO_PROMPT = 'Compare these options: raise prices by 15%, close 2 hours earlier, or reduce menu size. Which is safest for my customer base?';

export default function Upload() {
  return (
    <AuthGuard>
      <UploadContent />
    </AuthGuard>
  );
}

function UploadContent() {
  const { getAccessToken } = usePrivy();
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState(() => {
    if (typeof window === 'undefined') {
      return 'biz_demo_123';
    }
    return localStorage.getItem(BUSINESS_ID_STORAGE_KEY) || 'biz_demo_123';
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (result?.status === 'processing' && !isDataReady && businessId) {
      interval = setInterval(async () => {
        try {
          const token = await getAccessToken();
          const res = await fetch(`/api/business/${businessId}/dashboard`, {
            headers: {
              'Bypass-Tunnel-Reminder': 'true',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          const data = await res.json();
          if (data.status === 'ok') {
            setIsDataReady(true);
            clearInterval(interval);
          }
        } catch {
          // silent error, keep polling
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [result, isDataReady, businessId, getAccessToken]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setIsDataReady(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('business_id', businessId);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/business/upload-reviews', {
        method: 'POST',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
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

  const handleSample = async () => {
    setLoading(true);
    setResult(null);
    setIsDataReady(false);
    
    // Always generate a fresh business ID for the demo to prevent stale state issues
    const newBizId = "demo_" + Math.random().toString(36).substring(2, 9);
    setBusinessId(newBizId);
    localStorage.setItem(BUSINESS_ID_STORAGE_KEY, newBizId);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/business/upload-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ business_id: newBizId })
      });
      const data: UploadResult = await res.json();
      setResult(data);
      if (data.business_id) {
        setBusinessId(data.business_id);
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.business_id);
      }
    } catch (err) {
      console.error(err);
      setResult({ status: 'error', message: 'Sample upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col flex-grow animate-in fade-in duration-500">
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

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              type="submit"
              className="text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown hover:opacity-90 px-6 py-3 rounded-full transition-opacity shadow-md font-bold disabled:opacity-50"
              disabled={!file || loading}
            >
              {loading ? 'Processing...' : 'Upload & Excavate Personas'}
            </button>

            <button
              type="button"
              onClick={handleSample}
              className="text-brand-brown bg-white border-2 border-brand-lightbrown hover:bg-brand-lightbrown/10 px-6 py-3 rounded-full transition-colors shadow-sm font-bold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Try with Sample Data'}
            </button>
          </div>
        </form>

        {result && result.status === 'processing' && (
          <div className="mt-8 p-8 bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-transparent backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center border border-green-200 dark:border-green-500/30 shadow-inner">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">Ingestion Successful</h3>
                <p className="text-brand-dark/80 dark:text-white/70 mb-6 leading-relaxed">
                  Your dataset has been securely loaded. Sylon is currently excavating customer personas and extracting critical pain points in the background. You can engage the Cognitive Core immediately.
                </p>
                <div className="flex flex-col sm:flex-row justify-start gap-3">
                  <button 
                    onClick={() => {
                      setIsNavigating(true);
                      router.push('/chat');
                    }}
                    disabled={isNavigating || !isDataReady}
                    className="text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown hover:shadow-lg hover:scale-[1.02] px-8 py-3.5 rounded-full font-bold shadow-md transition-all flex items-center space-x-3 disabled:opacity-80 disabled:cursor-wait disabled:hover:scale-100"
                  >
                    {isNavigating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Establishing Neural Link...</span>
                      </>
                    ) : !isDataReady ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Synthesizing Behavioral Profiles (~30s)</span>
                      </>
                    ) : (
                      <>
                        <span>Step 2: Engage Sylon Core</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNavigating(true);
                      router.push(`/chat?prompt=${encodeURIComponent(COMPARISON_DEMO_PROMPT)}`);
                    }}
                    disabled={isNavigating || !isDataReady}
                    className="text-brand-brown bg-white/80 border-2 border-brand-lightbrown hover:bg-brand-lightbrown/10 px-8 py-3.5 rounded-full font-bold shadow-sm transition-all disabled:opacity-80 disabled:cursor-wait"
                  >
                    Compare Sample Decisions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {result && result.status === 'error' && (
          <div className="mt-8 p-6 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md rounded-2xl border border-red-200 dark:border-red-500/30">
             <h3 className="mb-2 font-bold text-red-700 dark:text-red-400 text-lg flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
               Upload Failed
             </h3>
             <p className="text-red-600/80 dark:text-red-300/80">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
