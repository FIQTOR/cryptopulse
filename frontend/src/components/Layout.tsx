import { NavLink, Outlet } from 'react-router-dom';
import { Activity, Briefcase, Bell, Newspaper, Star, Search, Moon, Sun } from 'lucide-react';
import { useSettings } from '../lib/store';
import { clsx } from 'clsx';
import { useState } from 'react';
import { SearchModal } from './SearchModal';

const NAV = [
  { to: '/', label: 'Markets', icon: Activity },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/news', label: 'News', icon: Newspaper },
];

export function Layout() {
  const { theme, toggleTheme, currency, setCurrency } = useSettings();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-bold">
            <span className="text-accent text-xl">🪙</span>
            <span className="text-lg">CryptoPulse</span>
          </NavLink>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition',
                    isActive
                      ? 'bg-[var(--color-surface-2)] text-accent'
                      : 'text-slate-400 hover:text-slate-200',
                  )
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search</span>
            </button>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'usd' | 'idr' | 'eur')}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
            >
              <option value="usd">USD</option>
              <option value="idr">IDR</option>
              <option value="eur">EUR</option>
            </select>

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-[var(--color-border)] p-2 text-slate-400 hover:text-slate-200"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm',
                  isActive ? 'bg-[var(--color-surface-2)] text-accent' : 'text-slate-400',
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-slate-500">
        Data: CoinGecko · Binance · alternative.me · RSS feeds — 100% free sources.
      </footer>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
