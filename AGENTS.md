# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex, Copilot, etc.) and
human contributors working in this repository.

---

## 1. Project Overview

**CryptoPulse** is a free, open-source cryptocurrency dashboard.

- **Frontend** (`frontend/`): React 19 + TypeScript + Vite + Tailwind CSS v4,
  TanStack Query (server state), Zustand (persisted UI state), `lightweight-charts`
  + Recharts (charts), `react-router-dom` (routing).
- **Backend** (`backend/`): Node + Express + TypeScript, `ws` (WebSocket relay),
  `node-cache` (in-memory cache), `node-cron`-ready structure.
- **Data**: 100% free sources — CoinGecko, Binance, CoinCap, CoinPaprika,
  alternative.me, frankfurter, open.er-api, and crypto RSS feeds.

There is **no database** and **no authentication**. All user state (watchlist,
portfolio, alerts, settings) lives in the browser's `localStorage`.

---

## 2. Repository Layout

```
cryptopulse/
├── backend/
│   ├── src/
│   │   ├── server.ts          # entry: HTTP server + WS attach
│   │   ├── app.ts             # express app factory (middleware, routes, errors)
│   │   ├── config.ts          # env-driven config
│   │   ├── http.ts            # fetch wrapper (timeout, error normalization)
│   │   ├── cache.ts           # node-cache + cached() helper + TTLs
│   │   ├── ws.ts              # WebSocket relay (ticker / depth / trades)
│   │   ├── routes/api.ts      # all REST endpoints
│   │   └── services/          # one file per data source + orchestration
│   │       ├── coingecko.ts   # markets/chart/ohlc/coin/global/search
│   │       ├── markets.ts      # multi-source markets failover
│   │       ├── charts.ts       # chart/ohlc failover (CoinGecko → Binance)
│   │       ├── coinDetail.ts   # coin detail failover (CoinGecko → CoinPaprika)
│   │       ├── binanceChart.ts # Binance klines (public data mirror)
│   │       ├── binanceMap.ts   # coinId → Binance pair map
│   │       ├── fx.ts           # USD→IDR/EUR FX (failover + static fallback)
│   │       ├── feargreed.ts    # alternative.me Fear & Greed
│   │       └── news.ts         # RSS aggregation (no key)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # bootstrap (theme, query client, router)
│   │   ├── App.tsx            # routes + global alert watcher
│   │   ├── index.css          # Tailwind + semantic theme tokens (dark/light)
│   │   ├── components/        # presentational + chart widgets
│   │   ├── hooks/             # WS & FX hooks
│   │   ├── lib/               # api client, types, stores, formatters, indicators
│   │   └── pages/             # route pages
│   ├── public/                # favicon, manifest, service worker
│   └── vite.config.ts
├── README.md
├── AGENTS.md
├── LICENSE
└── TODO.md
```

### Key files to read first
- `backend/src/routes/api.ts` — every endpoint and its validation.
- `backend/src/services/coingecko.ts` — canonical data shapes (match these!).
- `frontend/src/lib/types.ts` — the shared contract between FE and BE.
- `frontend/src/components/PriceChart.tsx` — the chart + indicators engine.
- `frontend/src/lib/store.ts` — persisted user state.

---

## 3. Commands

Run from the relevant subdirectory.

```bash
# Backend
cd backend
npm install
npm run dev        # tsx watch -> http://localhost:8787
npm run build      # tsc -> dist/
npm start          # node dist/server.js
npm test           # vitest run
npx tsc --noEmit   # typecheck

# Frontend
cd frontend
npm install
npm run dev        # vite -> http://localhost:5173 (proxies /api and /ws)
npm run build      # tsc -b && vite build
npm run preview
npm run lint       # eslint
npm test           # vitest run
npx tsc -b         # typecheck
```

The Vite dev server proxies `/api` → `http://localhost:8787` and `/ws` →
`ws://localhost:8787`, so **start the backend first** when developing.

---

## 4. Conventions

### General
- **TypeScript strict mode** everywhere. No `any` unless absolutely necessary
  (lint warns on `@typescript-eslint/no-explicit-any`).
- Prefer **named exports** for components and utilities.
- Keep files focused; extract logic into `lib/` or `services/` when it grows.
- Comments explain **why**, not **what**. Keep them sparse and meaningful.

### Backend
- One service file per external data source. Services return **CoinGecko-shaped**
  objects so the frontend contract never changes when a source fails over.
- Always wrap upstream calls with `cached(key, ttl, fn)` to protect free rate limits.
- Use the `fetchJson` helper — it adds timeouts, the CoinGecko demo key, and
  normalizes errors into `ApiError`.
- Validate and coerce query params in `routes/api.ts`; throw `ApiError` for 4xx.
- Never hardcode API keys — read from `config` (env).

### Frontend
- **Server state** → TanStack Query (`useQuery`). **UI state** → Zustand (`lib/store.ts`).
- Use the semantic theme tokens (`var(--color-surface)`, `--color-border`, …) and
  the `.text-up` / `.text-down` / `.accent` helpers — never hardcode theme colors.
- Format all numbers via `lib/format.ts` (null/NaN safe).
- Live prices from Binance are **USDT (≈USD)**; convert with `useFxRates()` before
  displaying in a non-USD currency. **Never** show a raw USDT number under an IDR/EUR label.
- Charts live in `components/PriceChart.tsx`; indicators are pure functions in
  `lib/indicators.ts` (keep them dependency-free and tested).

---

## 5. Adding a New Data Source (failover pattern)

1. Create `backend/src/services/<source>.ts` that returns the existing shape
   (e.g. `MarketCoin` for markets).
2. Register it in the relevant orchestrator: `markets.ts`, `charts.ts`, or
   `coinDetail.ts` — append to the provider array **in fallback order**.
3. Update `lastSource` so `/api/sources` reflects which provider served the data.
4. Add the host to any allow-list if needed and confirm it needs **no API key**.
5. Add a test or at least verify via `curl` that the endpoint works when the
   primary source is unreachable.

---

## 6. Testing

- **Backend**: `vitest` — currently covers the cache helper. Add tests for any
  new pure logic (parsers, normalizers, FX math).
- **Frontend**: `vitest` + `@testing-library/react` (jsdom). Existing coverage:
  indicators (SMA/EMA/BB/RSI/MACD), formatters (null-safe), theme application,
  Binance symbol mapping, FX conversion.
- **Rule**: any bug fix gets a regression test; any new pure function gets a test.
- Indicator math must be validated against known values, not snapshots.

---

## 7. Definition of Done

Before considering a change complete, all of these must pass:

```bash
# backend
cd backend && npx tsc --noEmit && npm test
# frontend
cd frontend && npx eslint src && npx tsc -b && npm test && npm run build
```

Also verify the feature end-to-end with both servers running (the dev proxy path),
not just in isolation.

---

## 8. Do NOT

- ❌ Commit `.env`, keys, tokens, or `service_account*.json`.
- ❌ Add a paid API or one requiring a secret key as a **hard dependency** — keep
  the app working with free, keyless sources (keys may be optional enhancements).
- ❌ Break the CoinGecko-shaped API contract without updating `lib/types.ts` and
  all consumers.
- ❌ Introduce heavy dependencies for trivial problems.
- ❌ Hardcode theme colors or show un-converted USDT prices in non-USD currencies.
- ❌ Remove the IPv4-first bootstrap (`backend/src/bootstrap.ts`) — it fixes
  `fetch failed` on IPv6-less networks.

---

## 9. Free Data Sources (all keyless by default)

| Domain     | Sources (fallback order)                       |
| ---------- | ---------------------------------------------- |
| Markets    | CoinGecko → CoinCap → CoinPaprika              |
| Chart/OHLC | CoinGecko → Binance klines (data-api mirror)   |
| Coin detail| CoinGecko → CoinPaprika                        |
| Live WS    | Binance (`stream.binance.com`: ticker/depth/trades) |
| FX         | frankfurter → open.er-api → static fallback    |
| Fear&Greed | alternative.me                                 |
| News       | CoinDesk / Cointelegraph / Decrypt RSS         |

---

## 10. License

MIT — see `LICENSE`. By contributing you agree your work is released under it.
