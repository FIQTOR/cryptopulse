import { fetchJson } from '../http.js';
import { cached, TTL } from '../cache.js';
import { config } from '../config.js';
import { BINANCE_PAIRS } from './binanceMap.js';
import type { Currency } from './coingecko.js';
import { getFxRates } from './fx.js';

/**
 * Binance klines (candles) — free, no key, very generous limits.
 * Used as failover for OHLC/chart when CoinGecko is rate-limited.
 *
 * Binance only lists some coins; we look up the USDT pair from a static map.
 */
export interface BinanceCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const INTERVALS: Record<string, string> = {
  '1': '5m',
  '7': '1h',
  '30': '4h',
  '90': '12h',
  '365': '1d',
  max: '1w',
};

export function binancePairFor(coinId: string): string | null {
  return BINANCE_PAIRS[coinId] ?? null;
}

export async function getBinanceKlines(
  coinId: string,
  currency: Currency,
  days: string,
): Promise<BinanceCandle[] | null> {
  const pair = binancePairFor(coinId);
  if (!pair) return null;

  const interval = INTERVALS[days] ?? '1h';
  const limit = days === 'max' ? 1000 : days === '365' ? 366 : Number(days) <= 1 ? 288 : Number(days) * 4;
  const url = `${config.binance.rest}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${Math.min(limit, 1000)}`;

  const raw = await cached(`bnklines:${pair}:${interval}:${limit}`, TTL.chart, () =>
    fetchJson<Array<[number, string, string, string, string, string, ...unknown[]]>>(url),
  );

  const fx = await getFxRates();
  const rate = fx[currency] ?? 1;

  return raw.map((k) => ({
    t: k[0],
    o: Number(k[1]) * rate,
    h: Number(k[2]) * rate,
    l: Number(k[3]) * rate,
    c: Number(k[4]) * rate,
    v: Number(k[5]) * rate,
  }));
}
