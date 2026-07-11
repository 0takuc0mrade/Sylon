"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AuthGuard from '@/components/AuthGuard';
import { 
  TrendingUp, AlertCircle, ShoppingBag, DollarSign, 
  ChevronRight, Calendar, ArrowUpRight, BarChart2, ShieldCheck, Mail, MessageCircle, Globe, Camera, Loader2
} from 'lucide-react';
import Link from 'next/link';
import MermaidGraph from '@/components/MermaidGraph';

export default function Dashboard() {
  const { user, logout } = usePrivy();
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [briefData, setBriefData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBrief() {
      if (!user) return;
      try {
        const businessId = localStorage.getItem('morlen_business_id') || `biz_${user.id}`;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sylon.onrender.com';
        const res = await fetch(`${apiUrl}/api/intelligence/brief/${businessId}`);
        const data = await res.json();
        if (data.status === 'ok') {
          setBriefData(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch intelligence brief", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBrief();
  }, [user]);

  const generateMermaidDef = (topologicalGraph: any) => {
    if (!topologicalGraph || !topologicalGraph.graph) return '';
    let def = 'graph TD\n';
    
    // Add nodes with revenue data
    topologicalGraph.graph.nodes.forEach((node: string, index: number) => {
      const revenue = topologicalGraph.revenue_map?.[node] || 0;
      const cleanNode = node.replace(/[^a-zA-Z0-9]/g, '_');
      def += `    ${cleanNode}["${node}<br/>₦${revenue.toLocaleString()}"]\n`;
      
      // Style the first node in the optimal sequence (the bottleneck) differently
      if (topologicalGraph.optimal_sequence && topologicalGraph.optimal_sequence[0] === node) {
        def += `    style ${cleanNode} fill:#ff4444,stroke:#333,stroke-width:4px,color:#fff\n`;
      } else {
        def += `    style ${cleanNode} fill:#2a2a2a,stroke:#c4a47c,stroke-width:2px,color:#fff\n`;
      }
    });

    // Add edges
    if (topologicalGraph.graph.edges) {
      topologicalGraph.graph.edges.forEach((edge: any) => {
        const from = edge.blocked_by.replace(/[^a-zA-Z0-9]/g, '_');
        const to = edge.sku.replace(/[^a-zA-Z0-9]/g, '_');
        def += `    ${from} -->|Blocks| ${to}\n`;
      });
    }
    return def;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen text-brand-dark dark:text-white p-4 md:p-8 pt-20 md:pt-24 pb-32 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 dark:border-white/10 pb-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-brand-dark dark:text-brand-lightbrown tracking-tight">Today's Executive Brief</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-brand-dark/60 dark:text-white/60 text-lg">Thursday, July 10, 2026. Here is where your revenue is hiding today.</p>
                <Link href="/upload" className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/20 hover:bg-green-500/20 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  42 Signals Analyzed • 8 Contacts Excluded
                </Link>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/chat" className="px-5 py-2.5 bg-gradient-to-r from-brand-brown to-brand-lightbrown text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Ask Morlen
              </Link>
              <button className="px-5 py-2.5 bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 text-brand-dark dark:text-white font-bold text-sm rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                Generate Growth Plan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            
            {/* Left/Main Column: Opportunities */}
            <div className="xl:col-span-2 space-y-6 md:space-y-8">
              
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> Top Revenue Opportunities
              </h2>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-brand-dark/10 dark:border-white/10 backdrop-blur-md">
                  <Loader2 className="w-10 h-10 animate-spin text-brand-lightbrown mb-4" />
                  <p className="font-bold text-lg">Morlen is analyzing your recent customer signals...</p>
                  <p className="text-brand-dark/60 dark:text-white/60 text-sm">Extracting revenue opportunities.</p>
                </div>
              ) : !briefData ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-brand-dark/10 dark:border-white/10 backdrop-blur-md">
                  <p className="font-bold text-lg">No intelligence data available.</p>
                  <p className="text-brand-dark/60 dark:text-white/60 text-sm">Connect your WhatsApp to start gathering signals.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Dynamic Opportunities */}
                    {briefData.opportunities?.map((opp: any, idx: number) => (
                      <div key={idx} className="rounded-3xl bg-green-500/5 border border-green-500/20 p-6 flex flex-col hover:bg-green-500/10 transition-colors cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                          <span className="flex w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <h3 className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">{opp.title}</h3>
                        <p className="text-lg font-bold text-brand-dark dark:text-white mb-4">{opp.product_or_metric}</p>
                        
                        {opp.evidence && opp.evidence.length > 0 && (
                          <div className="mb-4 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5">
                            <p className="text-xs font-bold text-brand-dark/50 dark:text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" /> Evidence
                            </p>
                            <ul className="space-y-1">
                              {opp.evidence.map((ev: string, i: number) => (
                                <li key={i} className="text-xs text-brand-dark/70 dark:text-white/70 flex items-start gap-1">
                                  <span className="text-green-500 mt-0.5">•</span> {ev}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-2 border-t border-brand-dark/5 dark:border-white/5">
                          <p className="text-xs text-brand-dark/50 dark:text-white/50 mb-1">{opp.metric_label}</p>
                          <p className="text-3xl font-bold text-brand-dark dark:text-white flex items-center gap-2">
                            {opp.value_metric} <ArrowUpRight className="w-5 h-5 text-green-500" />
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Dynamic Warnings */}
                    {briefData.warnings?.map((warn: any, idx: number) => (
                      <div key={idx} className={`rounded-3xl border p-6 flex flex-col cursor-pointer transition-colors ${
                        warn.type === 'pricing' ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10' :
                        warn.type === 'Insufficient Data' ? 'bg-brand-dark/5 border-brand-dark/20 dark:bg-white/5 dark:border-white/20' :
                        'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                      }`}>
                        <h3 className={`text-sm font-bold mb-1 flex items-center gap-1 ${
                          warn.type === 'pricing' ? 'text-yellow-600 dark:text-yellow-400' :
                          warn.type === 'Insufficient Data' ? 'text-brand-dark/70 dark:text-white/70' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {warn.type === 'pricing' ? <AlertCircle className="w-4 h-4" /> : 
                           warn.type === 'Insufficient Data' ? <BarChart2 className="w-4 h-4" /> :
                           <ShoppingBag className="w-4 h-4" />} {warn.title}
                        </h3>
                        <p className="text-lg font-bold text-brand-dark dark:text-white mb-4">{warn.description}</p>
                        
                        {warn.evidence && warn.evidence.length > 0 && (
                          <div className="mt-auto p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${warn.type === 'pricing' ? 'text-yellow-600/70' : 'text-red-600/70'}`}>
                              <BarChart2 className="w-3 h-3" /> Evidence
                            </p>
                            <ul className="space-y-1">
                              {warn.evidence.map((ev: string, i: number) => (
                                <li key={i} className="text-xs text-brand-dark/70 dark:text-white/70 flex items-start gap-1">
                                  <span className={`${warn.type === 'pricing' ? 'text-yellow-500' : 'text-red-500'} mt-0.5`}>•</span> {ev}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Topological Graph */}
                  {briefData.topological_graph && briefData.topological_graph.optimal_sequence && (
                    <div className="mt-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 p-6 md:p-8 backdrop-blur-md shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-brand-lightbrown" /> Topological Dependency Graph
                        </h3>
                        <span className="text-xs font-bold px-3 py-1 bg-brand-lightbrown/20 text-brand-lightbrown rounded-full">Kahn's Algorithm</span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-brand-lightbrown/10 rounded-2xl border border-brand-lightbrown/20">
                          <div>
                            <p className="text-xs text-brand-dark/60 dark:text-white/60 uppercase tracking-wider mb-1">Total Graph Blockage</p>
                            <p className="text-2xl font-bold font-mono text-brand-lightbrown">₦{briefData.topological_graph.total_at_risk?.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-brand-dark/60 dark:text-white/60 uppercase tracking-wider mb-1">Optimal Unblock Sequence</p>
                            <p className="text-lg font-bold text-brand-dark dark:text-white">{briefData.topological_graph.optimal_sequence.length} Steps</p>
                          </div>
                        </div>

                        {/* Mermaid Visualization */}
                        <div className="pt-4 border-t border-brand-dark/10 dark:border-white/10 overflow-hidden">
                           <MermaidGraph graphDefinition={generateMermaidDef(briefData.topological_graph)} />
                        </div>

                        <div className="pt-4 border-t border-brand-dark/10 dark:border-white/10">
                          <p className="text-xs font-bold text-brand-dark/50 dark:text-white/50 mb-3">MATHEMATICAL RESOLUTION PATH:</p>
                          <div className="flex flex-col gap-2">
                            {briefData.topological_graph.optimal_sequence.map((node: string, i: number) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-dark dark:bg-white text-white dark:text-brand-dark text-xs font-bold">
                                  {i + 1}
                                </div>
                                <div className="flex-1 p-3 bg-white dark:bg-brand-dark border border-brand-dark/10 dark:border-white/10 rounded-xl flex justify-between items-center">
                                  <span className="font-semibold text-sm">{node}</span>
                                  <span className="text-xs font-mono bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-md">
                                    +₦{briefData.topological_graph.revenue_map[node]?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Autopilot Action */}
                        {briefData.autopilot_action && (
                          <div className="mt-6 pt-6 border-t border-brand-dark/10 dark:border-white/10">
                            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brand-lightbrown">
                              <ShieldCheck className="w-4 h-4" /> Track 4: Autopilot Agent Action
                            </h4>
                            <div className="p-4 bg-brand-dark text-white rounded-2xl font-mono text-sm shadow-xl">
                              <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
                                <div>
                                  <span className="opacity-60 text-xs">ACTION: </span>
                                  <span className="text-green-400 font-bold">{briefData.autopilot_action.action_type.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="opacity-60 text-xs">CONFIDENCE: </span>
                                  <span className="text-yellow-400 font-bold">{(briefData.autopilot_action.confidence * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                              <p className="mb-2"><span className="opacity-60">TO:</span> {briefData.autopilot_action.recipient}</p>
                              <p className="mb-4"><span className="opacity-60">SUBJECT:</span> {briefData.autopilot_action.subject}</p>
                              <p className="whitespace-pre-wrap opacity-90 p-3 bg-white/5 rounded-lg border border-white/10">
                                {briefData.autopilot_action.content}
                              </p>
                              <button className="mt-4 w-full py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors">
                                Approve & Execute Autopilot Action
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Timeline */}
                  {briefData.timeline && briefData.timeline.events && briefData.timeline.events.length > 0 && (
                    <div className="mt-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 p-6 md:p-8 backdrop-blur-md shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-brand-lightbrown" /> Opportunity Timeline: {briefData.timeline.product}
                        </h3>
                        <span className="text-xs font-bold px-3 py-1 bg-brand-lightbrown/20 text-brand-lightbrown rounded-full">Trend Confirmed</span>
                      </div>

                      <div className="relative border-l border-brand-dark/20 dark:border-white/20 ml-3 space-y-6">
                        {briefData.timeline.events.map((event: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            {event.is_recommendation ? (
                              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-lightbrown ring-4 ring-brand-lightbrown/20"></div>
                            ) : (
                              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-dark/20 dark:bg-white/20"></div>
                            )}
                            <p className={`text-xs font-mono font-bold mb-1 ${event.is_recommendation ? 'text-brand-lightbrown' : 'text-brand-dark/50 dark:text-white/50'}`}>
                              {event.day.toUpperCase()}
                            </p>
                            <p className="text-sm font-semibold">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Mini Settings & Analytics */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Decision History */}
              <div className="rounded-3xl bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 p-6 backdrop-blur-md shadow-xl">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-brand-dark/60 dark:text-white/60 uppercase tracking-wider">
                  Decision History
                </h3>
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-brand-dark/5 dark:border-white/5">
                  <p className="text-xs text-brand-dark/50 dark:text-white/50 mb-1">Two weeks ago</p>
                  <p className="text-sm font-bold mb-2">Recommendation: Increase perfume price by 5%.</p>
                  <div className="flex items-center gap-2 mt-3 p-2 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Ignored. Estimated missed revenue: ₦71,000</p>
                  </div>
                </div>
              </div>

              {/* Guardrails (Compact) */}
              <div className="rounded-3xl bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 p-6 backdrop-blur-md shadow-xl">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-brand-dark/60 dark:text-white/60 uppercase tracking-wider">
                  Autonomous Guardrails
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Margin-Safe Discounts</span>
                    <select defaultValue="Up to 10%" className="bg-transparent border border-brand-dark/20 dark:border-white/20 text-xs rounded-lg px-2 py-1 outline-none">
                      <option>Up to 5%</option>
                      <option>Up to 10%</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Loyalty Perks</span>
                    <div onClick={() => setLoyaltyEnabled(!loyaltyEnabled)} className="cursor-pointer">
                      <span className={`text-xs font-bold ${loyaltyEnabled ? 'text-green-500' : 'text-brand-dark/40'}`}>{loyaltyEnabled ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrations (Compact) */}
              <div className="rounded-3xl bg-black/5 dark:bg-white/5 border border-brand-dark/10 dark:border-white/10 p-6 backdrop-blur-md shadow-xl">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-brand-dark/60 dark:text-white/60 uppercase tracking-wider">
                  Signal Sources
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/30">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">WhatsApp Business</p>
                    <p className="text-xs text-green-500">Syncing Live</p>
                  </div>
                </div>
                
                <button onClick={logout} className="mt-8 text-xs text-brand-dark/40 dark:text-white/40 hover:text-brand-dark dark:hover:text-white transition-colors w-full text-left">
                  Sign out of Morlen
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
