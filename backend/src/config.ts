import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY ?? '',
    // Public endpoint works without a key but is rate-limited (~10-30 calls/min).
    // With a free Demo key you get a stable 30 calls/min.
    baseUrl: process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3',
    proBaseUrl: 'https://pro-api.coingecko.com/api/v3',
  },
  binance: {
    // data-api.binance.vision is Binance's public market-data mirror — reachable
    // in more regions/networks than api.binance.com and still free, no key.
    rest: 'https://data-api.binance.vision',
    ws: 'wss://stream.binance.com:9443/stream',
  },
  cache: {
    pricesTtl: Number(process.env.CACHE_TTL_PRICES ?? 30),
    coinTtl: Number(process.env.CACHE_TTL_COIN ?? 60),
    chartTtl: Number(process.env.CACHE_TTL_CHART ?? 300),
    newsTtl: Number(process.env.CACHE_TTL_NEWS ?? 600),
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
