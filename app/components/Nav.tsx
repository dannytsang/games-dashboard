'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Summary' },
  { href: '/played', label: 'Played' },
  { href: '/news-monitor', label: 'News Monitor' },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" className="nav-link nav-link--home">
          Games Dashboard
        </Link>
        <div className="nav-links">
          {NAV_ITEMS.slice(1).map(({ href, label }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? ' nav-link--active' : ''}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
