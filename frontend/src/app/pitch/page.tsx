"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { 
  MessageSquare, ShoppingCart, Store, Camera, Globe, MessageCircle,
  Database, BrainCircuit, Users, Navigation, UserCheck, ShieldCheck, TrendingUp,
  Brain, FileText, ChevronRight, Play
} from 'lucide-react';

export default function PitchDeck() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 7;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for animations
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);
  const slide4Ref = useRef<HTMLDivElement>(null);
  const slide5Ref = useRef<HTMLDivElement>(null);
  const slide6Ref = useRef<HTMLDivElement>(null);
  const slide7Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useGSAP(() => {
    // Reset all slides
    gsap.set('.slide-content', { opacity: 0, y: 30 });
    gsap.set('.stagger-item', { opacity: 0, y: 20 });
    
    // Animate current slide
    gsap.to(`.slide-${currentSlide} .slide-content`, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    });
    
    gsap.to(`.slide-${currentSlide} .stagger-item`, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 0.3
    });

    // Special animations
    if (currentSlide === 1) { // Orbit animation
      gsap.to('.orbit-icon', {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center"
      });
      gsap.to('.orbit-icon > div', {
        rotation: -360,
        duration: 40,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center"
      });
    }

  }, { dependencies: [currentSlide], scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#0d0705] text-white overflow-hidden flex flex-col cursor-pointer select-none" onClick={() => setCurrentSlide(p => Math.min(p + 1, totalSlides - 1))}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[150vw] h-[50vh] bg-gradient-to-r from-transparent via-[#ff5722]/10 to-transparent blur-[100px] -rotate-12" />
        <div className="absolute bottom-0 right-0 w-[80vw] h-[60vh] bg-gradient-to-tl from-[#7a463b]/20 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
        
        {/* SLIDE 0: Hero */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-0 ${currentSlide === 0 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center max-w-5xl">
            <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
              Morlen
            </h1>
            <p className="text-3xl md:text-4xl font-medium text-[#ffcba4] tracking-tight">
              Behavioral Intelligence for Better Business Decisions
            </p>
          </div>
        </div>

        {/* SLIDE 1: The Problem */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-1 ${currentSlide === 1 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center w-full max-w-6xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-16 tracking-tight">
              Businesses already have the data.<br/>
              <span className="text-white/40">They just don't use it.</span>
            </h2>
            
            <div className="relative w-[500px] h-[500px] mx-auto stagger-item">
              <div className="absolute inset-0 border border-white/10 rounded-full orbit-icon">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><MessageSquare className="w-8 h-8 text-[#ffcba4]"/></div>
                  <span className="text-sm font-semibold text-white/60">Reviews</span>
                </div>
                <div className="absolute top-[25%] right-[-10%] flex flex-col items-center gap-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><MessageCircle className="w-8 h-8 text-[#25D366]"/></div>
                  <span className="text-sm font-semibold text-white/60">WhatsApp</span>
                </div>
                <div className="absolute bottom-[25%] right-[-10%] flex flex-col items-center gap-3 stagger-item">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><Camera className="w-8 h-8 text-[#E1306C]"/></div>
                  <span className="text-sm font-semibold text-white/60">Instagram</span>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><Globe className="w-8 h-8 text-[#1877F2]"/></div>
                  <span className="text-sm font-semibold text-white/60">Facebook</span>
                </div>
                <div className="absolute bottom-[25%] left-[-10%] flex flex-col items-center gap-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><Store className="w-8 h-8 text-[#ff5722]"/></div>
                  <span className="text-sm font-semibold text-white/60">Shop Visits</span>
                </div>
                <div className="absolute top-[25%] left-[-10%] flex flex-col items-center gap-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"><TrendingUp className="w-8 h-8 text-[#d68f77]"/></div>
                  <span className="text-sm font-semibold text-white/60">Sales Data</span>
                </div>
              </div>
              <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-gradient-to-br from-[#1a100d] to-[#0d0705] border border-white/20 shadow-[0_0_50px_rgba(255,87,34,0.15)] flex items-center justify-center flex-col z-10">
                <Users className="w-10 h-10 text-[#ff5722] mb-2"/>
                <span className="text-lg font-bold text-white tracking-wide text-center leading-tight">Customer<br/>Interactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: How It Works */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-2 ${currentSlide === 2 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center w-full max-w-7xl px-8">
            <h2 className="text-5xl md:text-6xl font-bold mb-20 tracking-tight">How Morlen Works</h2>
            
            <div className="flex items-center justify-between w-full relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/5 -translate-y-1/2 z-0" />
              
              <div className="relative z-10 stagger-item flex flex-col items-center gap-4 bg-[#120c0a] p-6 rounded-3xl border border-white/10">
                <Database className="w-12 h-12 text-white/60" />
                <span className="text-xl font-semibold">Business Data</span>
              </div>
              <ChevronRight className="w-8 h-8 text-white/20 stagger-item" />
              
              <div className="relative z-10 stagger-item flex flex-col items-center gap-4 bg-[#120c0a] p-6 rounded-3xl border border-white/10">
                <BrainCircuit className="w-12 h-12 text-[#ffcba4]" />
                <span className="text-xl font-semibold">Behavior Analysis</span>
              </div>
              <ChevronRight className="w-8 h-8 text-white/20 stagger-item" />
              
              <div className="relative z-10 stagger-item flex flex-col items-center gap-4 bg-[#120c0a] p-6 rounded-3xl border border-white/10">
                <UserCheck className="w-12 h-12 text-[#d68f77]" />
                <span className="text-xl font-semibold">Customer Personas</span>
              </div>
              <ChevronRight className="w-8 h-8 text-white/20 stagger-item" />
              
              <div className="relative z-10 stagger-item flex flex-col items-center gap-4 bg-[#120c0a] p-6 rounded-3xl border border-[#ff5722]/40 shadow-[0_0_30px_rgba(255,87,34,0.15)]">
                <Users className="w-12 h-12 text-[#ff5722]" />
                <span className="text-xl font-semibold">AI Board</span>
              </div>
              <ChevronRight className="w-8 h-8 text-white/20 stagger-item" />
              
              <div className="relative z-10 stagger-item flex flex-col items-center gap-4 bg-gradient-to-br from-[#7a463b] to-[#1a100d] p-6 rounded-3xl border border-[#ffcba4]/30">
                <ShieldCheck className="w-12 h-12 text-[#ffcba4]" />
                <span className="text-xl font-bold text-white">Recommendation</span>
              </div>
            </div>
            
            <div className="mt-16 text-sm font-mono tracking-widest text-white/20 stagger-item">
              POWERED BY QWEN
            </div>
          </div>
        </div>

        {/* SLIDE 3: AI Board */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-3 ${currentSlide === 3 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center w-full max-w-6xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">The AI Board</h2>
            <p className="text-2xl text-white/50 mb-16 font-medium">Specialized agents debating your decisions from every angle.</p>
            
            <div className="grid grid-cols-2 gap-8 w-3/4 mx-auto">
              <div className="stagger-item p-12 bg-white/5 border border-white/10 rounded-[40px] flex flex-col items-center gap-4 backdrop-blur-sm">
                <TrendingUp className="w-12 h-12 text-[#ffcba4]" />
                <span className="text-3xl font-bold">CFO</span>
              </div>
              <div className="stagger-item p-12 bg-white/5 border border-white/10 rounded-[40px] flex flex-col items-center gap-4 backdrop-blur-sm">
                <UserCheck className="w-12 h-12 text-[#d68f77]" />
                <span className="text-3xl font-bold">Customer Experience</span>
              </div>
              <div className="stagger-item p-12 bg-white/5 border border-white/10 rounded-[40px] flex flex-col items-center gap-4 backdrop-blur-sm">
                <Navigation className="w-12 h-12 text-white/80" />
                <span className="text-3xl font-bold">Operations</span>
              </div>
              <div className="stagger-item p-12 bg-gradient-to-br from-[#ff5722]/20 to-transparent border border-[#ff5722]/30 rounded-[40px] flex flex-col items-center gap-4 backdrop-blur-sm shadow-[0_0_50px_rgba(255,87,34,0.1)]">
                <Brain className="w-12 h-12 text-[#ff5722]" />
                <span className="text-4xl font-black text-white">CEO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 4: Live Demo */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-4 ${currentSlide === 4 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center">
            <button 
              onClick={(e) => { e.stopPropagation(); router.push('/'); }}
              className="group relative px-16 py-8 rounded-[40px] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 overflow-hidden hover:border-[#ff5722]/50 transition-colors"
            >
              <div className="absolute inset-0 bg-[#ff5722]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-6">
                <Play className="w-16 h-16 text-[#ff5722] fill-[#ff5722]" />
                <span className="text-6xl font-black tracking-widest uppercase">Live Demo</span>
              </div>
            </button>
          </div>
        </div>

        {/* SLIDE 5: Roadmap */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-5 ${currentSlide === 5 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center w-full max-w-5xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-16 tracking-tight text-left">Where Morlen Goes Next</h2>
            
            <div className="flex flex-col gap-8 text-left pl-8 border-l-2 border-white/10 relative">
              <div className="stagger-item relative">
                <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ff5722] shadow-[0_0_15px_#ff5722]" />
                <span className="text-3xl font-bold text-white">Today: Reviews & Feedback</span>
              </div>
              <div className="stagger-item relative">
                <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#120c0a] border-2 border-white/30" />
                <span className="text-3xl font-medium text-white/50">WhatsApp Business</span>
              </div>
              <div className="stagger-item relative">
                <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#120c0a] border-2 border-white/30" />
                <span className="text-3xl font-medium text-white/50">Instagram & Facebook</span>
              </div>
              <div className="stagger-item relative">
                <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#120c0a] border-2 border-white/30" />
                <span className="text-3xl font-medium text-white/50">Sales Systems Integration</span>
              </div>
              <div className="stagger-item relative mt-8">
                <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#120c0a] border-2 border-[#ffcba4]" />
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffcba4] to-[#d68f77]">Enterprise Knowledge</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 6: Why it Matters */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center slide-6 ${currentSlide === 6 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="slide-content text-center w-full max-w-5xl flex flex-col gap-12 items-center">
            <h2 className="text-7xl font-bold text-white stagger-item tracking-tight">Better decisions.</h2>
            <h2 className="text-7xl font-bold text-white/50 stagger-item tracking-tight">Lower risk.</h2>
            <h2 className="text-7xl font-bold text-white/20 stagger-item tracking-tight">Smarter businesses.</h2>
            
            <div className="mt-24 text-2xl font-black tracking-[0.3em] text-[#ff5722] stagger-item">
              MORLEN
            </div>
          </div>
        </div>

      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
        {Array.from({length: totalSlides}).map((_, i) => (
          <div 
            key={i} 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-[#ff5722] scale-150' : 'bg-white/20'}`} 
            onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
          />
        ))}
      </div>
    </div>
  );
}
