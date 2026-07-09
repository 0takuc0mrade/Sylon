"use client";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Platform() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    gsap.fromTo(headerRef.current, 
      { y: 40, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
    );
    gsap.fromTo(cardsRef.current,
      { y: 60, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: "power4.out", delay: 0.4 }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col flex-grow animate-in fade-in duration-500 relative">
      {/* Background Glow */}
      <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] bg-brand-lightbrown/10 blur-[150px] rounded-full pointer-events-none z-[-1]" />

      <header ref={headerRef} className="mb-16 pt-12 text-center max-w-4xl mx-auto">
        <div className="inline-block px-5 py-1.5 rounded-full bg-brand-lightbrown/10 border border-brand-brown/20 text-brand-brown text-sm font-bold mb-6 tracking-wide uppercase">Why Morlen?</div>
        <h1 className="page-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">Behavioral Intelligence<br />That Actually Works.</h1>
        <p className="text-xl text-brand-dark/70 dark:text-white/60 font-medium leading-relaxed">
          Regular AI gives you generic advice based on internet averages. Morlen reads the context driven reviews of your actual customers and simulates their reactions before you make a decision.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow mb-16">
        {/* Value 1 */}
        <div ref={el => { cardsRef.current[0] = el; }} className="glass-card rounded-3xl p-10 flex flex-col relative overflow-hidden group border border-brand-dark/10 dark:border-white/10 hover:border-brand-brown/40 transition-all hover:-translate-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-brown to-brand-lightbrown rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">Grounded Reality</h2>
          <p className="text-brand-dark/70 dark:text-white/60 leading-relaxed text-lg">
            Morlen is strictly grounded in your business's raw data using your actual reviews to excavate accurate customer archetypes.
          </p>
        </div>

        {/* Value 2 */}
        <div ref={el => { cardsRef.current[1] = el; }} className="glass-card rounded-3xl p-10 flex flex-col relative overflow-hidden group border border-brand-dark/10 dark:border-white/10 hover:border-brand-brown/40 transition-all hover:-translate-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-brown to-brand-lightbrown rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">Temporal Drift</h2>
          <p className="text-brand-dark/70 dark:text-white/60 leading-relaxed text-lg">
            Customers aren't static. Morlen maps how their desires evolve over time, allowing you to catch shifts in sentiment before they impact revenue.
          </p>
        </div>

        {/* Value 3 */}
        <div ref={el => { cardsRef.current[2] = el; }} className="glass-card rounded-3xl p-10 flex flex-col relative overflow-hidden group border border-brand-dark/10 dark:border-white/10 hover:border-brand-brown/40 transition-all hover:-translate-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-brown to-brand-lightbrown rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">Live Simulation</h2>
          <p className="text-brand-dark/70 dark:text-white/60 leading-relaxed text-lg">
            Consult the Morlen Oracle in real-time. Pitch an idea, and listen as Morlen simulates exactly how your key archetypes will react to the change.
          </p>
        </div>
      </div>

      <div className="text-center mt-auto pb-12">
        <Link href="/upload" className="inline-flex text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown hover:opacity-90 px-10 py-5 rounded-full font-bold shadow-xl transition-all items-center space-x-3 hover:scale-105 text-lg">
          <span>Start the Ingestion Process</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}
