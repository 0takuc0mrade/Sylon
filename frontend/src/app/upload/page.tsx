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

const BUSINESS_ID_STORAGE_KEY = 'morlen_business_id';
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
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTokens, setAdvancedTokens] = useState({ phoneId: "", token: "" });
  
  // Proxy Routing State
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPhoneStatus, setOwnerPhoneStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  
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
      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Not JSON
      }

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `API returned ${res.status}: ${res.statusText} - ${responseText.substring(0, 50)}`);
      }
      
      if (!data) {
        throw new Error("Invalid JSON response from server. Is the backend running?");
      }

      setResult(data);
      if (data.business_id) {
        setBusinessId(data.business_id);
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.business_id);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setResult({
        status: 'error',
        message: err.message || 'Failed to upload sample dataset'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Meta WhatsApp Connection
  const handleMetaConnect = async () => {
    if (!ownerPhone.trim()) {
      alert("Please enter your personal WhatsApp number for human proxy routing.");
      return;
    }
    
    setMetaConnecting(true);
    try {
      const payload = {
        business_id: businessId,
        real_phone_id: showAdvanced ? advancedTokens.phoneId : null,
        real_access_token: showAdvanced ? advancedTokens.token : null,
        owner_phone: ownerPhone
      };
      const res = await fetch(`/api/business/connect-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Success! Hide modal and start the sample data sync automatically to demonstrate the UI
        setIsMetaModalOpen(false);
        handleSample();
      }
    } catch (error) {
      console.error("Meta connection failed", error);
    } finally {
      setMetaConnecting(false);
    }
  };

  const handleSaveOwnerPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPhone) return;
    
    setOwnerPhoneStatus("saving");
    try {
      const res = await fetch(`/api/business/settings/owner-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, owner_phone: ownerPhone })
      });
      if (res.ok) {
        setOwnerPhoneStatus("success");
        setTimeout(() => setOwnerPhoneStatus("idle"), 3000);
      } else {
        setOwnerPhoneStatus("error");
      }
    } catch (err) {
      console.error(err);
      setOwnerPhoneStatus("error");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col flex-grow animate-in fade-in duration-500">
      <header className="mb-8 pt-8 text-center">
        <h1 className="page-heading text-3xl md:text-4xl font-bold mb-2">Connect Business Data</h1>
        <p className="page-subtitle font-medium">Connect your platforms to build your Business Memory and ground Morlen's advice.</p>
      </header>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
          {/* WhatsApp Card */}
          <div onClick={() => setIsMetaModalOpen(true)} className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1 md:hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm md:shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 text-[#25D366] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            <h3 className="font-bold text-brand-dark text-[10px] md:text-lg leading-tight">WhatsApp</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/70 mt-0.5 md:mt-1.5 opacity-80">Sync Chats & Voice</p>
          </div>
          {/* Instagram Card */}
          <div onClick={() => alert("Instagram integration is coming soon!")} className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1 md:hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm md:shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 text-[#E1306C] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <h3 className="font-bold text-brand-dark text-[10px] md:text-lg leading-tight">Instagram</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/70 mt-0.5 md:mt-1.5 opacity-80">Sync DMs & Comments</p>
          </div>
          {/* Facebook Card */}
          <div onClick={() => alert("Facebook integration is coming soon!")} className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1 md:hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm md:shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 text-[#1877F2] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <h3 className="font-bold text-brand-dark text-[10px] md:text-lg leading-tight">Facebook</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/70 mt-0.5 md:mt-1.5 opacity-80">Sync Page Messages</p>
          </div>
          {/* Google Reviews */}
          <div onClick={() => alert("Google integration is coming soon!")} className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full cursor-pointer hover:bg-brand-lightbrown/10 hover:-translate-y-1 md:hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm md:shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <h3 className="font-bold text-brand-dark text-[10px] md:text-lg leading-tight">Google</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/70 mt-0.5 md:mt-1.5 opacity-80">Sync Business Reviews</p>
          </div>
          {/* Sales CSV */}
          <div className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full opacity-70 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 text-brand-dark/40 dark:text-white/40 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            <h3 className="font-bold text-brand-dark/70 text-[10px] md:text-lg leading-tight">Sales Data</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/50 mt-0.5 md:mt-1.5">CSV Upload</p>
          </div>
          {/* Manual Notes */}
          <div className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 h-full opacity-70 flex flex-col items-center justify-center border border-brand-dark/10 text-center shadow-sm">
            <svg className="w-6 h-6 md:w-12 md:h-12 mb-1 md:mb-4 text-brand-dark/40 dark:text-white/40 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            <h3 className="font-bold text-brand-dark/70 text-[10px] md:text-lg leading-tight">Manual Notes</h3>
            <p className="text-[7px] md:text-xs text-brand-dark/50 mt-0.5 md:mt-1.5">Text Input</p>
          </div>
        </div>
        
        {/* Sample Dataset Section */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-brand-brown/30 bg-brand-lightbrown/5 mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-brand-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9ZM9.75 14.25l1.039-1.039m0 0L12 12m-1.211 1.211L12 14.25M10.5 12l1.211 1.211" /></svg>
                Just want to explore?
              </h2>
              <p className="text-brand-dark/70 dark:text-white/60 text-sm max-w-lg">
                Load our curated sample dataset to see Morlen in action instantly. This dataset contains example interactions designed to showcase the multi-agent decision engine.
              </p>
            </div>
            <button
              onClick={handleSample}
              disabled={loading}
              className="w-full sm:w-auto bg-brand-brown hover:bg-brand-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                "Load Sample Dataset"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-8">
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-brand-dark/10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-lightbrown/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-1">WhatsApp Approvals</h2>
              <p className="text-brand-dark/70 dark:text-white/60 text-sm">
                Enter your personal WhatsApp number. Morlen will send customer requests and draft replies directly to your phone for you to approve.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSaveOwnerPhone} className="flex flex-col sm:flex-row gap-4">
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="flex-1 bg-white/50 dark:bg-black/20 border border-brand-dark/20 dark:border-white/10 rounded-xl px-4 py-3 text-brand-dark dark:text-white placeholder:text-brand-dark/40 focus:outline-none focus:ring-2 focus:ring-brand-lightbrown/50"
            />
            <button
              type="submit"
              disabled={!ownerPhone || ownerPhoneStatus === "saving"}
              className="bg-brand-dark text-white hover:bg-brand-brown px-8 py-3 rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {ownerPhoneStatus === "saving" ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : ownerPhoneStatus === "success" ? (
                <span className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Saved</span>
              ) : (
                "Save Number"
              )}
            </button>
          </form>
          {ownerPhoneStatus === "error" && (
            <p className="text-red-500 text-sm mt-2">Failed to save phone number. Please try again.</p>
          )}
        </div>

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
                  Your WhatsApp interactions have been securely loaded. Morlen is extracting signals and patterns into the Business Memory.
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
      {isMetaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1C1E21] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10">
            {/* Meta Header */}
            <div className="bg-[#F0F2F5] dark:bg-[#242526] p-4 flex items-center justify-between border-b border-[#CCD0D5] dark:border-[#3E4042]">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 36 36" className="w-8 h-8 text-brand-brown dark:text-brand-lightbrown" fill="currentColor">
                  <path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1.1-12.7h-3.9v-5.1h3.9V14c0-3.9 2.4-6 5.8-6 1.7 0 3.1.1 3.5.2v4l-2.4.1c-1.9 0-2.3.9-2.3 2.2v2.9h4.5l-1.3 5.1h-3.2v12.8" />
                </svg>
                <span className="font-semibold text-[#1C1E21] dark:text-[#E4E6EB] text-lg">Connect Omnichannel (WhatsApp & Instagram)</span>
              </div>
              <button 
                onClick={() => setIsMetaModalOpen(false)}
                className="text-[#606770] dark:text-[#B0B3B8] hover:bg-black/5 dark:hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center -space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-[#1C1E21] bg-[#25D366] flex items-center justify-center text-white shadow-md z-10">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-[#1C1E21] bg-brand-brown flex items-center justify-center text-white shadow-md relative">
                  <span className="font-bold text-xl">S</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-[#1C1E21] dark:text-[#E4E6EB] mb-2">
                  Connect Morlen AI
                </h3>
                <p className="text-[#606770] dark:text-[#B0B3B8] text-sm leading-relaxed">
                  Morlen is requesting permission to access your WhatsApp Business and Instagram Professional accounts.
                </p>
              </div>
              
              <div className="bg-[#F0F2F5] dark:bg-[#242526] rounded-lg p-4 text-left border border-[#CCD0D5] dark:border-[#3E4042]">
                <h4 className="text-[#1C1E21] dark:text-[#E4E6EB] font-bold text-sm mb-1">Human Proxy Setup</h4>
                <p className="text-[#606770] dark:text-[#B0B3B8] text-xs mb-3 leading-relaxed">
                  Morlen will send drafts and escalations directly to your personal WhatsApp for approval before responding to customers.
                </p>
                <input 
                  type="tel" 
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full text-sm p-3 rounded-lg border border-[#CCD0D5] dark:border-[#3E4042] bg-white dark:bg-[#1C1E21] text-black dark:text-white focus:ring-2 focus:ring-brand-brown outline-none"
                  placeholder="Enter your personal WhatsApp (+1234...)"
                />
              </div>

              <div className="text-left mt-4">
                <p className="text-[#606770] dark:text-[#B0B3B8] text-xs font-semibold uppercase tracking-wider mb-2">Permissions requested:</p>
                <ul className="text-sm text-[#1C1E21] dark:text-[#E4E6EB] space-y-2">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    Read WhatsApp messages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    Send messages on behalf of your business
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    Manage WhatsApp profile settings
                  </li>
                </ul>
              </div>

              {/* Developer / Advanced Mode */}
              <div className="text-left">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-brand-brown dark:text-brand-lightbrown hover:underline"
                >
                  {showAdvanced ? "Hide Developer Settings" : "Developer: Connect Real WhatsApp API"}
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-black/30 rounded-lg border border-gray-200 dark:border-white/10 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">WhatsApp Phone Number ID</label>
                      <input 
                        type="text" 
                        value={advancedTokens.phoneId}
                        onChange={(e) => setAdvancedTokens({...advancedTokens, phoneId: e.target.value})}
                        className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white"
                        placeholder="e.g. 10423984..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta Permanent Access Token</label>
                      <input 
                        type="password" 
                        value={advancedTokens.token}
                        onChange={(e) => setAdvancedTokens({...advancedTokens, token: e.target.value})}
                        className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white"
                        placeholder="EAAD..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleMetaConnect}
                  disabled={metaConnecting}
                  className="w-full bg-brand-brown hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {metaConnecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    "Continue as Business Owner"
                  )}
                </button>
                <p className="text-xs text-[#606770] dark:text-[#B0B3B8] mt-4">
                  By clicking continue, you agree to Morlen's Terms of Service and Meta's Platform Data Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}
