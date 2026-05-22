"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useConversation } from "@elevenlabs/react";
import { usePrivy } from "@privy-io/react-auth";

export default function EtherealOrb({ onTranscription }: { onTranscription?: (role: string, text: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const vortexRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glassRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const domeRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(() => Array.from({ length: 15 }), []);
  const vortexRings = useMemo(() => Array.from({ length: 4 }), []);
  const glassLayers = useMemo(() => Array.from({ length: 3 }), []);

  const { getAccessToken } = usePrivy();

  const conversation = useConversation({
    onConnect: () => console.log("ElevenLabs Connected"),
    onDisconnect: () => console.log("ElevenLabs Disconnected"),
    onMessage: (message: any) => {
      console.log("Message:", message);
      if (onTranscription && message.message) {
        const role = message.source === 'ai' ? 'assistant' : 'user';
        onTranscription(role, message.message);
      }
    },
    onError: (error) => console.error("ElevenLabs Error:", error),
    clientTools: {
      get_sylon_strategy: async (parameters: any) => {
        try {
          const businessId = localStorage.getItem('sylon_business_id');
          if (!businessId) return "Tell the user they need to upload sample data first.";
          
          const token = await getAccessToken();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          // Call our backend Sylon orchestrator!
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              text: "I just uploaded my customer data. Please summarize the customer archetypes you found and give me one actionable recommendation based on the top pain points.", 
              business_id: businessId 
            })
          });
          const data = await res.json();
          console.log("Sylon Response to Voice Agent:", data.response);
          return data.response; // This string goes straight into the Voice Agent's brain!
        } catch (err) {
          console.error("Client tool error:", err);
          return "Sorry, I hit a snag pulling the data. Tell the user there was a database error.";
        }
      }
    }
  });

  const { status, isSpeaking } = conversation;

  // React to status changes
  useEffect(() => {
    if (status === 'connected') {
      gsap.to(domeRef.current, {
        boxShadow: "inset 0 0 100px rgba(165,115,101,0.9)",
        duration: 1
      });
      gsap.to(vortexRefs.current, {
        borderColor: "rgba(165,115,101,0.6)",
        duration: 1
      });
    } else {
      gsap.to(domeRef.current, {
        boxShadow: "inset 0 0 40px rgba(255,255,255,0.6)",
        duration: 1
      });
      gsap.to(vortexRefs.current, {
        borderColor: "rgba(255,255,255,0.3)",
        duration: 1
      });
    }
  }, [status]);

  // Voice Reactivity mapped to Core
  useEffect(() => {
    if (isSpeaking) {
      gsap.to(coreRef.current, {
        scale: 1.8,
        opacity: 1,
        filter: "blur(60px) brightness(1.5)",
        duration: 0.1,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut"
      });
    } else {
      gsap.killTweensOf(coreRef.current);
      gsap.to(coreRef.current, {
        scale: 1.2,
        opacity: 0.8,
        filter: "blur(40px) brightness(1)",
        duration: 2.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
  }, [isSpeaking]);

  useGSAP(() => {
    // 1. Container Floating
    gsap.to(container.current, {
      y: -20,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    // 2. Initial Core Idle
    gsap.to(coreRef.current, {
      scale: 1.2,
      opacity: 0.8,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    // 3. Sweeping Luminous Vortex Rings
    vortexRefs.current.forEach((ring, i) => {
      if (!ring) return;
      gsap.set(ring, {
        rotationX: 60 + i * 10,
        rotationY: i * 45,
      });
      gsap.to(ring, {
        rotationZ: 360,
        duration: 20 + i * 5,
        repeat: -1,
        ease: "none",
        modifiers: {
          rotationZ: gsap.utils.unitize((value) => (i % 2 === 0 ? value : -value))
        }
      });
      // Breathing effect on vortex
      gsap.to(ring, {
        scale: 1.1 + (i * 0.05),
        opacity: 0.8,
        duration: 4 + i,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    });

    // 4. Twisted Glass Inner Layers
    glassRefs.current.forEach((layer, i) => {
      if (!layer) return;
      gsap.to(layer, {
        rotation: 360,
        scale: 1.05 + (i * 0.02),
        duration: 12 + i * 3,
        repeat: -1,
        yoyo: i % 2 !== 0, // Some reverse direction
        ease: "sine.inOut"
      });
    });

    // 5. Stardust Particulates
    particleRefs.current.forEach((particle) => {
      if (!particle) return;
      // Random starting positions within the orb bounds
      const randomX = gsap.utils.random(-100, 100);
      const randomY = gsap.utils.random(-100, 100);
      const randomScale = gsap.utils.random(0.5, 1.5);
      
      gsap.set(particle, { x: randomX, y: randomY, scale: randomScale, opacity: 0 });
      
      gsap.to(particle, {
        opacity: gsap.utils.random(0.4, 0.9),
        y: randomY - gsap.utils.random(50, 150), // Float upwards/outwards
        x: randomX + gsap.utils.random(-50, 50),
        rotation: 360,
        duration: gsap.utils.random(3, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 5)
      });
    });

  }, { scope: container });

  const handleHoverEnter = () => {
    if (status !== 'connected') {
      gsap.to(domeRef.current, {
        scale: 1.05,
        boxShadow: "inset 0 0 80px rgba(255,255,255,0.9)",
        duration: 0.4,
        ease: "power2.out"
      });
      gsap.to(vortexRefs.current, { scale: 1.15, duration: 0.5 });
    }
  };

  const handleHoverLeave = () => {
    if (status !== 'connected') {
      gsap.to(domeRef.current, {
        scale: 1,
        boxShadow: "inset 0 0 40px rgba(255,255,255,0.6)",
        duration: 0.6,
        ease: "power2.inOut"
      });
      gsap.to(vortexRefs.current, { scale: 1, duration: 1 });
    }
  };

  const toggleConversation = useCallback(async () => {
    if (status === 'connected') {
      await conversation.endSession();
    } else {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        alert("ElevenLabs Agent ID is not configured.");
        return;
      }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({ agentId });
      } catch (err) {
        console.error("Session start failed:", err);
      }
    }
  }, [conversation, status]);

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      <div 
        ref={container} 
        className="relative w-72 h-72 md:w-[28rem] md:h-[28rem] cursor-pointer flex items-center justify-center group mb-8"
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
        onClick={toggleConversation}
      >
        
        {/* Luminous Energy Swirls (The Radiant Vortex outside the orb) */}
        <div className="absolute inset-[-50%] pointer-events-none flex items-center justify-center">
          {vortexRings.map((_, i) => (
            <div
              key={`vortex-${i}`}
              ref={el => { vortexRefs.current[i] = el; }}
              className="absolute border border-white/30 rounded-full"
              style={{
                width: `${100 + i * 20}%`,
                height: `${100 + i * 20}%`,
                boxShadow: i % 2 === 0 ? "0 0 40px rgba(165,115,101,0.4), inset 0 0 20px rgba(255,255,255,0.2)" : "0 0 30px rgba(255,255,255,0.3)",
                borderWidth: i === 0 ? '4px' : '1px',
              }}
            />
          ))}
        </div>

        {/* The Molten Copper Core */}
        <div 
          ref={coreRef}
          className="absolute w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tr from-brand-brown via-brand-lightbrown to-brand-glow rounded-full"
          style={{ filter: 'blur(40px)' }}
        />

        {/* The Material: Twisted Crystal / Liquid Glass inner layers */}
        {glassLayers.map((_, i) => (
          <div 
            key={`glass-${i}`}
            ref={el => { glassRefs.current[i] = el; }}
            className="absolute inset-4 md:inset-8 mix-blend-overlay border-[2px] border-brand-lightbrown/60"
            style={{ 
              borderRadius: i === 0 ? '40% 60% 70% 30% / 40% 50% 60% 50%' : i === 1 ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '50% 50% 50% 50% / 40% 40% 60% 60%',
              boxShadow: `inset 0 0 ${20 + i * 10}px rgba(230,157,129,0.5)`,
              background: i === 2 ? 'linear-gradient(135deg, rgba(230,157,129,0.4) 0%, transparent 100%)' : 'transparent',
              backdropFilter: i === 0 ? 'blur(4px)' : 'none'
            }}
          />
        ))}
        
        {/* The Outer Glass Dome (Polished Resin) */}
        <div 
          ref={domeRef}
          className="absolute inset-0 bg-brand-lightbrown/10 backdrop-blur-md border border-brand-lightbrown/60 rounded-full shadow-[inset_0_0_40px_rgba(230,157,129,0.6),0_20px_40px_rgba(0,0,0,0.1)] mix-blend-overlay transition-colors"
        />
        
        {/* Specular Highlight (The gleam on the glass) */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-white rounded-full blur-[12px] mix-blend-screen opacity-80 pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-white rounded-full blur-[4px] mix-blend-screen opacity-90 pointer-events-none" />
        
        {/* Stardust Particulates */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {particles.map((_, i) => (
            <div 
              key={`particle-${i}`}
              ref={el => { particleRefs.current[i] = el; }}
              className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full mix-blend-screen shadow-[0_0_8px_rgba(255,255,255,0.9)] blur-[1px]"
            />
          ))}
        </div>
      </div>
      
      {/* Voice Connection Status */}
      <div className="text-sm font-bold text-white bg-gradient-to-r from-brand-lightbrown to-brand-brown px-6 py-3 rounded-full shadow-lg transition-all duration-300 z-30">
        {status === 'connected' ? (
           <span className="flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
             {isSpeaking ? 'Sylon is speaking...' : 'Sylon is listening...'}
           </span>
        ) : status === 'connecting' ? (
           <span className="flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
             Connecting to Agent...
           </span>
        ) : (
           <span className="flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"></span>
             Click the Core to start Voice Session
           </span>
        )}
      </div>
    </div>
  );
}
