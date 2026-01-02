'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, BarChart3, BookOpen, Settings } from 'lucide-react';

// 5-item navigation - same for mobile and desktop
const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/market', icon: BarChart3, label: 'Market' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r z-20"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            📈 ShareSathi
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Your Stock Companion
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-4 rounded-xl transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--accent-blue-bg)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-base ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Made with ❤️ for family
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-20"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 touch-target px-2 py-2 rounded-lg transition-colors"
                style={{
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
