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
      const businessId = localStorage.getItem("morlen_business_id");
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
        <div className="text-xl font-bold text-brand-dark dark:text-white animate-pulse">Syncing with Morlen Database...</div>
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

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          
          {/* Left Column: Signals & Timeline */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 md:gap-8">
            
            {/* Customer Signals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="glass-card p-2 md:p-5 rounded-xl md:rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm">
              <div className="text-[8px] md:text-xs font-bold text-brand-dark/60 uppercase tracking-wider mb-1 md:mb-2 flex flex-col xl:flex-row items-center md:items-start gap-1 md:gap-2 text-center md:text-left"><span className="text-sm md:text-base">📈</span> <span className="leading-tight">Demand Signals</span></div>
              <div className="text-lg md:text-3xl font-bold text-brand-dark text-center md:text-left">{data.signals.demand}</div>
            </div>
            <div className="glass-card p-2 md:p-5 rounded-xl md:rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-red-50/50">
              <div className="text-[8px] md:text-xs font-bold text-red-600/70 uppercase tracking-wider mb-1 md:mb-2 flex flex-col xl:flex-row items-center md:items-start gap-1 md:gap-2 text-center md:text-left"><span className="text-sm md:text-base">💸</span> <span className="leading-tight">Lost Sales</span></div>
              <div className="text-lg md:text-3xl font-bold text-red-700 text-center md:text-left">{data.signals.lost_sales}</div>
            </div>
            <div className="glass-card p-2 md:p-5 rounded-xl md:rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-amber-50/50">
              <div className="text-[8px] md:text-xs font-bold text-amber-600/70 uppercase tracking-wider mb-1 md:mb-2 flex flex-col xl:flex-row items-center md:items-start gap-1 md:gap-2 text-center md:text-left"><span className="text-sm md:text-base">⚠️</span> <span className="leading-tight">Complaints</span></div>
              <div className="text-lg md:text-3xl font-bold text-amber-700 text-center md:text-left">{data.signals.complaints}</div>
            </div>
            <div className="glass-card p-2 md:p-5 rounded-xl md:rounded-2xl flex flex-col justify-center border border-brand-dark/10 shadow-sm bg-green-50/50">
              <div className="text-[8px] md:text-xs font-bold text-green-600/70 uppercase tracking-wider mb-1 md:mb-2 flex flex-col xl:flex-row items-center md:items-start gap-1 md:gap-2 text-center md:text-left"><span className="text-sm md:text-base">🛒</span> <span className="leading-tight">Purchase Intent</span></div>
              <div className="text-lg md:text-3xl font-bold text-green-700 text-center md:text-left">{data.signals.purchase_intent}</div>
            </div>
          </div>

          {/* Business Memory Timeline */}
          <div className="glass-card rounded-xl md:rounded-3xl p-4 md:p-8 border border-brand-dark/10 shadow-sm">
            <h2 className="text-sm md:text-xl font-bold text-brand-dark mb-4 md:mb-6 flex items-center gap-2">
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
                  <div key={i} className="relative pl-6 md:pl-10">
                    <div className={`absolute left-0 top-0.5 md:top-1 w-5 h-5 md:w-8 md:h-8 rounded-full ${iconBg} flex items-center justify-center border-2 border-white shadow-sm text-[8px] md:text-xs`}>{icon}</div>
                    <div className="text-[10px] md:text-xs font-bold text-brand-dark/50 mb-0.5 md:mb-1">{dateStr}</div>
                    <div className="font-semibold text-brand-dark text-xs md:text-lg leading-tight md:leading-normal">{m.text}</div>
                    <div className={`mt-1 md:mt-2 inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-[8px] md:text-xs font-bold ${colorClass}`}>{m.intent}</div>
                  </div>
                );
              })}
          </div>
        </div>
        </div>

        {/* Right Column: Patterns & Daily Summary */}
        <div className="col-span-1 flex flex-col gap-3 md:gap-6">
          
          {/* Daily Summary */}
          <div className="bg-[#2a1c17] dark:bg-black/40 rounded-xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden border border-white/5">
            <div className="absolute -right-5 -top-5 md:-right-10 md:-top-10 w-16 h-16 md:w-32 md:h-32 bg-brand-brown/30 rounded-full blur-xl md:blur-2xl"></div>
            <h2 className="text-[9px] md:text-sm font-bold uppercase tracking-wider text-white/60 mb-2 md:mb-4">Latest Summary</h2>
            <div className="text-xl md:text-3xl font-bold mb-1">Today</div>
            <div className="text-white/80 mb-3 md:mb-6 border-b border-white/10 pb-2 md:pb-4">
              <ul className="space-y-1 md:space-y-2 text-[10px] md:text-sm font-medium">
                <li className="flex justify-between"><span>Total Enquiries:</span> <span className="font-bold text-white">{data.signals.total_enquiries}</span></li>
                <li className="flex justify-between"><span>Purchase-Ready:</span> <span className="font-bold text-green-400">{data.signals.purchase_intent}</span></li>
                <li className="flex justify-between"><span>Complaints:</span> <span className="font-bold text-red-400">{data.signals.complaints}</span></li>
              </ul>
              <div className="mb-2 md:mb-4">
                <div className="text-[9px] md:text-xs text-white/50 uppercase font-bold mb-1">Top Archetype</div>
                <div className="font-semibold text-xs md:text-base leading-tight">{data.archetypes?.[0]?.name || "Not enough data"}</div>
              </div>
              <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4 border border-white/10">
                <div className="text-[9px] md:text-xs text-brand-lightbrown uppercase font-bold mb-1 flex items-center gap-1 md:gap-2"><span>✨</span> Recommendation</div>
                <div className="text-[10px] md:text-sm font-medium leading-tight md:leading-relaxed">{data.archetypes?.[0]?.drift || "Collect more customer interactions to unlock recommendations."}</div>
              </div>
            </div>
          </div>

          {/* Pattern Discovery */}
          <div className="glass-card rounded-xl md:rounded-3xl p-4 md:p-6 border border-brand-dark/10 shadow-sm">
            <h2 className="text-sm md:text-lg font-bold text-brand-dark mb-2 md:mb-4 flex items-center gap-1 md:gap-2">
              <span>🔮</span> Pattern Discovery
            </h2>
            <p className="text-[9px] md:text-xs font-bold text-brand-dark/50 uppercase mb-2 md:mb-4">Morlen Noticed...</p>
            <ul className="space-y-2 md:space-y-4">
              <li className="flex items-start gap-1.5 md:gap-3">
                <div className="text-xs md:text-lg mt-0.5">⚠️</div>
                <div className="text-[10px] md:text-sm font-medium text-brand-dark leading-tight"><strong className="text-brand-brown block md:inline">Key Complaint:</strong> {data.top_complaint || "None"}</div>
              </li>
              <li className="flex items-start gap-1.5 md:gap-3">
                <div className="text-xs md:text-lg mt-0.5">⭐</div>
                <div className="text-[10px] md:text-sm font-medium text-brand-dark leading-tight"><strong className="text-green-700 block md:inline">Top Praise:</strong> {data.top_praise || "None"}</div>
              </li>
            </ul>
          </div>

          {/* Intelligence Score */}
          <div className="glass-card rounded-xl md:rounded-3xl p-3 md:p-6 border border-brand-dark/10 shadow-sm flex items-center gap-2 md:gap-4">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-green-500 flex items-center justify-center text-xs md:text-xl font-bold text-green-600 flex-shrink-0">
              72%
            </div>
            <div>
              <div className="font-bold text-brand-dark text-xs md:text-base leading-tight">Business Intelligence</div>
              <div className="text-[9px] md:text-xs text-brand-dark/60 font-semibold text-green-600 flex items-center gap-1"><span>↑</span> Growing</div>
              <div className="text-[8px] md:text-[10px] text-brand-dark/40 mt-0.5 md:mt-1">Based on 218 interactions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
