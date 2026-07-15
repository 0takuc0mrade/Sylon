"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ConversationProvider } from "@elevenlabs/react";
import EtherealOrb from "@/components/EtherealOrb";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import WaitlistModal from "@/components/WaitlistModal";

export default function Home() {
  const { login, authenticated, ready } = usePrivy();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated && typeof window !== 'undefined') {
      if (!localStorage.getItem('morlen_onboarded')) {
        router.push('/onboarding');
      }
    }
  }, [authenticated, ready, router]);

  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  // Background animation refs
  const bgRing1Ref = useRef<HTMLDivElement>(null);
  const bgRing2Ref = useRef<HTMLDivElement>(null);
  const nebulaGlowRef = useRef<HTMLDivElement>(null);

  // Text animation refs
  const heroTextRef = useRef<HTMLHeadingElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    // Staggered fade up for cards
    gsap.fromTo(
      [card1Ref.current, card2Ref.current, card3Ref.current],
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.6 }
    );

    // Hero Text Entrance
    gsap.fromTo(
      heroTextRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "power4.out", delay: 0.2 }
    );

    gsap.fromTo(
      subTextRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 1 }
    );

    // Continuous Background Animations
    gsap.to(bgRing1Ref.current, {
      rotation: 360,
      scale: 1.05,
      duration: 30,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(bgRing2Ref.current, {
      rotation: -360,
      scale: 1.1,
      duration: 40,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(nebulaGlowRef.current, {
      scale: 1.2,
      opacity: 0.8,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="font-sans text-brand-dark flex-grow flex flex-col relative overflow-x-hidden z-0">
      {/* Complex Background Layers */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        {/* Soft, billowy clouds at the bottom */}
        <div className="absolute bottom-[-20%] left-[-10%] right-[-10%] h-[80vh] bg-gradient-to-t from-[#fff5f0] via-brand-lightbrown/40 to-transparent blur-[100px] mix-blend-screen opacity-90" />

        {/* Sweeping glowing trails of light in background */}
        <div
          ref={bgRing1Ref}
          className="absolute top-[10%] left-[-30%] w-[160%] h-[80%] border-t-[8px] border-white/60 rounded-[100%] rotate-[-15deg] blur-[16px] mix-blend-overlay opacity-80"
        />
        <div
          ref={bgRing2Ref}
          className="absolute top-[5%] left-[-15%] w-[130%] h-[90%] border-b-[12px] border-brand-lightbrown/40 rounded-[100%] rotate-[10deg] blur-[24px] mix-blend-screen opacity-70"
        />

        {/* Additional radial glow for Warm Cosmic Nebula effect */}
        <div
          ref={nebulaGlowRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] bg-gradient-to-r from-brand-glow/40 to-brand-lightbrown/30 rounded-full blur-[140px] mix-blend-screen opacity-70"
        />
      </div>




      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-24 sm:pt-32 md:pt-40 pb-24 sm:pb-32 px-4 md:px-8 z-10 relative">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-auto perspective-1000 px-2">
          <h1
            ref={heroTextRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-brand-dark leading-tight drop-shadow-sm opacity-0"
          >
            <span className="block mb-2">Every conversation is</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lightbrown to-brand-brown block">
              a business decision.
            </span>
          </h1>
        </div>

        {/* The GSAP Ethereal Orb */}
        <div className="w-full flex items-center justify-center my-6 md:my-12 transform scale-[0.7] sm:scale-90 md:scale-100">
          <ConversationProvider>
            <EtherealOrb />
          </ConversationProvider>
        </div>

        {/* Subheadline and CTA */}
        <div className="text-center mt-auto mb-16 flex flex-col items-center px-4 w-full">
          <p
            ref={subTextRef}
            className="text-lg sm:text-xl md:text-2xl text-brand-dark/70 max-w-2xl text-center mx-auto mb-12 font-medium opacity-0"
          >
            Run your business knowing nothing important slips through the cracks. Morlen analyzes every customer signal to tell you exactly where your revenue is hiding.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            {process.env.NEXT_PUBLIC_SITE_MODE === 'public' ? (
              <button
                onClick={() => setIsWaitlistOpen(true)}
                className="text-white bg-brand-brown px-8 py-3.5 sm:py-3 rounded-full font-bold w-full sm:w-auto inline-flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-sm"
              >
                <span>Join Waitlist</span>
              </button>
            ) : (
              <>
                {authenticated ? (
                  <button
                    onClick={() => router.push('/upload')}
                    className="text-white bg-gradient-to-r from-brand-brown to-brand-lightbrown px-8 py-3.5 sm:py-3 rounded-full font-bold w-full sm:w-auto inline-flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <span>Ask Morlen</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={login}
                    className="text-white bg-brand-brown px-8 py-3.5 sm:py-3 rounded-full font-bold w-full sm:w-auto inline-flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-sm"
                  >
                    <span>Sign In to Morlen</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        {process.env.NEXT_PUBLIC_SITE_MODE !== 'public' && (
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 px-4">
            {/* Card 1 */}
          <div ref={card1Ref} className="glass-card rounded-3xl p-8 flex flex-col h-full min-h-[300px] relative overflow-hidden group opacity-0">
            <div className="text-sm text-brand-dark font-mono mb-4 font-semibold">/01</div>
            <h3 className="text-2xl font-bold mb-4 leading-tight text-brand-dark">Decision<br />Forecasting</h3>
            <p className="text-base text-brand-dark/90 leading-relaxed font-medium">
              Test every move against the people it affects before it costs you.
            </p>
            <div className="mt-auto pt-8 text-brand-dark">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>

          {/* Card 2 */}
          <div ref={card2Ref} className="glass-card rounded-3xl p-8 flex flex-col h-full min-h-[300px] relative overflow-hidden group opacity-0">
            <div className="text-sm text-brand-dark font-mono mb-4 font-semibold">/02</div>
            <h3 className="text-2xl font-bold mb-4 leading-tight text-brand-dark">Know Your<br />Customer</h3>
            <p className="text-base text-brand-dark/90 leading-relaxed font-medium">
              Build from how they've changed, not just what they said.
            </p>
            <div className="mt-auto pt-8 text-brand-dark">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>

          {/* Card 3 */}
          <div ref={card3Ref} className="glass-card rounded-3xl p-8 flex flex-col h-full min-h-[300px] relative overflow-hidden group opacity-0">
            <div className="text-sm text-brand-dark font-mono mb-4 font-semibold">/03</div>
            <h3 className="text-2xl font-bold mb-4 leading-tight text-brand-dark">For New<br />Businesses</h3>
            <p className="text-base text-brand-dark/90 leading-relaxed font-medium">
              Intelligence from day one. No reviews required.
            </p>
            <div className="mt-auto pt-8 text-brand-dark">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.246 1.313M3 7.5l2.25-1.313M3 7.5l2.246 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          </div>
        )}
      </main>

      {/* Main Footer */}
      <footer className="w-full pb-8 pt-4 px-8 md:px-16 z-50 relative mt-auto border-t border-brand-dark/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-brand-dark font-medium">
          {/* Logo */}
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold tracking-wider text-brand-brown">MORLEN</span>
          </div>
          {/* Footer Links */}
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link href="/pricing" className="hover:text-brand-lightbrown transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-brand-lightbrown transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-lightbrown transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-brand-lightbrown transition-colors">Security</Link>
            <Link href="#" className="hover:text-brand-lightbrown transition-colors">Contact</Link>
          </div>
          {/* Copyright */}
          <div>
            © 2026 Morlen Behavioral Intelligence. All rights reserved.
          </div>
        </div>
      </footer>
      
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />
    </div>
  );
}
