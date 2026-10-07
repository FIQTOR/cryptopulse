import { config } from '../config.js';
import { cached, TTL } from '../cache.js';
import { fetchJson } from '../http.js';

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}

export type Currency = 'usd' | 'idr' | 'eur';

const CG = config.coingecko.baseUrl;

export function getMarkets(
  currency: Currency = 'usd',
  perPage = 100,
  page = 1,
): Promise<MarketCoin[]> {
  const url =
    `${CG}/coins/markets?vs_currency=${currency}` +
    `&order=market_cap_desc&per_page=${perPage}&page=${page}` +
    `&sparkline=true&price_change_percentage=7d`;
  const key = `markets:${currency}:${perPage}:${page}`;
  return cached(key, TTL.prices, () => fetchJson<MarketCoin[]>(url));
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string };
  description: { en: string };
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    ath: Record<string, number>;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
  };
  links: { homepage: string[]; blockchain_site: string[] };
}

export function getCoin(id: string): Promise<CoinDetail> {
  const url = `${CG}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`;
  return cached(`coin:${id}`, TTL.coin, () => fetchJson<CoinDetail>(url));
}

export type ChartRange = '1' | '7' | '30' | '90' | '365' | 'max';

export interface ChartPoint {
  t: number;
  price: number;
  volume: number;
}

export async function getChart(
  id: string,
  currency: Currency = 'usd',
  days: ChartRange = '7',
): Promise<ChartPoint[]> {
  const url = `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${currency}&days=${days}`;
  const raw = await cached(`chart:${id}:${currency}:${days}`, TTL.chart, () =>
    fetchJson<{ prices: [number, number][]; total_volumes: [number, number][] }>(url),
  );
  const volByTime = new Map<number, number>(raw.total_volumes ?? []);
  return raw.prices.map(([t, price]) => ({ t, price, volume: volByTime.get(t) ?? 0 }));
}

export interface OhlcCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * OHLC candles for candlestick charts.
 * CoinGecko's /ohlc returns [t, o, h, l, c]; we enrich with volume from
 * /market_chart so candlestick + volume pane can share one series.
 */
export async function getOhlc(
  id: string,
  currency: Currency = 'usd',
  days: ChartRange = '7',
): Promise<OhlcCandle[]> {
  const ohlcUrl = `${CG}/coins/${encodeURIComponent(id)}/ohlc?vs_currency=${currency}&days=${days}`;
  const chartUrl = `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${currency}&days=${days}`;

  const [ohlc, chart] = await Promise.all([
    cached(`ohlc:${id}:${currency}:${days}`, TTL.chart, () =>
      fetchJson<Array<[number, number, number, number, number]>>(ohlcUrl),
    ),
    cached(`chart:${id}:${currency}:${days}`, TTL.chart, () =>
      fetchJson<{ total_volumes: [number, number][] }>(chartUrl),
    ),
  ]);

  const volumes = chart.total_volumes ?? [];
  // Bin volumes to the nearest candle for an approximate per-candle volume.
  return ohlc.map(([t, o, h, l, c]) => {
    let v = 0;
    for (let i = 0; i < volumes.length; i++) {
      if (volumes[i][0] === t) {
        v = volumes[i][1];
        break;
      }
    }
    return { t, o, h, l, c, v };
  });
}

export interface SearchResult {
  coins: Array<{ id: string; name: string; symbol: string; thumb: string; market_cap_rank: number }>;
}

export function search(q: string): Promise<SearchResult> {
  const url = `${CG}/search?query=${encodeURIComponent(q)}`;
  return cached(`search:${q.toLowerCase()}`, 300, () => fetchJson<SearchResult>(url));
}

export interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
}

export async function getGlobal(): Promise<GlobalData> {
  const url = `${CG}/global`;
  const raw = await cached(`global`, TTL.prices, () =>
    fetchJson<{
      data: {
        total_market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        market_cap_percentage: Record<string, number>;
        market_cap_change_percentage_24h_usd: number;
        active_cryptocurrencies: number;
      };
    }>(url),
  );
  const d = raw.data;
  return {
    totalMarketCap: d.total_market_cap.usd,
    totalVolume: d.total_volume.usd,
    btcDominance: d.market_cap_percentage.btc,
    ethDominance: d.market_cap_percentage.eth,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd,
    activeCryptocurrencies: d.active_cryptocurrencies,
  };
}
