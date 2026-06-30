'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import EtherealOrb from "@/components/EtherealOrb";
import { ConversationProvider } from "@elevenlabs/react";
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@/hooks/useMockPrivy";

import HistorySidebar from "@/components/HistorySidebar";

type ChatMessage = {
  role: string;
  content: string;
  isComparison?: boolean;
  timestamp?: string;
  comparison?: any | null;
  board_debate?: any | null;
};

type ChatResponse = {
  response: string;
  business_id?: string | null;
  comparison?: any | null;
  board_debate?: any | null;
};

const BUSINESS_ID_STORAGE_KEY = 'sylon_business_id';

export default function Chat() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}

function ChatContent() {
  const { getAccessToken } = usePrivy();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView();
    }, 100);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [businessId, setBusinessId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
  });
  const [input, setInput] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return new URLSearchParams(window.location.search).get('prompt') || '';
  });
  const [loading, setLoading] = useState(false);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (initializedFor.current === businessId) return;
    
    const initChat = async () => {
      initializedFor.current = businessId;
      if (!businessId) {
        setMessages([{ role: 'assistant', content: 'I am Sylon, your premium business strategist. Please ingest data first to unlock my full potential.' }]);
        return;
      }

      setLoading(true);
      try {
        const token = await getAccessToken();
        const authHeaders: Record<string, string> = { 
          'Bypass-Tunnel-Reminder': 'true',
          'Cache-Control': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
        };
        const historyRes = await fetch(`/api/chat/history/${businessId}?t=${Date.now()}`, { headers: authHeaders });
        const historyData = await historyRes.json();
        
        if (historyData.status === 'ok' && historyData.history && historyData.history.length > 0) {
          // Filter out the internal system prompt so it doesn't look like the user typed it
          const cleanHistory = historyData.history.filter((m: ChatMessage) => 
            !m.content.includes("I just connected my business data") && !m.content.includes("I just uploaded my customer data")
          );
          setMessages(cleanHistory);
        } else {
          // Proactive Greeting
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ 
              text: "I just connected my business data. Provide a highly generalized executive summary of my operations, customer sentiment, and pricing strategy. Do not fixate on specific products. Give me a high-level strategic overview of my business health based on the signals you ingested.", 
              business_id: businessId 
            })
          });
          const data = await res.json();
          setMessages([
            { role: 'assistant', content: data.response, comparison: data.comparison }
          ]);
        }
      } catch {
        setMessages([{ role: 'assistant', content: 'I am Sylon, your premium business strategist. How can I assist you?' }]);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [businessId, getAccessToken]);

  const handleTranscription = useCallback((role: string, text: string) => {
    setMessages(prev => {
      // Prevent double-replies from ElevenLabs event loops or React Strict Mode
      if (prev.length > 0 && prev[prev.length - 1].content === text) {
        return prev;
      }
      return [...prev, { role, content: text }];
    });
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const currentIsoTime = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: currentIsoTime }]);
    setInput('');
    setLoading(true);

    try {
      const payload: { text: string; business_id?: string } = { text: userText };
      if (businessId) {
        payload.business_id = businessId;
      }

      const token = await getAccessToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Bypass-Tunnel-Reminder': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      
      const data: ChatResponse = await res.json();
      if (data.business_id) {
        setBusinessId(data.business_id);
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.business_id);
      }
      
      const isComparison = userText.toLowerCase().includes('compare') || 
                           userText.toLowerCase().includes(' vs ') || 
                           userText.toLowerCase().includes('simulate') || 
                           userText.toLowerCase().includes('what if');
      const responseTime = new Date().toISOString();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, isComparison, board_debate: data.board_debate, timestamp: responseTime }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    if (!businessId) return;
    if (!confirm("Are you sure you want to clear your current session and delete all ingested data?")) return;
    
    setLoading(true);
    try {
      const token = await getAccessToken();
      await fetch(`/api/business/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
        }
      });
      setBusinessId(null);
      localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
      setMessages([{ role: 'assistant', content: 'I am Sylon, your premium business strategist. Session cleared. Please ingest new data to begin.' }]);
    } catch (err) {
      console.error("Failed to clear session:", err);
      alert("Failed to clear session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col md:flex-row flex-1 animate-in fade-in duration-500 text-brand-dark dark:text-gray-100 gap-4 md:gap-8 items-stretch min-h-0 relative">
      
      {/* History Sidebar */}
      <HistorySidebar 
        currentBusinessId={businessId} 
        onSelectSession={(id) => {
          setBusinessId(id);
          localStorage.setItem(BUSINESS_ID_STORAGE_KEY, id);
        }} 
      />

      {/* Left Panel: The Ethereal Orb — Desktop */}
      <div className="hidden md:flex w-full md:w-[55%] flex-col items-center justify-center pl-0 md:pl-12">
        <ConversationProvider>
          <EtherealOrb onTranscription={handleTranscription} />
        </ConversationProvider>
      </div>

      {/* Right Panel: Text Chat */}
      <div className="w-full md:w-[45%] flex flex-col flex-1 md:flex-initial min-h-[600px]">
        <header className="mb-4 md:mb-6 pt-14 md:pt-0 flex-shrink-0 flex justify-between items-start relative z-10">
          <div>
            <h1 className="page-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">Sylon Cognitive Core</h1>
            <p className="page-subtitle font-medium text-sm md:text-base">Simulate changes, ask for recommendations, or discuss strategy.</p>
          </div>
        </header>

                {/* Ethereal Orb — Mobile */}
        <div className={`md:hidden flex w-full justify-center mt-2 mb-2 transition-all duration-500 ${messages.length > 0 ? 'h-0 overflow-hidden opacity-0 scale-0' : 'h-auto'}`}>
          <div className="transform scale-[0.6] origin-top">
            <ConversationProvider>
              <EtherealOrb onTranscription={handleTranscription} isMobile={true} />
            </ConversationProvider>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-3 sm:p-4 md:p-6 flex flex-col flex-1 overflow-hidden shadow-sm min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 min-h-0 relative">
            {/* The Chat Interface */}
            
            {messages.map((m, i) => {
              return (
              <div key={i} className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-3 sm:p-4 rounded-2xl text-sm sm:text-base ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-brand-lightbrown to-brand-brown text-white rounded-br-sm shadow-md' 
                    : 'glass-card rounded-bl-sm font-medium text-brand-dark dark:text-white'
                }`}
              >
                  <MarkdownText text={m.content} />
                  {m.comparison && <ComparisonCard comparison={m.comparison} />}
                  {m.board_debate && <BoardDebateCard debate={m.board_debate} />}
                </div>
                <div className={`text-xs mt-1 font-semibold flex items-center gap-2 ${m.role === 'user' ? 'justify-end text-brand-dark dark:text-white/50' : 'justify-start text-brand-dark dark:text-white/50'}`}>
                  <span>{m.role === 'user' ? 'You' : 'Sylon'}</span>
                  {m.timestamp && (
                    <span className="opacity-60 font-normal text-[10px]">
                      {new Date(m.timestamp.endsWith('Z') ? m.timestamp : m.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
              );
            })}
            {loading && (
              <div className="self-start max-w-[90%] sm:max-w-[80%]">
                <div className="p-3 sm:p-4 rounded-2xl glass-card rounded-bl-sm italic font-medium text-sm sm:text-base">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setInput("Simulate Business Pivot: If I start closing at 6 PM instead of 10 PM to cut generator costs, how will my 'Loyalty Skeptics' react?")}
              className="text-xs font-bold bg-brand-lightbrown/10 hover:bg-brand-lightbrown/20 border border-brand-lightbrown/30 text-brand-brown dark:text-brand-lightbrown px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors"
            >
              Simulate Pivot
            </button>
            <button
              type="button"
              onClick={() => setInput("Request Service Optimization: My 'Experience Driven' archetype hates wait times. What are 3 zero-cost tweaks I can deploy tomorrow?")}
              className="text-xs font-bold bg-brand-lightbrown/10 hover:bg-brand-lightbrown/20 border border-brand-lightbrown/30 text-brand-brown dark:text-brand-lightbrown px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors"
            >
              Service Optimization
            </button>
            <button
              type="button"
              onClick={() => setInput("Generator diesel costs just spiked 20% overnight. Compare these survival options: raise prices by 15%, close the kitchen 2 hours earlier, or reduce menu size. Which is safest?")}
              className="text-xs font-bold bg-brand-lightbrown/10 hover:bg-brand-lightbrown/20 border border-brand-lightbrown/30 text-brand-brown dark:text-brand-lightbrown px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors"
            >
              Compare Decisions
            </button>
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 sm:gap-3 mt-auto flex-shrink-0">
            <input 
              className="flex-grow px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-brand-dark/30 dark:border-brand-brown/40 glass-card focus:outline-none focus:ring-2 focus:ring-brand-lightbrown w-full shadow-inner text-sm sm:text-base min-w-0"
              placeholder="Type your scenario here..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="glass-button px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold hover:bg-white/80 transition-all disabled:opacity-50 whitespace-nowrap text-sm sm:text-base flex-shrink-0"
              disabled={loading}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ comparison }: { comparison: ComparisonResult }) {
  const options = comparison.options || [];
  const riskClass = (risk: string) => {
    const normalized = risk.toLowerCase();
    if (normalized === 'high') return 'text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/30 border-red-200 dark:border-red-500/30';
    if (normalized === 'low') return 'text-green-700 dark:text-green-300 bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-500/30';
    return 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-500/30';
  };

  return (
    <div className="mt-4 rounded-2xl border border-brand-lightbrown/30 bg-white/60 dark:bg-black/20 p-3 md:p-4 shadow-inner w-full overflow-hidden break-words">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-brand-brown dark:text-brand-lightbrown">Decision Comparison</div>
          <h3 className="text-lg font-bold text-brand-dark dark:text-white">{comparison.title || 'Best Move To Make'}</h3>
        </div>
        {comparison.winner && (
          <div className="text-right text-xs">
            <div className="font-bold text-green-700 dark:text-green-300">Safest</div>
            <div className="font-semibold text-brand-dark dark:text-white max-w-[140px]">{comparison.winner}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <div key={`${option.rank}-${option.label}`} className="rounded-xl border border-brand-dark/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="font-bold text-brand-dark dark:text-white">
                #{option.rank} {option.label}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${riskClass(option.risk)}`}>
                {option.risk} risk
              </span>
            </div>
            <p className="text-sm text-brand-dark/80 dark:text-white/75 mb-2">{option.rationale}</p>
            {option.upside && <div className="text-xs font-semibold text-brand-brown dark:text-brand-lightbrown">Upside: {option.upside}</div>}
          </div>
        ))}
      </div>

      {(comparison.persona_churn_risk || comparison.riskiest_option) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {comparison.riskiest_option && (
            <div className="rounded-xl bg-red-50/80 dark:bg-red-900/20 p-3">
              <div className="font-bold text-red-700 dark:text-red-300">Watch Carefully</div>
              <div className="text-brand-dark dark:text-white">{comparison.riskiest_option}</div>
            </div>
          )}
          {comparison.persona_churn_risk && (
            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-900/20 p-3">
              <div className="font-bold text-amber-700 dark:text-amber-300">Churn Risk Persona</div>
              <div className="text-brand-dark dark:text-white">{comparison.persona_churn_risk}</div>
            </div>
          )}
        </div>
      )}

      {comparison.evidence_quotes && comparison.evidence_quotes.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-brand-dark/60 dark:text-white/50 mb-2">Evidence</div>
          <div className="space-y-2">
            {comparison.evidence_quotes.slice(0, 3).map((quote, index) => (
              <blockquote key={`${quote}-${index}`} className="border-l-2 border-brand-lightbrown pl-3 text-sm italic text-brand-dark/80 dark:text-white/75">
                &quot;{quote}&quot;
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {comparison.recommended_next_step && (
        <div className="mt-4 rounded-xl bg-brand-lightbrown/10 p-3 text-sm">
          <span className="font-bold text-brand-brown dark:text-brand-lightbrown">Next step: </span>
          <span className="text-brand-dark dark:text-white">{comparison.recommended_next_step}</span>
        </div>
      )}
    </div>
  );
}

// Simple markdown formatter for bold, italics, and lists
function MarkdownText({ text }: { text: string }) {
  const formatText = (content: string) => {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
    return html;
  };
  return <div className="space-y-1.5 leading-relaxed break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
}


function BoardDebateCard({ debate }: { debate: any }) {
  if (!debate || !debate.cfo) return null;
  
  return (
    <div className="mt-4 p-4 rounded-xl border border-brand-lightbrown/30 bg-black/20 flex flex-col gap-3">
      <div className="text-xs font-bold uppercase tracking-wider text-brand-lightbrown opacity-80 mb-1 border-b border-brand-lightbrown/20 pb-2">
        Internal Board of Directors Debate
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0 text-blue-300 font-bold text-xs border border-blue-500/30">CFO</div>
          <div className="text-sm opacity-90 leading-relaxed"><span className="font-semibold text-blue-300">Financial Impact:</span> {debate.cfo}</div>
        </div>
        
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0 text-red-300 font-bold text-xs border border-red-500/30">CX</div>
          <div className="text-sm opacity-90 leading-relaxed"><span className="font-semibold text-red-300">Customer Churn Risk:</span> {debate.cx}</div>
        </div>
        
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center flex-shrink-0 text-green-300 font-bold text-xs border border-green-500/30">OPS</div>
          <div className="text-sm opacity-90 leading-relaxed"><span className="font-semibold text-green-300">Operational Friction:</span> {debate.ops}</div>
        </div>
      </div>
    </div>
  );
}

function BusinessMemoryDashboard() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-700 w-full mb-6 mt-2">
      <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 border-b border-white/10 pb-2">Active Business Memory</div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
          <div className="text-2xl font-black text-brand-lightbrown">1,243</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Conversations</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-400"></div>
          <div className="text-2xl font-black text-orange-400">483</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Decision Signals</div>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
          <div className="text-2xl font-black text-brand-lightbrown">91</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Products Tracked</div>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
          <div className="text-2xl font-black text-brand-lightbrown">138</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Returning Cust.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Recent Signals */}
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl shadow-inner">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-lightbrown mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Real-Time Signals
          </h3>
          <div className="space-y-4">
            <div className="border-l-2 border-orange-400 pl-3">
              <p className="text-sm font-medium opacity-90 text-white">"Do you have Oraimo power banks?"</p>
              <div className="text-[10px] text-orange-400 font-bold uppercase mt-1 tracking-wider">WhatsApp &bull; 10 mins ago</div>
            </div>
            <div className="border-l-2 border-orange-400 pl-3">
              <p className="text-sm font-medium opacity-90 text-white">"Delivery took too long yesterday."</p>
              <div className="text-[10px] text-orange-400 font-bold uppercase mt-1 tracking-wider">Instagram &bull; 1 hour ago</div>
            </div>
            <div className="border-l-2 border-white/20 pl-3">
              <p className="text-sm font-medium opacity-70">"I need a screen guard for iPhone 13"</p>
              <div className="text-[10px] opacity-50 font-bold uppercase mt-1 tracking-wider">Facebook &bull; 2 hours ago</div>
            </div>
          </div>
        </div>

        {/* Detected Trends */}
        <div className="bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/20 p-4 rounded-2xl shadow-inner relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-orange-400 mb-4 relative z-10">Detected Intelligence Trends</h3>
          
          <div className="bg-black/40 p-3 rounded-xl mb-3 border border-white/5 relative z-10 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-sm text-white">Oraimo Demand Spike</div>
              <div className="text-xs font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-sm">+42%</div>
            </div>
            <p className="text-xs opacity-70">27 distinct requests across WhatsApp and Facebook in the last 48 hours.</p>
          </div>

          <div className="bg-black/40 p-3 rounded-xl border border-white/5 relative z-10 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-sm text-white">Weekend Wait Times</div>
              <div className="text-xs font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-sm">Critical</div>
            </div>
            <p className="text-xs opacity-70">Negative sentiment rising on Saturday afternoons due to understaffing.</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-4 mb-2">
         <div className="h-px bg-gradient-to-r from-transparent via-brand-lightbrown/30 to-transparent w-full"></div>
         <div className="px-4 text-[10px] font-bold uppercase tracking-widest text-brand-lightbrown opacity-60 whitespace-nowrap">Session Active</div>
         <div className="h-px bg-gradient-to-r from-brand-lightbrown/30 via-brand-lightbrown/30 to-transparent w-full"></div>
      </div>
    </div>
  );
}
