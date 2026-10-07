# 🪙 CryptoPulse

Live cryptocurrency market dashboard — prices, charts, portfolio tracker, price
alerts, and news. **100% free data sources, no paid APIs, no accounts required.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> Open source & fully self-hostable. No database, no login, no secret required —
> all data comes from free, keyless public APIs with automatic multi-source
> failover so rate limits rarely bite.

## Stack

| Layer     | Tech                                                                 |
| --------- | -------------------------------------------------------------------- |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query       |
| Charts    | lightweight-charts (TradingView, OSS) · Recharts                     |
| State     | Zustand (persisted to `localStorage`)                                |
| Backend   | Node · Express · TypeScript · WebSocket (`ws`)                       |
| Data      | CoinGecko (market/chart) · Binance (live WS: ticker/depth/trades) · alternative.me (F&G) · RSS (news) |

## Features

- 🏠 **Home** — Bitcoin hero chart at top, global stats, hot news feed, top-100 market table
- 📊 **Markets dashboard** — global market cap, BTC/ETH dominance, Fear & Greed gauge
- 📈 **Coin detail (Binance-style)** — header + 24h stat strip, tabbed Chart/Info/News, chart-left & order-book-right layout
- 🕯️ **Rich chart** — chart types (Area / Line / Candle / Bar), ranges, fullscreen, reset zoom
- 📐 **Technical indicators** — SMA 20/50, EMA 200, Bollinger Bands, Volume, RSI (14), MACD (12,26,9)
- 🌡️ **Order book heatmap** — live bid/ask depth with liquidity intensity bars + spread
- ⚡ **Realtime trades** — streaming trade tape (price/size/side/value), pausable
- 📰 **News** — aggregated from free crypto RSS feeds (+ per-coin news tab)
- ⭐ **Watchlist** — persisted locally, live-updating
- 💼 **Portfolio tracker** — holdings, cost basis, P&L, allocation donut chart
- 🔔 **Price alerts** — browser notifications via the free Web Notifications API
- 💱 **Multi-currency** (USD/IDR/EUR) with live FX conversion of realtime prices
- 🌗 **Dark/Light theme**, 📱 **PWA** — installable + offline shell caching
- 🔁 **Multi-source failover** — CoinGecko → CoinCap → CoinPaprika (markets),
  CoinGecko → Binance (chart/candles), so rate limits rarely bite

## Quick start

```bash
# 1) Backend
cd backend
cp .env.example .env      # optional: add a free CoinGecko demo key
npm install
npm run dev               # http://localhost:8787

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173 — the Vite dev server proxies `/api` and `/ws` to the
backend, so there is no CORS setup needed during development.

## Production

```bash
# Backend
cd backend && npm run build && npm start

# Frontend (set the API origin, then build)
cd frontend
VITE_API_URL=https://your-backend.example.com npm run build
# deploy the ./dist folder to any static host (Vercel, Netlify, Render, ...)
```

> When `VITE_API_URL` is empty, the frontend talks to the same origin — useful
> when you serve the built frontend from the backend or behind a reverse proxy.

## API

| Method | Endpoint                        | Description                        |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/api/health`                   | Health check                       |
| GET    | `/api/global`                   | Global market stats                |
| GET    | `/api/markets?currency&per_page`| Top coins (multi-source failover)  |
| GET    | `/api/fx`                       | USD→IDR/EUR FX rates               |
| GET    | `/api/sources`                  | Last data source used per domain   |
| GET    | `/api/coin/:id`                 | Coin detail                        |
| GET    | `/api/chart/:id?currency&days&type=line\|candle` | Price history / OHLC    |
| GET    | `/api/search?q`                 | Coin search                        |
| GET    | `/api/fear-greed`               | Fear & Greed index                 |
| GET    | `/api/news`                     | Aggregated crypto news             |
| WS     | `/ws`                           | Live tickers (`{symbols:[...]}`)   |

### WebSocket message types

Send a JSON message after connecting to `/ws`:

```jsonc
// Live tickers for many symbols
{ "symbols": ["btcusdt", "ethusdt"] }

// Order book (bids/asks), refreshed ~10x per second
{ "type": "depth", "symbol": "btcusdt" }

// Realtime market trades (aggTrade)
{ "type": "trades", "symbol": "btcusdt" }
```

Server pushes messages tagged with a `stream` field: `ticker`, `depth`, or
`trade`. Order book and trades require the coin be listed on Binance (USDT pair).

## Environment (backend `.env`)

| Var                   | Default | Notes                                       |
| --------------------- | ------- | ------------------------------------------- |
| `PORT`                | `8787`  |                                             |
| `COINGECKO_API_KEY`   | _(empty)_| Free Demo key → stable higher rate limit   |
| `CACHE_TTL_PRICES`    | `30`    | seconds                                     |
| `CACHE_TTL_CHART`     | `300`   | seconds                                     |
| `CACHE_TTL_NEWS`      | `600`   | seconds                                     |
| `CORS_ORIGINS`        | dev origins | comma-separated allowed origins         |

## Tests

```bash
cd backend  && npm test    # vitest
cd frontend && npm test    # vitest + testing-library
```

## Data source notes (free tier)

- **CoinGecko** public API is rate-limited (~10–30 req/min). The backend caches
  responses and falls back to **CoinCap** / **CoinPaprika** automatically.
  For heavier use you may add a **free Demo key** via `COINGECKO_API_KEY`.
- **Binance** WebSocket & public data mirror are free and need no key; charts
  fall back to Binance klines when CoinGecko is unavailable.
- News uses public RSS feeds — no API key required.
- Live prices from Binance are quoted in **USDT (≈USD)** and converted to the
  selected currency using live FX rates.

## Documentation

- [`AGENTS.md`](./AGENTS.md) — architecture & conventions for contributors and AI agents.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — how to contribute.
- [`TODO.md`](./TODO.md) — recent feature work log.

## License

This project is **fully open source**, released under the [MIT License](./LICENSE).
You are free to use, modify, and distribute it (including commercially) as long
as you keep the copyright notice. No warranty is provided.

Feel free to ⭐ the repo and open issues / PRs!
