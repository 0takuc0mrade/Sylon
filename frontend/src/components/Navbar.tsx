'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <nav className="border-b border-brand-dark/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center z-50 sticky top-0 gap-4 md:gap-0">
      <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-[#1a0f0a] dark:text-brand-dark w-full md:w-auto flex justify-between items-center">
        <div>SYLON<span className="text-brand-lightbrown">.</span></div>
        <div className="md:hidden"><ThemeToggle /></div>
      </div>
      <div className="nav-links flex gap-4 md:gap-6 items-center text-sm md:text-base overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
        <Link href="/" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-brand-dark hover:text-brand-lightbrown transition-colors ${pathname === '/' ? 'font-bold' : ''}`}>
          Dashboard
        </Link>
        <Link href="/chat" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-brand-dark hover:text-brand-lightbrown transition-colors ${pathname === '/chat' ? 'font-bold' : ''}`}>
          Strategist
        </Link>
        <Link href="/upload" className={`nav-link whitespace-nowrap text-[#1a0f0a] dark:text-brand-dark hover:text-brand-lightbrown transition-colors ${pathname === '/upload' ? 'font-bold' : ''}`}>
          Ingest
        </Link>
        <div className="hidden md:block"><ThemeToggle /></div>
      </div>
    </nav>
  );
}
