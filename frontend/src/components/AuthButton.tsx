"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function AuthButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <div className="h-9 w-20 rounded-full bg-brand-dark/10 dark:bg-white/10 animate-pulse" />
    );
  }

  if (authenticated) {
    const displayName =
      user?.email?.address?.split("@")[0] ||
      (user as any)?.google?.name ||
      "User";

    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-brand-dark dark:text-white/90 hidden md:inline truncate max-w-[120px]">
          {displayName}
        </span>
        <button
          onClick={logout}
          className="text-xs sm:text-sm font-bold text-brand-dark dark:text-white/80 border border-brand-dark/20 dark:border-white/20 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full hover:bg-brand-dark/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown px-4 sm:px-6 py-1.5 sm:py-2 rounded-full hover:opacity-90 shadow-md transition-opacity whitespace-nowrap"
    >
      Sign In
    </button>
  );
}
