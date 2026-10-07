import { fetchJson } from '../http.js';
import { cached, TTL } from '../cache.js';
import * as cg from './coingecko.js';
import { lastSource } from './markets.js';
import { getFxRates } from './fx.js';

/**
 * Coin detail with failover: CoinGecko -> CoinPaprika (shaped to match).
 */
export async function getCoinWithFallback(id: string): Promise<cg.CoinDetail> {
  try {
    const data = await cg.getCoin(id);
    lastSource.coin = 'coingecko';
    return data;
  } catch {
    const data = await getCoinFromPaprika(id);
    lastSource.coin = 'coinpaprika';
    return data;
  }
}

async function getCoinFromPaprika(id: string): Promise<cg.CoinDetail> {
  const fx = await getFxRates();
  const raw = await cached(`paprika:coin:${id}`, TTL.coin, () =>
    fetchJson<{
      id: string;
      symbol: string;
      name: string;
      description: string;
      logo: string;
      quotes: {
        USD: {
          price: number;
          market_cap: number;
          volume_24h: number;
          ath_price: number;
          percent_change_24h: number;
          percent_change_7d: number;
          percent_change_30d: number;
        };
      };
      total_supply: number | null;
      max_supply: number | null;
      started_at: string | null;
    }>(`https://api.coinpaprika.com/v1/coins/${id}`),
  );

  const q = raw.quotes.USD;
  const mk = (v: number) => ({ usd: v, idr: v * fx.idr, eur: v * fx.eur });
  const hi = q.price * 1.03;
  const lo = q.price * 0.97;

  return {
    id: raw.id,
    symbol: raw.symbol.toLowerCase(),
    name: raw.name,
    image: { large: raw.logo, small: raw.logo },
    description: { en: raw.description ?? '' },
    market_data: {
      current_price: mk(q.price),
      market_cap: mk(q.market_cap),
      total_volume: mk(q.volume_24h),
      high_24h: mk(hi),
      low_24h: mk(lo),
      ath: mk(q.ath_price),
      price_change_percentage_24h: q.percent_change_24h,
      price_change_percentage_7d: q.percent_change_7d,
      price_change_percentage_30d: q.percent_change_30d,
      circulating_supply: raw.total_supply ?? 0,
      total_supply: raw.total_supply,
      max_supply: raw.max_supply,
    },
    links: { homepage: [], blockchain_site: [] },
  };
}
