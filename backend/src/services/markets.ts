import { cached, TTL } from '../cache.js';
import { fetchJson } from '../http.js';
import type { Currency } from './coingecko.js';

/**
 * Multi-source market data with automatic failover.
 *
 * Sources (all free, no key needed):
 *   1. CoinGecko   — richest data (sparkline, 7d change, market cap rank)
 *   2. CoinCap     — free, generous limits
 *   3. CoinPaprika — free, no key
 *
 * We return CoinGecko-compatible shaped objects so the frontend stays unchanged.
 * Each successful source is recorded in the `source` meta (see /api/sources).
 */

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price: number[] };
}

export interface SourceMeta {
  markets: string;
  chart: string;
  coin: string;
}

// Simple global meta we update on each successful fetch (for observability).
export const lastSource: SourceMeta = { markets: '-', chart: '-', coin: '-' };

const CG = 'https://api.coingecko.com/api/v3';

async function marketsFromCoinGecko(cur: Currency, perPage: number, page: number): Promise<MarketCoin[]> {
  const url =
    `${CG}/coins/markets?vs_currency=${cur}` +
    `&order=market_cap_desc&per_page=${perPage}&page=${page}` +
    `&sparkline=true&price_change_percentage=7d`;
  const data = await fetchJson<MarketCoin[]>(url);
  if (!Array.isArray(data) || data.length === 0) throw new Error('empty');
  return data;
}

async function marketsFromCoinCap(cur: Currency, perPage: number): Promise<MarketCoin[]> {
  // CoinCap uses lowercase asset ids and USD prices; we convert to target currency.
  const { getFxRates } = await import('./fx.js');
  const fx = await getFxRates();
  const rate = fx[cur];
  const raw = await fetchJson<{
    data: Array<{
      id: string;
      rank: string;
      symbol: string;
      name: string;
      priceUsd: string;
      marketCapUsd: string;
      volumeUsd24Hr: string;
      changePercent24Hr: string;
    }>;
  }>(`https://api.coincap.io/v2/assets?limit=${perPage}`);

  return raw.data.map((a) => ({
    id: a.id,
    symbol: a.symbol.toLowerCase(),
    name: a.name,
    image: `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`,
    current_price: Number(a.priceUsd) * rate,
    market_cap: Number(a.marketCapUsd) * rate,
    market_cap_rank: Number(a.rank),
    total_volume: Number(a.volumeUsd24Hr) * rate,
    price_change_percentage_24h: Number(a.changePercent24Hr),
    price_change_percentage_7d_in_currency: null,
  }));
}

async function marketsFromCoinPaprika(cur: Currency, perPage: number): Promise<MarketCoin[]> {
  const { getFxRates } = await import('./fx.js');
  const fx = await getFxRates();
  const rate = fx[cur];
  const raw = await fetchJson<
    Array<{
      id: string;
      rank: number;
      symbol: string;
      name: string;
      quotes: { USD: { price: number; market_cap: number; volume_24h: number; percent_change_24h: number } };
    }>
  >(`https://api.coinpaprika.com/v1/tickers?limit=${perPage}`);

  return raw.map((c) => {
    const q = c.quotes.USD;
    return {
      id: c.id,
      symbol: c.symbol.toLowerCase(),
      name: c.name,
      image: `https://static.coinpaprika.com/coin/${c.id}/logo.png`,
      current_price: q.price * rate,
      market_cap: q.market_cap * rate,
      market_cap_rank: c.rank,
      total_volume: q.volume_24h * rate,
      price_change_percentage_24h: q.percent_change_24h,
      price_change_percentage_7d_in_currency: null,
    };
  });
}

export async function getMarkets(
  cur: Currency,
  perPage = 100,
  page = 1,
): Promise<MarketCoin[]> {
  return cached(`markets:${cur}:${perPage}:${page}`, TTL.prices, async () => {
    const providers: Array<[string, () => Promise<MarketCoin[]>]> = [
      ['coingecko', () => marketsFromCoinGecko(cur, perPage, page)],
      ['coincap', () => marketsFromCoinCap(cur, perPage)],
      ['coinpaprika', () => marketsFromCoinPaprika(cur, perPage)],
    ];
    let lastErr: unknown;
    for (const [name, fn] of providers) {
      try {
        const data = await fn();
        lastSource.markets = name;
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr ?? new Error('all market sources failed');
  });
}
