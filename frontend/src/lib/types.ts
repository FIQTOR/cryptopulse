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

export interface ChartPoint {
  t: number;
  price: number;
  volume: number;
}

export interface OhlcCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type ChartType = 'area' | 'line' | 'candle' | 'bar';

export interface FxRates {
  usd: number;
  idr: number;
  eur: number;
  fetchedAt: number;
  source: string;
}

export interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
}

export interface FearGreed {
  value: number;
  classification: string;
  timestamp: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: number;
  body: string;
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
}

export interface LiveTick {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  ts: number;
}

export type OrderSide = 'buy' | 'sell';

export interface DepthLevel {
  price: number;
  qty: number;
}

export interface OrderBookSnapshot {
  stream: 'depth';
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  ts: number;
}

export interface TradeTick {
  stream: 'trade';
  symbol: string;
  price: number;
  qty: number;
  side: OrderSide;
  ts: number;
  id: number;
}

export interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  image?: string;
  amount: number;
  buyPrice: number;
}

export interface PriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  target: number;
  direction: 'above' | 'below';
  triggered: boolean;
  createdAt: number;
}

export type Currency = 'usd' | 'idr' | 'eur';
export type ChartRange = '1' | '7' | '30' | '90' | '365' | 'max';
