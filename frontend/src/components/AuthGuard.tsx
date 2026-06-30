"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-lightbrown/30 border-t-brand-lightbrown rounded-full animate-spin" />
          <p className="text-brand-dark/60 dark:text-white/50 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-3xl p-10 md:p-14 max-w-md text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-lightbrown to-brand-brown flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">
              Sign in to continue
            </h2>
            <p className="text-brand-dark/70 dark:text-white/60 font-medium">
              Authenticate to access Sylon&apos;s business intelligence tools.
            </p>
          </div>
          <button
            onClick={login}
            className="text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown hover:opacity-90 px-8 py-3 rounded-full font-bold shadow-md transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
