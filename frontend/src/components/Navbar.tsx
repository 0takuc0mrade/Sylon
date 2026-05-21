'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-brand-dark/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center z-50 sticky top-0 w-full">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        {/* Logo */}
        <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="flex-shrink-0 text-[#1a0f0a] dark:text-brand-dark flex justify-between items-center w-full md:w-auto">
          <Link href="/" className="hover:opacity-80 transition-opacity text-2xl font-bold tracking-wider text-brand-brown">
            SYLON
          </Link>
          <div className="md:hidden"><ThemeToggle /></div>
        </div>

        {/* Center Navigation */}
        <div className="nav-links flex gap-6 md:gap-8 items-center text-base md:text-lg font-medium overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide justify-center">
          <Link href="/" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/' ? 'font-bold text-brand-brown' : ''}`}>
            Home
          </Link>
          <Link href="/platform" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/platform' ? 'font-bold text-brand-brown' : ''}`}>
            Platform
          </Link>
          <Link href="/upload" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/upload' ? 'font-bold text-brand-brown' : ''}`}>
            Ingestion
          </Link>
          <Link href="/chat" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/chat' ? 'font-bold text-brand-brown' : ''}`}>
            Consult Sylon
          </Link>
          <Link href="/insights" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/insights' ? 'font-bold text-brand-brown' : ''}`}>
            Insights
          </Link>
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
