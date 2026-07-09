"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { CheckCircle2, MessageSquareWarning, Pencil, Send, Check } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

// For local testing without full multi-tenant DB setup, we hardcode the business ID
const DEFAULT_BUSINESS_ID = "225139034024220"; 

interface ActionItem {
  id: number;
  business_id: string;
  interaction_text: string;
  insight: string; // The draft text or escalation reason
  timestamp: string;
  source: string; // 'draft_reply' or 'escalation'
  reasoning_trace?: string; // The multi-agent debate trace JSON
}

export default function Inbox() {
  const { authenticated } = usePrivy();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    let isDemoMode = false;
    if (typeof window !== "undefined") {
      isDemoMode = localStorage.getItem("morlen_demo_mode") === "true";
    }
    if (authenticated || isDemoMode) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [authenticated]);

  const fetchItems = async () => {
    try {
      const bizId = localStorage.getItem('morlen_business_id') || DEFAULT_BUSINESS_ID;
      const res = await fetch(`/api/business/action-items?business_id=${bizId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch action items", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number, originalText: string) => {
    setProcessingId(id);
    const final_text = editingId === id ? editBuffer : originalText;
    
    // Attempt to extract the customer's phone number from the interaction_text for the demo
    // The format is usually "Customer (1234567890): Message"
    const phoneMatch = items.find(i => i.id === id)?.interaction_text.match(/\((\d+)\)/);
    const toNumber = phoneMatch ? phoneMatch[1] : null;

    try {
      const res = await fetch(`/api/business/action-items/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            edited_text: final_text,
            to_number: toNumber
        })
      });
      
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to approve item", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-lightbrown border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-dark text-white p-4 md:p-6 lg:p-8 pt-20 md:pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-brand-lightbrown tracking-tight">Action Inbox</h1>
            <p className="text-white/60 text-lg">Review and approve AI decisions before they reach your customers.</p>
          </div>

          {loading ? (
            <div className="text-white/50 text-center py-12 animate-pulse">Loading action items...</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto" />
              <p className="text-white/60 text-lg">Inbox Zero. Morlen is handling everything else automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`rounded-2xl border p-4 sm:p-5 md:p-6 backdrop-blur-md shadow-xl flex flex-col space-y-4 ${
                    item.source === 'escalation' ? 'bg-red-900/10 border-red-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {item.source === 'escalation' ? (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-semibold border border-red-500/30 flex items-center gap-1">
                          <MessageSquareWarning className="w-3 h-3" /> ESCALATION
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-semibold border border-yellow-500/30 flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> DRAFT REVIEW
                        </span>
                      )}
                      <span className="text-white/40 text-sm">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-white/60 text-sm font-mono mb-2 border-b border-white/10 pb-2">Original Customer Message:</p>
                    <p className="text-white text-lg">{item.interaction_text}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-brand-lightbrown text-sm font-semibold uppercase tracking-wider">
                      {item.source === 'escalation' ? "AI Reasoning:" : "Suggested Reply:"}
                    </p>
                    
                    {editingId === item.id ? (
                      <textarea 
                        className="w-full bg-black/50 border border-brand-lightbrown/50 rounded-xl p-3 text-white focus:outline-none focus:border-brand-lightbrown min-h-[100px]"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(e.target.value)}
                      />
                    ) : (
                      <div className="space-y-4">
                        <p className="text-white/80 text-lg leading-relaxed">{item.insight}</p>
                        
                        {item.reasoning_trace && (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-semibold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              Agent Debate Log
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(() => {
                                try {
                                  const trace = JSON.parse(item.reasoning_trace);
                                  return (
                                    <>
                                      <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
                                        <p className="text-[10px] text-blue-400 font-mono mb-1 uppercase">CX Agent (Retention Focus)</p>
                                        <p className="text-sm text-white/70">{trace.cx_agent}</p>
                                      </div>
                                      <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3">
                                        <p className="text-[10px] text-red-400 font-mono mb-1 uppercase">CFO Agent (Risk/Cost Focus)</p>
                                        <p className="text-sm text-white/70">{trace.cfo_agent}</p>
                                      </div>
                                    </>
                                  );
                                } catch (e) {
                                  return null;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 w-full">
                    {item.source === 'draft_reply' && (
                      <>
                        {editingId === item.id ? (
                          <button 
                            onClick={() => setEditingId(null)}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                          >
                            Cancel Edit
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setEditingId(item.id); setEditBuffer(item.insight); }}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button 
                          disabled={processingId === item.id}
                          onClick={() => handleApprove(item.id, item.insight)}
                          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {processingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Approve & Send
                        </button>
                      </>
                    )}
                    
                    {item.source === 'escalation' && (
                      <button 
                        disabled={processingId === item.id}
                        onClick={() => handleApprove(item.id, item.insight)}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {processingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        Dismiss & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
