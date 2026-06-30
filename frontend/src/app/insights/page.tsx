"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type InsightData = {
  health_score: number;
  top_complaint: string;
  top_praise: string;
  archetypes: { name: string; drift: string; rating: number }[];
  history: { date: string; source: string; review_count: number }[];
  signals: {
    demand: number;
    lost_sales: number;
    complaints: number;
    purchase_intent: number;
    total_enquiries: number;
  };
  memories: {
    intent: string;
    text: string;
    created_at: string;
  }[];
};

const COMPARISON_DEMO_PROMPT = "Generator diesel costs just spiked 20% overnight. Compare these survival options: raise prices by 15%, close the kitchen 2 hours earlier, or reduce menu size. Which is safest?";

export default function Insights() {
  const { getAccessToken } = usePrivy();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const businessId = localStorage.getItem("sylon_business_id");
      if (!businessId) {
        setError("No business data found. Please ingest data first.");
        setLoading(false);
        return;
      }

      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/business/${businessId}/dashboard`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const json = await res.json();
        
        if (json.status === "ok") {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load insights.");
        }
      } catch {
        setError("Network error connecting to the engine.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100dvh-120px)] animate-in fade-in">
        <div className="text-xl font-bold text-brand-dark dark:text-white animate-pulse">Syncing with Sylon Database...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] animate-in fade-in text-center">
        <div className="w-20 h-20 bg-brand-lightbrown/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-brand-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">No Insight Data Found</h2>
        <p className="text-brand-dark/70 dark:text-white/60 mb-8">{error}</p>
        <Link href="/upload" className="glass-button text-brand-dark px-8 py-3 rounded-full font-bold">
          Initialize Engine
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col flex-grow animate-in fade-in duration-500">
      <header className="mb-8 pt-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="page-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Business Memory</h1>
          <p className="page-subtitle font-medium text-sm md:text-base">Customer Signals & Pattern Detection</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
          <Link href={`/chat`} className="text-sm font-bold text-white bg-brand-brown px-6 py-3 rounded-full hover:opacity-90 shadow-lg hover:scale-105 transition-all whitespace-nowrap flex-shrink-0 text-center">
            Ask Before You Spend
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Signals & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Customer Signals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm">
              <div className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider mb-2 flex items-center gap-2"><span>📈</span> Demand Signals</div>
              <div className="text-3xl font-bold text-brand-dark">{data.signals.demand}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-red-50/50">
              <div className="text-xs font-bold text-red-600/70 uppercase tracking-wider mb-2 flex items-center gap-2"><span>💸</span> Lost Sales</div>
              <div className="text-3xl font-bold text-red-700">{data.signals.lost_sales}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-amber-50/50">
              <div className="text-xs font-bold text-amber-600/70 uppercase tracking-wider mb-2 flex items-center gap-2"><span>⚠️</span> Complaints</div>
              <div className="text-3xl font-bold text-amber-700">{data.signals.complaints}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-green-50/50">
              <div className="text-xs font-bold text-green-600/70 uppercase tracking-wider mb-2 flex items-center gap-2"><span>🛒</span> Purchase Intent</div>
              <div className="text-3xl font-bold text-green-700">{data.signals.purchase_intent}</div>
            </div>
          </div>

          {/* Business Memory Timeline */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-brand-dark/10 shadow-sm">
            <h2 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
              <span>🧠</span> Business Memory Timeline
            </h2>
            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-[15px] top-2 bottom-0 w-0.5 bg-brand-dark/10"></div>
              
              {data.memories.length === 0 ? (
                <div className="pl-10 text-sm text-brand-dark/50 italic">No customer memories found. Wait for the engine to finish processing.</div>
              ) : data.memories.map((m, i) => {
                let icon = "💬";
                let colorClass = "bg-gray-100 text-gray-800";
                let iconBg = "bg-blue-100";
                
                if (m.intent === "Lost Sale") {
                  icon = "❌"; colorClass = "bg-red-100 text-red-800"; iconBg = "bg-red-100";
                } else if (m.intent === "Complaint") {
                  icon = "⚠️"; colorClass = "bg-amber-100 text-amber-800"; iconBg = "bg-amber-100";
                } else if (m.intent === "Purchase Intent") {
                  icon = "🛒"; colorClass = "bg-green-100 text-green-800"; iconBg = "bg-green-100";
                } else if (m.intent === "Inquiry") {
                  icon = "❓"; colorClass = "bg-blue-100 text-blue-800"; iconBg = "bg-blue-100";
                }

                const dateStr = new Date(m.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

                return (
                  <div key={i} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center border-2 border-white shadow-sm text-xs`}>{icon}</div>
                    <div className="text-xs font-bold text-brand-dark/50 mb-1">{dateStr}</div>
                    <div className="font-semibold text-brand-dark text-lg">{m.text}</div>
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>{m.intent}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Patterns & Daily Summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Daily Summary */}
          <div className="bg-brand-dark rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-brown/30 rounded-full blur-2xl"></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Latest Summary</h2>
            <div className="text-3xl font-bold mb-1">Today</div>
            <div className="text-white/80 mb-6 border-b border-white/10 pb-4">
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex justify-between"><span>Total Enquiries:</span> <span className="font-bold text-white">{data.signals.total_enquiries}</span></li>
                <li className="flex justify-between"><span>Purchase-Ready:</span> <span className="font-bold text-green-400">{data.signals.purchase_intent}</span></li>
                <li className="flex justify-between"><span>Complaints:</span> <span className="font-bold text-red-400">{data.signals.complaints}</span></li>
              </ul>
            </div>
            <div className="mb-4">
              <div className="text-xs text-white/50 uppercase font-bold mb-1">Top Archetype</div>
              <div className="font-semibold">{data.archetypes?.[0]?.name || "Not enough data"}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-brand-lightbrown uppercase font-bold mb-1 flex items-center gap-2"><span>✨</span> Recommendation</div>
              <div className="text-sm font-medium leading-relaxed">{data.archetypes?.[0]?.drift || "Collect more customer interactions to unlock recommendations."}</div>
            </div>
          </div>

          {/* Pattern Discovery */}
          <div className="glass-card rounded-3xl p-6 border border-brand-dark/10 shadow-sm">
            <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
              <span>🔮</span> Pattern Discovery
            </h2>
            <p className="text-xs font-bold text-brand-dark/50 uppercase mb-4">Sylon Noticed...</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 text-lg">⚠️</div>
                <div className="text-sm font-medium text-brand-dark"><strong className="text-brand-brown">Key Complaint:</strong> {data.top_complaint || "None"}</div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 text-lg">⭐</div>
                <div className="text-sm font-medium text-brand-dark"><strong className="text-green-700">Top Praise:</strong> {data.top_praise || "None"}</div>
              </li>
            </ul>
          </div>

          {/* Intelligence Score */}
          <div className="glass-card rounded-3xl p-6 border border-brand-dark/10 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center text-xl font-bold text-green-600 flex-shrink-0">
              72%
            </div>
            <div>
              <div className="font-bold text-brand-dark">Business Intelligence</div>
              <div className="text-xs text-brand-dark/60 font-semibold text-green-600 flex items-center gap-1"><span>↑</span> Growing</div>
              <div className="text-[10px] text-brand-dark/40 mt-1">Based on 218 interactions</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
