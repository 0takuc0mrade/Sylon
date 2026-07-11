"use client";

import React, { useEffect, useRef } from 'react';

interface MermaidGraphProps {
  graphDefinition: string;
}

export default function MermaidGraph({ graphDefinition }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dynamically load Mermaid from CDN if it doesn't exist
    if (!(window as any).mermaid) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
      script.async = true;
      script.onload = renderGraph;
      document.head.appendChild(script);
    } else {
      renderGraph();
    }

    async function renderGraph() {
      try {
        const mermaid = (window as any).mermaid;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'inherit'
        });
        
        // Use a unique ID to prevent React DOM conflicts
        const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, graphDefinition);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error("Failed to render mermaid graph", error);
      }
    }
  }, [graphDefinition]);

  return <div ref={containerRef} className="flex justify-center my-4 overflow-x-auto min-h-[300px]" />;
}
