'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Store, User, Sparkles, RefreshCw } from 'lucide-react';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  board_debate?: any;
  decision?: string;
  timestamp?: string;
};

export default function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'onboarding' | 'customer'>('onboarding');
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a unique session ID for this demo
    const stored = sessionStorage.getItem('morlen_demo_session');
    if (stored) {
      setSessionId(stored);
      // We could fetch history here, but for the demo we'll just start fresh or rely on state
    } else {
      const newSession = 'demo_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('morlen_demo_session', newSession);
      setSessionId(newSession);
      
      // Trigger initial onboarding message
      triggerOnboarding(newSession);
    }
  }, []);

  const triggerOnboarding = async (sid: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid, text: 'start', mode: 'onboarding' })
      });
      const data = await res.json();
      if (data.response) {
        setMessages([{ role: 'assistant', content: data.response }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReset = () => {
    const newSession = 'demo_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('morlen_demo_session', newSession);
    setSessionId(newSession);
    setMessages([]);
    setMode('onboarding');
    triggerOnboarding(newSession);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date().toISOString() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, text: userText, mode })
      });
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || '...', 
        board_debate: data.board_debate,
        decision: data.decision,
        timestamp: new Date().toISOString()
      }]);

      if (data.status === 'ready') {
        // Switch to customer mode after onboarding
        setMode('customer');
      }
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212] overflow-hidden text-brand-dark dark:text-gray-100">
      
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-[#1C1E21] border-b border-gray-200 dark:border-white/10 px-4 md:px-8 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-brown flex items-center justify-center text-white font-bold shadow-md">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              Morlen {mode === 'onboarding' ? 'Setup' : 'Live Agent'}
              {mode === 'customer' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
            </h1>
            <p className="text-xs text-brand-dark/60 dark:text-white/60">
              {mode === 'onboarding' ? 'Chat to build your workspace' : 'Acting as a customer messaging your business'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleReset}
          className="text-xs font-semibold flex items-center gap-1.5 text-brand-dark/70 dark:text-white/70 hover:text-brand-brown transition-colors px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Demo
        </button>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 mt-20">
              <Sparkles className="w-8 h-8 mb-4 text-brand-lightbrown animate-pulse" />
              <p>Initializing Morlen Intelligence...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                m.role === 'user' 
                  ? 'bg-brand-brown text-white rounded-br-sm' 
                  : 'bg-white dark:bg-[#1C1E21] border border-gray-100 dark:border-white/5 rounded-bl-sm'
              }`}>
                {/* Agent Role Badge */}
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2 opacity-60">
                    {mode === 'onboarding' ? <Store className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {mode === 'onboarding' ? 'Morlen Onboarding' : 'Morlen Agent'}
                    </span>
                  </div>
                )}
                
                <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.content}</div>

                {/* Debate Trace (Only visible in Customer mode for transparency) */}
                {m.board_debate && (
                  <div className="mt-4 pt-3 border-t border-brand-dark/10 dark:border-white/10">
                    <div className="text-[10px] font-bold uppercase text-brand-brown dark:text-brand-lightbrown mb-2 tracking-wider">
                      Internal Qwen Debate Route: {m.decision}
                    </div>
                    <div className="bg-gray-50 dark:bg-black/30 rounded-lg p-3 text-xs space-y-2">
                      {m.board_debate.cx && (
                        <div className="flex gap-2">
                          <span className="font-bold text-red-500">CX:</span> 
                          <span className="opacity-80">{m.board_debate.cx}</span>
                        </div>
                      )}
                      {m.board_debate.cfo && (
                        <div className="flex gap-2">
                          <span className="font-bold text-blue-500">CFO:</span> 
                          <span className="opacity-80">{m.board_debate.cfo}</span>
                        </div>
                      )}
                      {m.board_debate.ops && (
                        <div className="flex gap-2">
                          <span className="font-bold text-green-500">OPS:</span> 
                          <span className="opacity-80">{m.board_debate.ops}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white dark:bg-[#1C1E21] border border-gray-100 dark:border-white/5 rounded-2xl rounded-bl-sm p-4 shadow-sm max-w-[75%]">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-brand-lightbrown animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-brand-lightbrown animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-brand-lightbrown animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1C1E21] border-t border-gray-200 dark:border-white/10 p-4 md:p-6 pb-6 md:pb-8">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={mode === 'onboarding' ? "Reply to Morlen..." : "Message your business as a customer..."}
            className="w-full bg-gray-100 dark:bg-black/50 border border-transparent focus:border-brand-brown/50 rounded-full py-4 pl-6 pr-14 outline-none text-sm md:text-base transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-brown text-white rounded-full flex items-center justify-center hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
        {mode === 'customer' && (
          <div className="max-w-3xl mx-auto mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => setInput("How much is the red shoe?")} className="text-[10px] px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Test Pricing</button>
            <button type="button" onClick={() => setInput("Can you remove 5k from the price?")} className="text-[10px] px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Test Negotiation (Draft)</button>
            <button type="button" onClick={() => setInput("Your delivery guy stole my money!")} className="text-[10px] px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Test Escalation</button>
          </div>
        )}
      </div>
    </div>
  );
}
