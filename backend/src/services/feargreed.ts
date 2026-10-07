import { fetchJson } from '../http.js';
import { cached } from '../cache.js';
import { config } from '../config.js';

/**
 * Fear & Greed index from alternative.me — free, no key, 1 request.
 */
export interface FearGreed {
  value: number;
  classification: string;
  timestamp: number;
}

export async function getFearGreed(): Promise<FearGreed> {
  const url = 'https://api.alternative.me/fng/?limit=1';
  return cached('fear-greed', config.cache.pricesTtl, async () => {
    const raw = await fetchJson<{
      data: Array<{ value: string; value_classification: string; timestamp: string }>;
    }>(url);
    const d = raw.data[0];
    return {
      value: Number(d.value),
      classification: d.value_classification,
      timestamp: Number(d.timestamp) * 1000,
    };
  });
}
