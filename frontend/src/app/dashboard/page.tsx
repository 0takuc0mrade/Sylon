"use client";

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { User, Mail, ShieldCheck, Link2, CreditCard, ChevronRight, MessageCircle, Globe, Camera } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function Dashboard() {
  const { user, authenticated, logout } = usePrivy();

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-lightbrown border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Extract best available name
  const displayName = user?.email?.address?.split("@")[0] || (user as any)?.google?.name || "Morlen User";
  const displayEmail = user?.email?.address || (user as any)?.google?.email || "No email provided";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-brand-dark text-white p-4 md:p-6 lg:p-8 pt-20 md:pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-brand-lightbrown tracking-tight">Your Memory Core</h1>
            <p className="text-white/60 text-lg">Manage your account, connections, and AI memory settings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Profile Card */}
            <div className="col-span-1 md:col-span-1 rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md flex flex-col items-center text-center space-y-4 shadow-xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-lightbrown to-brand-brown flex items-center justify-center shadow-lg border-4 border-brand-dark">
                <User className="w-10 h-10 text-brand-dark" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                <p className="text-white/50 text-sm flex items-center justify-center gap-1 mt-1">
                  <Mail className="w-3 h-3" /> {displayEmail}
                </p>
              </div>
              <div className="w-full h-px bg-white/10 my-2"></div>
              <div className="w-full flex justify-between items-center px-2">
                <span className="text-sm text-white/50">Status</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold border border-green-500/30">Active</span>
              </div>
              <div className="w-full flex justify-between items-center px-2">
                <span className="text-sm text-white/50">Plan</span>
                <span className="text-sm font-semibold text-brand-lightbrown flex items-center gap-1">Enterprise <ShieldCheck className="w-4 h-4"/></span>
              </div>
              <button 
                onClick={logout}
                className="w-full mt-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white/70 font-medium text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Main Content Area */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              
              {/* Linked Accounts */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5 sm:p-6 md:p-8 backdrop-blur-md shadow-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <Link2 className="w-5 h-5 text-brand-lightbrown" /> Connected Identities
                </h3>
                
                <div className="space-y-4">
                  {user?.google ? (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/10"><Globe className="w-5 h-5 text-white/80" /></div>
                        <div>
                          <p className="font-semibold text-sm">Google Account</p>
                          <p className="text-xs text-white/50">Connected</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">Synced</span>
                    </div>
                  ) : null}

                  {user?.email ? (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/10"><Mail className="w-5 h-5 text-white/80" /></div>
                        <div>
                          <p className="font-semibold text-sm">Email Address</p>
                          <p className="text-xs text-white/50">{user.email.address}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">Primary</span>
                    </div>
                  ) : null}
                  
                  {user?.wallet ? (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/10"><ShieldCheck className="w-5 h-5 text-white/80" /></div>
                        <div>
                          <p className="font-semibold text-sm">Web3 Wallet</p>
                          <p className="text-xs text-white/50">{user.wallet.address.slice(0,6)}...{user.wallet.address.slice(-4)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-lightbrown bg-brand-lightbrown/10 px-3 py-1 rounded-full border border-brand-lightbrown/20">Verified</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Data Integrations Snapshot */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5 sm:p-6 md:p-8 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-lightbrown" /> Memory Sources
                  </h3>
                  <a href="/upload" className="text-sm font-semibold text-brand-lightbrown hover:text-white transition-colors flex items-center gap-1">
                    Manage <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 text-left sm:text-center">
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                    <span className="text-xs font-semibold text-white/70">WhatsApp</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 text-left sm:text-center">
                    <Camera className="w-6 h-6 text-[#E1306C]" />
                    <span className="text-xs font-semibold text-white/70">Instagram</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 text-left sm:text-center opacity-50">
                    <Globe className="w-6 h-6 text-[#1877F2]" />
                    <span className="text-xs font-semibold text-white/70">Facebook</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
