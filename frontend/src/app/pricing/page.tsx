"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import WaitlistModal from '@/components/WaitlistModal';

export default function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  
  useGSAP(() => {
    gsap.fromTo(".fade-up", 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-brand-dark text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-50">
        <Link href="/" className="text-xl font-bold tracking-widest text-brand-lightbrown">
          MORLEN
        </Link>
        <Link href="/" className="text-sm font-semibold hover:text-brand-lightbrown transition-colors">
          Back to Home
        </Link>
      </nav>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand-lightbrown/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-brand-glow/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-32 pb-24 z-10 w-full max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white">
            Pricing that scales with your growth.
          </h1>
          <p className="text-lg md:text-xl text-white/60">
            Morlen aligns its success with yours. We don't charge per seat or per message. We charge based on the value we generate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl fade-up">
          
          {/* Pro Tier */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10 backdrop-blur-xl flex flex-col relative overflow-hidden group hover:border-brand-lightbrown/30 transition-colors">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <p className="text-white/60 text-sm">For growing brands that need an autonomous sales team.</p>
            </div>
            
            <div className="mb-8 border-b border-white/10 pb-8">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold">₦40,000</span>
                <span className="text-white/50 mb-1">/ month</span>
              </div>
              <p className="text-sm text-brand-lightbrown font-semibold">+ 2% on AI-closed sales</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <CheckIcon /> Unlimited Conversations
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /> Autonomous Negotiation Engine
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /> CRM & Inventory Sync
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /> Action Inbox Approvals
              </li>
              <li className="flex items-center gap-3 text-white/40">
                <CrossIcon /> Dedicated Strategy Consultant
              </li>
            </ul>

            <button onClick={() => setIsWaitlistOpen(true)} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors">
              Join Waitlist
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-3xl border border-brand-lightbrown/50 bg-gradient-to-b from-brand-lightbrown/10 to-transparent p-8 md:p-10 backdrop-blur-xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-brand-lightbrown text-brand-dark text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Recommended
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2 text-brand-lightbrown">Enterprise</h3>
              <p className="text-white/60 text-sm">For high-volume operations requiring deep integration.</p>
            </div>
            
            <div className="mb-8 border-b border-white/10 pb-8">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold">Custom</span>
              </div>
              <p className="text-sm text-brand-lightbrown font-semibold">Volume-based pricing</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <CheckIcon color="#d7b889" /> Everything in Growth
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon color="#d7b889" /> Custom LLM Fine-tuning
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon color="#d7b889" /> Multi-channel support (IG, FB, Web)
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon color="#d7b889" /> API Access & Webhooks
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon color="#d7b889" /> Dedicated Strategy Consultant
              </li>
            </ul>

            <button onClick={() => setIsWaitlistOpen(true)} className="w-full py-4 rounded-xl bg-brand-lightbrown text-brand-dark hover:opacity-90 font-bold transition-opacity">
              Contact Sales
            </button>
          </div>

        </div>
      </main>
      
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />
    </div>
  );
}

function CheckIcon({ color = "white" }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
