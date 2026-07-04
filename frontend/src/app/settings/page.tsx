'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [businessId, setBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fallback state for Developer Override testing
  const [devPhoneId, setDevPhoneId] = useState('');
  const [devToken, setDevToken] = useState('');

  useEffect(() => {
    // Attempt to load the business ID from local storage
    const storedBizId = localStorage.getItem('sylon_business_id') || 'demo_biz';
    setBusinessId(storedBizId);

    // Initialize Facebook SDK if available (Requires actual App ID and Config ID from Meta Dashboard)
    // window.fbAsyncInit = function() {
    //   window.FB.init({
    //     appId      : 'YOUR_APP_ID_HERE',
    //     cookie     : true,
    //     xfbml      : true,
    //     version    : 'v25.0'
    //   });
    // };
  }, []);

  const handleMetaLogin = () => {
    /* 
    // REAL META EMBEDDED SIGNUP FLOW (Requires Meta App Approval)
    window.FB.login((response: any) => {
      if (response.authResponse) {
        submitTokensToBackend(response.authResponse.accessToken, "EXTRACT_PHONE_ID_FROM_RESPONSE");
      }
    }, {
      config_id: 'YOUR_CONFIG_ID_HERE'
    });
    */
    alert("Meta SDK needs your App ID and Config ID configured in the code. Use the Developer Override below to test the backend API instantly.");
  };

  const submitTokensToBackend = async (accessToken: string, phoneId: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/business/oauth/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          meta_access_token: accessToken,
          whatsapp_phone_id: phoneId
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setStatus({ type: 'success', message: data.message });
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTokensToBackend(devToken, devPhoneId);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Platform Settings</h1>
          <p className="text-zinc-400">Manage your Multi-Tenant Sylon integrations.</p>
        </div>

        {status && (
          <div className={`p-4 rounded-xl border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {status.message}
          </div>
        )}

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Meta Embedded Signup</h2>
              <p className="text-zinc-400 text-sm">Allow merchants to securely connect WhatsApp in one click.</p>
            </div>
          </div>

          <button
            onClick={handleMetaLogin}
            disabled={loading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Connect Facebook</span>
          </button>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-8 shadow-2xl mt-8">
          <h2 className="text-xl font-semibold mb-4">Developer Override (Test API)</h2>
          <p className="text-zinc-400 text-sm mb-6">Manually bind tokens to your current session to test the multi-tenant architecture immediately without the real SDK.</p>
          
          <form onSubmit={handleDevSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">WhatsApp Phone ID</label>
              <input 
                type="text" 
                value={devPhoneId}
                onChange={e => setDevPhoneId(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500" 
                placeholder="e.g. 1234567890" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Meta Access Token</label>
              <input 
                type="text" 
                value={devToken}
                onChange={e => setDevToken(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500" 
                placeholder="EAA..." 
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "Saving to Database..." : "Simulate OAuth Callback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
