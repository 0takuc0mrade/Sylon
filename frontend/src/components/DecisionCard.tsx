import React from 'react';

// Simple markdown formatter for bold, italics, and lists
function MarkdownText({ text }: { text: string }) {
  const formatText = (content: string) => {
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
    return html;
  };
  return <div className="space-y-1.5 leading-relaxed break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
}

export default function DecisionCard({ content, timestamp }: { content: string, timestamp?: string }) {
  return (
    <div className="w-full my-4 rounded-3xl overflow-hidden glass-card border border-brand-dark/20 dark:border-brand-brown/40 shadow-xl relative animate-in slide-in-from-bottom-2 duration-500">
      {/* Animated Gradient Border Top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-lightbrown via-brand-brown to-brand-dark animate-pulse"></div>
      
      {/* Header Section */}
      <div className="px-5 py-4 border-b border-brand-dark/10 dark:border-brand-brown/20 bg-brand-lightbrown/5 dark:bg-brand-brown/10 flex items-center gap-3">
        <div className="flex h-8 w-8 rounded-full bg-gradient-to-br from-brand-lightbrown to-brand-brown items-center justify-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-brand-dark dark:text-brand-lightbrown tracking-wide uppercase">Scenario Simulation</h4>
          <p className="text-xs text-brand-dark/70 dark:text-gray-400 font-medium">Sylon Strategic Insight</p>
        </div>
        {timestamp && (
          <div className="text-[10px] text-brand-dark/50 dark:text-gray-500 font-semibold self-start mt-1">
            {new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 sm:p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
        <div className="text-brand-dark dark:text-gray-200 text-sm sm:text-base font-medium">
          <MarkdownText text={content.replace(/SCENARIO SIMULATION\nSylon (Mathematical Projection|Strategic Insight)\n\n?/gi, '')} />
        </div>
      </div>

      {/* Footer Banner */}
      <div className="px-5 py-3 bg-brand-lightbrown/10 dark:bg-brand-brown/10 border-t border-brand-dark/10 dark:border-brand-brown/20 flex justify-between items-center">
        <span className="text-xs font-semibold text-brand-brown dark:text-brand-lightbrown flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-brown opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-brown"></span>
          </span>
          Analysis Complete
        </span>
        <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-dark text-white hover:bg-brand-brown transition-colors shadow-sm">
          Deploy Strategy
        </button>
      </div>
    </div>
  );
}
