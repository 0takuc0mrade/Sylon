"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type InsightData = {
  health_score: number;
  top_complaint: string;
  top_praise: string;
  archetypes: { name: string; drift: string; rating: number }[];
  history: { date: string; source: string; review_count: number }[];
};

export default function Insights() {
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
        const res = await fetch(`/api/business/${businessId}/dashboard`);
        const json = await res.json();
        
        if (json.status === "ok") {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load insights.");
        }
      } catch (err) {
        setError("Network error connecting to the engine.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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
          <h1 className="page-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Customer Insights</h1>
          <p className="page-subtitle font-medium text-sm md:text-base">Business Health & Excavated Archetypes</p>
        </div>
        <Link href="/chat" className="text-sm font-bold text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown px-6 py-3 rounded-full hover:opacity-90 shadow-lg hover:scale-105 transition-all whitespace-nowrap self-start sm:self-auto flex-shrink-0">
          Engage Cognitive Core
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Dashboard Area */}
        <div className="w-full lg:w-3/4 flex flex-col gap-8">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
              <div className="text-sm text-brand-dark/70 dark:text-white/60 font-semibold mb-2">Customer Health Score</div>
              <div className="text-5xl font-bold text-green-500">{data.health_score}%</div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col shadow-sm">
              <div className="text-sm text-brand-dark/70 dark:text-white/60 font-semibold mb-2">Top Complaint Thread</div>
              <div className="text-lg font-medium text-brand-dark dark:text-white mt-auto line-clamp-3">"{data.top_complaint}"</div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col shadow-sm">
              <div className="text-sm text-brand-dark/70 dark:text-white/60 font-semibold mb-2">Top Praise Thread</div>
              <div className="text-lg font-medium text-brand-dark dark:text-white mt-auto line-clamp-3">"{data.top_praise}"</div>
            </div>
          </div>

          {/* Archetypes Section */}
          <div>
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-6">Excavated Archetypes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.archetypes.length > 0 ? (
                data.archetypes.map((arch, i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl shadow-sm hover:border-brand-brown/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-brand-brown">{arch.name}</h3>
                      <div className="bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full text-sm font-bold text-brand-dark dark:text-white">
                        ★ {arch.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-sm text-brand-dark/70 dark:text-white/60 font-semibold mb-1">Behavioral Drift:</div>
                    <p className="text-brand-dark dark:text-white/90 italic line-clamp-3">"{arch.drift}"</p>
                  </div>
                ))
              ) : (
                <div className="glass-card p-6 rounded-2xl col-span-2 text-center italic opacity-70">
                  No archetypes have been excavated for this business yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Data Ingestion History */}
        <div className="w-full lg:w-1/4">
          <div className="glass-card p-6 rounded-3xl shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-brown" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Ingestion History
            </h2>
            
            <div className="flex flex-col gap-4">
              {data.history && data.history.length > 0 ? (
                data.history.map((batch, i) => (
                  <div key={i} className="border-l-2 border-brand-lightbrown/50 pl-4 py-1 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-brand-brown -left-[5px] top-2"></div>
                    <div className="text-xs font-bold text-brand-dark/60 dark:text-white/50 mb-1 uppercase tracking-wider">{batch.date}</div>
                    <div className="font-semibold text-brand-dark dark:text-white">{batch.review_count} Reviews Processed</div>
                    <div className="text-sm text-brand-dark/70 dark:text-white/70 italic">via {batch.source}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm italic opacity-70">No historical ingestion records found.</div>
              )}
            </div>
            
            <div className="mt-auto pt-8">
              <Link href="/upload" className="block text-center text-sm font-bold text-brand-brown hover:text-brand-dark dark:hover:text-white transition-colors">
                + Upload New Data
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
