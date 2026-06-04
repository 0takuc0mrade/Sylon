"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

type SessionInfo = {
  business_id: string;
  created_at: string;
};

export default function HistorySidebar({
  currentBusinessId,
  onSelectSession,
}: {
  currentBusinessId: string | null;
  onSelectSession: (id: string) => void;
}) {
  const { getAccessToken } = usePrivy();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/business/list", {
          headers: {
            "Bypass-Tunnel-Reminder": "true",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.status === "ok" && data.businesses) {
          setSessions(data.businesses);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [getAccessToken]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking the session
    if (!window.confirm("Are you sure you want to permanently delete this chat history?")) return;

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/business/${id}`, {
        method: "DELETE",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.business_id !== id));
        if (currentBusinessId === id) {
          onSelectSession('');
        }
      } else {
        console.error("Failed to delete session");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 left-4 md:left-8 z-50 p-2 glass-card rounded-xl hover:bg-white/80 transition-all shadow-sm border border-brand-dark/10 dark:border-white/10"
        title="Session History"
      >
        <svg
          className="w-5 h-5 text-brand-dark dark:text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          )}
        </svg>
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-[73px] bottom-0 left-0 z-40 w-72 glass-card border-r border-brand-dark/10 dark:border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-brand-dark/10 dark:border-white/10 pt-14 md:pt-6">
          <h2 className="text-lg font-bold text-brand-dark dark:text-white">Session History</h2>
          <p className="text-xs text-brand-dark/60 dark:text-white/60 mt-1">
            Access your past simulations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-sm text-center text-brand-dark/50 p-4 animate-pulse">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-center text-brand-dark/50 p-4">No past sessions found.</div>
          ) : (
            sessions.map((s) => {
              const isActive = currentBusinessId === s.business_id;
              const dateString = s.created_at.endsWith('Z') ? s.created_at : s.created_at + 'Z';
              const date = new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
              return (
                <div key={s.business_id} className="relative group">
                  <button
                    onClick={() => {
                      onSelectSession(s.business_id);
                      if (window.innerWidth < 768) setIsOpen(false); // auto-close on mobile
                    }}
                    className={`w-full text-left p-3 pr-10 rounded-xl transition-all border ${
                      isActive
                        ? "bg-brand-lightbrown/20 border-brand-lightbrown text-brand-dark dark:text-white font-bold shadow-sm"
                        : "bg-white/40 dark:bg-black/20 border-transparent text-brand-dark/80 dark:text-white/80 hover:bg-white/60 hover:border-brand-dark/10"
                    }`}
                  >
                    <div className="text-sm truncate">
                      {s.business_id.startsWith('biz_demo') || s.business_id.startsWith('demo_') ? 'Sample Dataset' : 'Custom Upload'}
                    </div>
                    <div className="text-xs opacity-70 mt-1 font-mono">{date}</div>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => deleteSession(s.business_id, e)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Delete session"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
