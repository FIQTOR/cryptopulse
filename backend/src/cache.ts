import NodeCache from 'node-cache';
import { config } from './config.js';

/**
 * Small in-memory cache. Uses stdTTL per namespace so we honor the
 * recommended TTLs without over-calling the free APIs.
 */
export const cache = new NodeCache({ useClones: false, checkperiod: 60 });

export const TTL = {
  prices: config.cache.pricesTtl,
  coin: config.cache.coinTtl,
  chart: config.cache.chartTtl,
  news: config.cache.newsTtl,
} as const;

/** Cache-aside helper: return cached value or run `fn`, then cache it. */
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}
