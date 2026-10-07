import { fetchJson } from '../http.js';
import { cached } from '../cache.js';

/**
 * Free FX rates (USD base) — powers live-price conversion for non-USD currencies.
 * Multiple free sources with automatic failover; no API key required anywhere.
 */
export interface FxRates {
  usd: number;
  idr: number;
  eur: number;
  fetchedAt: number;
  source: string;
}

const TTL = 3600; // 1 hour — FX barely moves intraday.

async function fromFrankfurter(): Promise<Record<string, number>> {
  // https://www.frankfurter.app — free, no key, ECB data.
  const raw = await fetchJson<{ rates: Record<string, number> }>(
    'https://api.frankfurter.app/latest?from=USD&to=IDR,EUR',
  );
  return raw.rates;
}

async function fromOpenErApi(): Promise<Record<string, number>> {
  // https://open.er-api.com — free, no key.
  const raw = await fetchJson<{ rates: Record<string, number> }>(
    'https://open.er-api.com/v6/latest/USD',
  );
  return raw.rates;
}

export function getFxRates(): Promise<FxRates> {
  return cached('fx:usd', TTL, async () => {
    const providers: Array<[string, () => Promise<Record<string, number>>]> = [
      ['frankfurter', fromFrankfurter],
      ['open-er-api', fromOpenErApi],
    ];
    for (const [name, fn] of providers) {
      try {
        const r = await fn();
        if (r?.IDR && r?.EUR) {
          return { usd: 1, idr: r.IDR, eur: r.EUR, fetchedAt: Date.now(), source: name };
        }
      } catch {
        /* try next provider */
      }
    }
    // Last resort: keep the app alive with rough static rates.
    return { usd: 1, idr: 16000, eur: 0.92, fetchedAt: Date.now(), source: 'fallback' };
  });
}
