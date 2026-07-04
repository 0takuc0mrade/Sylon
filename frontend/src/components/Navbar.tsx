'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import AuthButton from './AuthButton';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-brand-dark/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl px-4 md:px-8 py-3 md:py-4 z-50 sticky top-0 w-full">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity text-xl md:text-2xl font-bold tracking-wider text-brand-brown">
          SYLON
        </Link>

        {/* Center Navigation — scrollable on mobile */}
        <div className="flex-1 overflow-x-auto scrollbar-hide mx-2 md:mx-0">
          <div className="flex gap-3 sm:gap-4 md:gap-8 items-center text-xs sm:text-sm md:text-base font-medium justify-center min-w-max">
            <Link href="/" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/' ? 'font-bold !text-brand-brown' : ''}`}>
              Home
            </Link>
            <Link href="/platform" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/platform' ? 'font-bold !text-brand-brown' : ''}`}>
              Platform
            </Link>
            <Link href="/upload" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/upload' ? 'font-bold !text-brand-brown' : ''}`}>
              Ingest
            </Link>
            <Link href="/chat" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/chat' ? 'font-bold !text-brand-brown' : ''}`}>
              Consult
            </Link>
            <Link href="/inbox" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/inbox' ? 'font-bold !text-brand-brown' : ''}`}>
              Inbox
            </Link>
            <Link href="/insights" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/insights' ? 'font-bold !text-brand-brown' : ''}`}>
              Insights
            </Link>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
