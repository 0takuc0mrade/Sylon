'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import AuthButton from './AuthButton';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="border-b border-brand-dark/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl px-4 md:px-8 py-3 md:py-4 z-50 sticky top-0 w-full">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity text-xl md:text-2xl font-bold tracking-wider text-brand-brown">
          MORLEN
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 mx-8">
          <div className="flex gap-8 items-center text-base font-medium justify-center min-w-max w-full">
            <Link href="/" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/' ? 'font-bold !text-brand-brown' : ''}`}>
              Home
            </Link>
            
            {process.env.NEXT_PUBLIC_SITE_MODE === 'public' ? (
              <>
                <Link href="/platform" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/platform' ? 'font-bold !text-brand-brown' : ''}`}>
                  Platform
                </Link>
                <Link href="/dashboard" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/dashboard' ? 'font-bold !text-brand-brown' : ''}`}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`whitespace-nowrap text-brand-dark dark:text-white/90 hover:text-brand-lightbrown transition-colors ${pathname === '/dashboard' ? 'font-bold !text-brand-brown' : ''}`}>
                  Dashboard
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
              </>
            )}
          </div>
        </div>

        {/* Right CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <ThemeToggle />
          <AuthButton />
          
          {/* Mobile Menu Toggle Button */}
          <button 
            className="md:hidden p-2 text-brand-dark dark:text-white flex items-center justify-center focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-brand-dark/95 backdrop-blur-xl border-b border-brand-dark/10 shadow-lg md:hidden flex flex-col pt-4 pb-6 px-6 gap-6 z-50">
          <div className="flex flex-col gap-4 text-lg font-semibold">
            <Link href="/" className={`text-brand-dark dark:text-white/90 ${pathname === '/' ? 'text-brand-brown' : ''}`}>
              Home
            </Link>
            
            {process.env.NEXT_PUBLIC_SITE_MODE === 'public' ? (
              <>
                <Link href="/platform" className={`text-brand-dark dark:text-white/90 ${pathname === '/platform' ? 'text-brand-brown' : ''}`}>
                  Platform
                </Link>
                <Link href="/dashboard" className={`text-brand-dark dark:text-white/90 ${pathname === '/dashboard' ? 'text-brand-brown' : ''}`}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`text-brand-dark dark:text-white/90 ${pathname === '/dashboard' ? 'text-brand-brown' : ''}`}>
                  Dashboard
                </Link>
                <Link href="/upload" className={`text-brand-dark dark:text-white/90 ${pathname === '/upload' ? 'text-brand-brown' : ''}`}>
                  Ingest
                </Link>
                <Link href="/chat" className={`text-brand-dark dark:text-white/90 ${pathname === '/chat' ? 'text-brand-brown' : ''}`}>
                  Consult
                </Link>
                <Link href="/inbox" className={`text-brand-dark dark:text-white/90 ${pathname === '/inbox' ? 'text-brand-brown' : ''}`}>
                  Inbox
                </Link>
                <Link href="/insights" className={`text-brand-dark dark:text-white/90 ${pathname === '/insights' ? 'text-brand-brown' : ''}`}>
                  Insights
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
