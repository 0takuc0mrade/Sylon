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
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: "fadeIn 0.5s ease-out", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Strategist Oracle</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Simulate changes, ask for recommendations, or discuss strategy.</p>
      </header>

      <div className="glass-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ 
                background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.05)',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '16px',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              }}>
                {m.content}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'user' ? 'You' : 'Sylon'}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', borderBottomLeftRadius: '4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type your scenario here..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
