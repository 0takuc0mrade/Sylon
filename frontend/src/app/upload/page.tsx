'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@/hooks/useMockPrivy";

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
const COMPARISON_DEMO_PROMPT = 'Generator diesel costs just spiked 20% overnight. Compare these survival options: raise prices by 15%, close the kitchen 2 hours earlier, or reduce menu size. Which is safest?';

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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col flex-grow animate-in fade-in duration-500">
      <header className="mb-8 pt-8 text-center">
        <h1 className="page-heading text-3xl md:text-4xl font-bold mb-2">Connect Business Data</h1>
        <p className="page-subtitle font-medium">Connect your platforms to build your Business Memory and ground Sylon's advice.</p>
      </header>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {/* WhatsApp Card */}
          <div onClick={handleSample} className="glass-card rounded-3xl p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-md hover:shadow-lg">
            <svg className="w-12 h-12 mb-4 text-[#25D366] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            <h3 className="font-bold text-brand-dark text-lg">WhatsApp</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">Sync Chats & Voice Notes</p>
          </div>
          {/* Instagram Card */}
          <div onClick={handleSample} className="glass-card rounded-3xl p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-md hover:shadow-lg">
            <svg className="w-12 h-12 mb-4 text-[#E1306C] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <h3 className="font-bold text-brand-dark text-lg">Instagram</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">Sync DMs & Comments</p>
          </div>
          {/* Facebook Card */}
          <div onClick={handleSample} className="glass-card rounded-3xl p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-md hover:shadow-lg">
            <svg className="w-12 h-12 mb-4 text-[#1877F2] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <h3 className="font-bold text-brand-dark text-lg">Facebook</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">Sync Page Messages</p>
          </div>
          {/* Google Reviews */}
          <div onClick={handleSample} className="glass-card rounded-3xl p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-md hover:shadow-lg">
            <svg className="w-12 h-12 mb-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <h3 className="font-bold text-brand-dark text-lg">Google</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">Sync Business Reviews</p>
          </div>
          {/* Sales CSV */}
          <div className="glass-card rounded-3xl p-8 h-full opacity-70 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm">
            <svg className="w-12 h-12 mb-4 text-brand-dark/40 dark:text-white/40 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            <h3 className="font-bold text-brand-dark text-lg">Sales Data</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">CSV Upload</p>
          </div>
          {/* Manual Notes */}
          <div className="glass-card rounded-3xl p-8 h-full opacity-70 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm">
            <svg className="w-12 h-12 mb-4 text-brand-dark/40 dark:text-white/40 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            <h3 className="font-bold text-brand-dark text-lg">Manual Notes</h3>
            <p className="text-xs text-brand-dark/70 mt-1.5 opacity-80">Text input</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">


        {/* Manual Fallback Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-brand-dark/10">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-2">Manual File Upload (Advanced)</h2>
          <p className="text-brand-dark/70 dark:text-white/60 text-sm mb-6">Alternatively, drop a CSV of legacy data here to manually ingest it into the memory engine.</p>
          <form onSubmit={handleUpload} className="flex flex-col gap-6">
            <div className="space-y-2 hidden">
              <input type="hidden" value={businessId} />
            </div>
            <div className="space-y-2">
              <div className="border-2 border-dashed border-brand-dark/30 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 transition-colors">
                <input
                  type="file"
                  accept=".csv,.json"
                  className="block w-full text-sm text-brand-dark dark:text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-lightbrown file:text-white hover:file:bg-brand-brown cursor-pointer transition-all"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="text-white bg-brand-brown hover:opacity-90 px-6 py-3 rounded-full transition-opacity shadow-md font-bold disabled:opacity-50 text-sm"
                disabled={!file || loading}
              >
                {loading ? 'Processing...' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {result && result.status === 'processing' && (
          <div className="mt-8 p-8 bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-transparent backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center border border-green-200 dark:border-green-500/30 shadow-inner">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">Demo Dataset Connected</h3>
                <p className="text-brand-dark/80 dark:text-white/70 mb-6 leading-relaxed">
                  Your WhatsApp interactions have been securely loaded. Sylon is extracting signals and patterns into the Business Memory.
                </p>
                <div className="flex flex-col sm:flex-row justify-start gap-3">
                  <button 
                    onClick={() => {
                      setIsNavigating(true);
                      router.push('/insights');
                    }}
                    disabled={isNavigating || !isDataReady}
                    className="text-white bg-brand-brown hover:bg-brand-dark px-8 py-3.5 rounded-full font-bold shadow-md transition-all flex items-center space-x-3 disabled:opacity-80 disabled:cursor-wait disabled:hover:scale-100"
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
                        <span>View Business Memory</span>
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
                      router.push(`/chat`);
                    }}
                    disabled={isNavigating || !isDataReady}
                    className="text-brand-brown bg-white/80 border-2 border-brand-lightbrown hover:bg-brand-lightbrown/10 px-8 py-3.5 rounded-full font-bold shadow-sm transition-all disabled:opacity-80 disabled:cursor-wait"
                  >
                    Go to Consult Board
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
  );
}
