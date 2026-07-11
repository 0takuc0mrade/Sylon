"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { Building2, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const [businessName, setBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    setIsSubmitting(true);
    
    // Save to local storage for the demo flow
    localStorage.setItem('morlen_business_name', businessName);
    localStorage.setItem('morlen_demo_mode', 'true');
    localStorage.setItem('morlen_onboarded', 'true');

    // Simulate a brief API delay for realism
    setTimeout(() => {
      router.push('/upload');
    }, 800);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-brand-glow/20 via-transparent to-transparent opacity-50 pointer-events-none blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-lightbrown to-brand-brown flex items-center justify-center shadow-lg border border-white/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-brand-dark dark:text-white tracking-tight">Welcome to Morlen</h1>
                <p className="text-brand-dark/70 dark:text-white/60 text-sm">
                  Let's personalize your AI Chief of Staff. What is the name of your business?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Lekki Luxury"
                    className="w-full bg-black/5 dark:bg-black/20 border border-brand-dark/10 dark:border-white/10 rounded-xl px-4 py-4 text-brand-dark dark:text-white placeholder:text-brand-dark/30 dark:placeholder:text-white/30 focus:outline-none focus:border-brand-lightbrown focus:ring-1 focus:ring-brand-lightbrown transition-all"
                    required
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!businessName.trim() || isSubmitting}
                  className="w-full bg-brand-brown hover:opacity-90 text-white rounded-xl py-4 font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
