import type {
  ChartPoint,
  ChartRange,
  CoinDetail,
  Currency,
  FearGreed,
  FxRates,
  GlobalData,
  MarketCoin,
  NewsItem,
  OhlcCandle,
} from './types';

// During dev, Vite proxies /api -> backend. In production set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL ?? '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  markets: (currency: Currency = 'usd', perPage = 100) =>
    get<MarketCoin[]>(`/api/markets?currency=${currency}&per_page=${perPage}`),

  global: () => get<GlobalData>('/api/global'),

  fx: () => get<FxRates>('/api/fx'),

  chart: (id: string, currency: Currency = 'usd', days: ChartRange = '7') =>
    get<ChartPoint[]>(`/api/chart/${id}?currency=${currency}&days=${days}`),

  candles: (id: string, currency: Currency = 'usd', days: ChartRange = '7') =>
    get<OhlcCandle[]>(`/api/chart/${id}?currency=${currency}&days=${days}&type=candle`),

  coin: (id: string) => get<CoinDetail>(`/api/coin/${id}`),

  search: (q: string) =>
    get<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string; market_cap_rank: number }> }>(
      `/api/search?q=${encodeURIComponent(q)}`,
    ),

  fearGreed: () => get<FearGreed>('/api/fear-greed'),

  news: () => get<NewsItem[]>('/api/news'),
};

/** WebSocket URL for live prices (proxied in dev). */
export function liveSocketUrl(): string {
  if (BASE) return BASE.replace(/^http/, 'ws') + '/ws';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}
