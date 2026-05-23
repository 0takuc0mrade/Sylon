'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import EtherealOrb from "@/components/EtherealOrb";
import { ConversationProvider } from "@elevenlabs/react";
import AuthGuard from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePrivy } from "@privy-io/react-auth";

type ChatMessage = {
  role: string;
  content: string;
};

type ChatResponse = {
  response: string;
  business_id?: string | null;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const initChat = async () => {
      initialized.current = true;
      if (!businessId) {
        setMessages([{ role: 'assistant', content: 'I am Sylon, your premium business strategist. Please ingest data first to unlock my full potential.' }]);
        return;
      }

      setLoading(true);
      try {
        const token = await getAccessToken();
        const authHeaders: Record<string, string> = { 
          'Bypass-Tunnel-Reminder': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
        };
        const historyRes = await fetch(`/api/chat/history/${businessId}`, { headers: authHeaders });
        const historyData = await historyRes.json();
        
        if (historyData.status === 'ok' && historyData.history && historyData.history.length > 0) {
          setMessages(historyData.history);
        } else {
          // Proactive Greeting
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ 
              text: "I just uploaded my customer data. Please summarize the customer archetypes you found and give me one actionable recommendation based on the top pain points.", 
              business_id: businessId 
            })
          });
          const data = await res.json();
          setMessages([
            { role: 'assistant', content: data.response }
          ]);
        }
      } catch (err) {
        setMessages([{ role: 'assistant', content: 'I am Sylon, your premium business strategist. How can I assist you?' }]);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [businessId]);

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
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
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
      const data: ChatResponse = await res.json();
      if (data.business_id) {
        setBusinessId(data.business_id);
        localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.business_id);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col md:flex-row flex-1 animate-in fade-in duration-500 text-brand-dark dark:text-gray-100 gap-4 md:gap-8 items-stretch min-h-0">
      
      {/* Left Panel: The Ethereal Orb — Desktop */}
      <div className="hidden md:flex w-full md:w-[55%] flex-col items-center justify-center">
        <ConversationProvider>
          <EtherealOrb onTranscription={handleTranscription} />
        </ConversationProvider>
      </div>

      {/* Right Panel: Text Chat */}
      <div className="w-full md:w-[45%] flex flex-col flex-1 md:flex-initial md:h-full min-h-0">
        <header className="mb-4 md:mb-6 pt-2 md:pt-0 flex-shrink-0">
          <h1 className="page-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">Sylon Cognitive Core</h1>
          <p className="page-subtitle font-medium text-sm md:text-base">Simulate changes, ask for recommendations, or discuss strategy.</p>
        </header>

        {/* Ethereal Orb — Mobile */}
        <div className="md:hidden flex w-full justify-center mt-2 mb-2">
          <div className="transform scale-75 origin-top">
            <ConversationProvider>
              <EtherealOrb onTranscription={handleTranscription} isMobile={true} />
            </ConversationProvider>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-3 sm:p-4 md:p-6 flex flex-col flex-1 overflow-hidden shadow-sm min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-3 sm:p-4 rounded-2xl text-sm sm:text-base ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-brand-lightbrown to-brand-brown text-white rounded-br-sm shadow-md' 
                    : 'glass-card rounded-bl-sm font-medium text-brand-dark dark:text-white'
                }`}
              >
                  {m.content}
                </div>
                <div className={`text-xs text-brand-dark dark:text-white/50 mt-1 font-semibold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.role === 'user' ? 'You' : 'Sylon'}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start max-w-[90%] sm:max-w-[80%]">
                <div className="p-3 sm:p-4 rounded-2xl glass-card rounded-bl-sm italic font-medium text-sm sm:text-base">
                  Thinking...
                </div>
              </div>
            )}
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
