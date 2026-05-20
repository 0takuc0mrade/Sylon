'use client';
import { useState } from 'react';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'I am Sylon, your premium business strategist. Ask me about a scenario or ask for a recommendation.' }
  ]);
  const [businessId, setBusinessId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col min-h-[calc(100dvh-120px)] md:h-[calc(100vh-80px)] animate-in fade-in duration-500">
      <header className="mb-6 pt-4 md:pt-8">
        <h1 className="page-heading text-3xl md:text-4xl font-bold mb-2">Strategist Oracle</h1>
        <p className="page-subtitle font-medium">Simulate changes, ask for recommendations, or discuss strategy.</p>
      </header>

      <div className="glass-card rounded-3xl p-4 md:p-6 flex flex-col flex-grow overflow-hidden shadow-sm">
        <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div className={`p-4 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-gradient-to-r from-brand-lightbrown to-brand-brown text-white rounded-br-sm shadow-md' 
                  : 'bg-white/90 dark:bg-black/40 backdrop-blur-md border border-brand-dark/20 dark:border-white/10 dark:text-white rounded-bl-sm'
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
            <div className="self-start max-w-[80%]">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-black/40 backdrop-blur-md border border-brand-dark/20 dark:border-white/10 text-brand-dark dark:text-white/60 rounded-bl-sm italic font-medium">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex flex-col sm:flex-row gap-3 mt-auto">
          <input 
            type="text" 
            className="flex-grow px-6 py-3 rounded-full border border-brand-dark/30 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-lightbrown text-brand-dark dark:text-white placeholder:text-brand-dark/50 dark:placeholder:text-white/40 w-full"
            placeholder="Type your scenario here..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="glass-button px-6 py-3 rounded-full font-bold hover:bg-white/80 transition-all disabled:opacity-50 whitespace-nowrap w-full sm:w-auto text-center justify-center flex"
            disabled={loading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
