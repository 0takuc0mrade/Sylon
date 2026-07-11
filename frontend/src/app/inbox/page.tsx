"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AuthGuard from '@/components/AuthGuard';
import { Activity, AlertTriangle, MessageSquare, Check, X } from 'lucide-react';

export default function Inbox() {
  const { user } = usePrivy();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    try {
      const businessId = localStorage.getItem('morlen_business_id') || `biz_${user.id}`;
      const res = await fetch(`http://localhost:8080/business/action-items?business_id=${businessId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setItems(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // Poll every 10 seconds for real-time feel
    const interval = setInterval(fetchItems, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const approveItem = async (memoryId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/business/action-items/${memoryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        setItems(items.filter(item => item.id !== memoryId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen text-brand-dark dark:text-white p-4 md:p-6 lg:p-8 pt-20 md:pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 dark:border-white/10 pb-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-brand-dark dark:text-brand-lightbrown tracking-tight">Signal Inbox</h1>
              <p className="text-brand-dark/70 dark:text-white/60 text-lg">Approve AI drafts and handle escalations.</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full border border-green-500/20 font-bold text-sm">
              <Activity className="w-4 h-4 animate-pulse" />
              Monitoring
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-20 text-brand-dark/50">Loading signals...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-brand-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <MessageSquare className="w-12 h-12 text-brand-dark/20 dark:text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-brand-dark dark:text-white">All Caught Up!</h3>
                <p className="text-brand-dark/60 dark:text-white/60">Morlen is handling routine conversations. Any drafts or escalations will appear here.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className={`p-6 rounded-3xl border ${item.source === 'escalation' ? 'border-red-500/30 bg-red-500/5' : 'border-brand-lightbrown/30 bg-brand-lightbrown/5'} shadow-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.source === 'escalation' ? 'bg-red-500 text-white' : 'bg-brand-lightbrown text-brand-dark'}`}>
                        {item.source === 'escalation' ? 'Escalation' : 'Draft Approval'}
                      </span>
                      <p className="text-xs text-brand-dark/50 dark:text-white/50 mt-2 font-mono">ID: {item.id}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-brand-dark/10 dark:border-white/10 mb-4 whitespace-pre-wrap">
                    {item.interaction_text}
                  </div>

                  {item.source === 'draft_reply' && (
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => approveItem(item.id)} className="flex items-center gap-2 px-6 py-2 bg-brand-dark text-white dark:bg-white dark:text-brand-dark font-bold rounded-xl hover:opacity-90">
                        <Check className="w-4 h-4" /> Approve & Send
                      </button>
                    </div>
                  )}
                  {item.source === 'escalation' && (
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => approveItem(item.id)} className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">
                        Mark as Handled
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
