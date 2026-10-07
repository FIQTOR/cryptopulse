import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency, Holding, PriceAlert } from '../lib/types';

interface WatchlistState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: ['bitcoin', 'ethereum'],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'cryptopulse.watchlist' },
  ),
);

interface PortfolioState {
  holdings: Holding[];
  add: (h: Holding) => void;
  update: (coinId: string, patch: Partial<Holding>) => void;
  remove: (coinId: string) => void;
  clear: () => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      add: (h) =>
        set((s) => {
          const existing = s.holdings.find((x) => x.coinId === h.coinId);
          if (existing) {
            return {
              holdings: s.holdings.map((x) =>
                x.coinId === h.coinId ? { ...x, amount: x.amount + h.amount, buyPrice: h.buyPrice } : x,
              ),
            };
          }
          return { holdings: [...s.holdings, h] };
        }),
      update: (coinId, patch) =>
        set((s) => ({
          holdings: s.holdings.map((x) => (x.coinId === coinId ? { ...x, ...patch } : x)),
        })),
      remove: (coinId) => set((s) => ({ holdings: s.holdings.filter((x) => x.coinId !== coinId) })),
      clear: () => set({ holdings: [] }),
    }),
    { name: 'cryptopulse.portfolio' },
  ),
);

interface AlertsState {
  alerts: PriceAlert[];
  add: (a: PriceAlert) => void;
  remove: (id: string) => void;
  markTriggered: (id: string) => void;
}

export const useAlerts = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      add: (a) => set((s) => ({ alerts: [...s.alerts, a] })),
      remove: (id) => set((s) => ({ alerts: s.alerts.filter((x) => x.id !== id) })),
      markTriggered: (id) =>
        set((s) => ({ alerts: s.alerts.map((x) => (x.id === id ? { ...x, triggered: true } : x)) })),
    }),
    { name: 'cryptopulse.alerts' },
  ),
);

interface SettingsState {
  currency: Currency;
  theme: 'dark' | 'light';
  setCurrency: (c: Currency) => void;
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

/** Apply a theme to <html> so both Tailwind dark: variants and our CSS vars react. */
export function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      currency: 'usd',
      theme: 'dark',
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    { name: 'cryptopulse.settings' },
  ),
);
