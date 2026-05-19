'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
        SYLON<span style={{ color: 'var(--accent-primary)' }}>.</span>
      </div>
      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link href="/chat" className={`nav-link ${pathname === '/chat' ? 'active' : ''}`}>
          Strategist
        </Link>
        <Link href="/upload" className={`nav-link ${pathname === '/upload' ? 'active' : ''}`}>
          Ingest
        </Link>
      </div>
    </nav>
  );
}
