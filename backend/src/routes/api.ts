import { Router } from 'express';
import * as cg from '../services/coingecko.js';
import { getMarkets, lastSource } from '../services/markets.js';
import { getChartWithFallback, getOhlcWithFallback } from '../services/charts.js';
import { getCoinWithFallback } from '../services/coinDetail.js';
import { getFxRates } from '../services/fx.js';
import { getFearGreed } from '../services/feargreed.js';
import { getNews } from '../services/news.js';
import { ApiError } from '../http.js';

export const api = Router();

const VALID_CURRENCIES = new Set(['usd', 'idr', 'eur']);
const VALID_RANGES = new Set(['1', '7', '30', '90', '365', 'max']);

function currency(v: unknown): cg.Currency {
  const s = String(v ?? 'usd').toLowerCase();
  if (!VALID_CURRENCIES.has(s)) throw new ApiError(400, `Invalid currency: ${s}`);
  return s as cg.Currency;
}

api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cryptopulse', ts: Date.now() });
});

api.get('/global', async (_req, res, next) => {
  try {
    res.json(await cg.getGlobal());
  } catch (e) {
    next(e);
  }
});

api.get('/markets', async (req, res, next) => {
  try {
    const cur = currency(req.query.currency);
    const perPage = Math.min(Number(req.query.per_page ?? 100), 250);
    const page = Math.max(Number(req.query.page ?? 1), 1);
    res.json(await getMarkets(cur, perPage, page));
  } catch (e) {
    next(e);
  }
});

api.get('/fx', async (_req, res, next) => {
  try {
    res.json(await getFxRates());
  } catch (e) {
    next(e);
  }
});

api.get('/sources', (_req, res) => {
  res.json({ lastUsed: { ...lastSource } });
});

api.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.json({ coins: [] });
    res.json(await cg.search(q));
  } catch (e) {
    next(e);
  }
});

api.get('/coin/:id', async (req, res, next) => {
  try {
    res.json(await getCoinWithFallback(req.params.id));
  } catch (e) {
    next(e);
  }
});

api.get('/chart/:id', async (req, res, next) => {
  try {
    const cur = currency(req.query.currency);
    const days = String(req.query.days ?? '7');
    const type = String(req.query.type ?? 'line');
    if (!VALID_RANGES.has(days)) throw new ApiError(400, `Invalid days: ${days}`);
    if (type === 'candle') {
      res.json(await getOhlcWithFallback(req.params.id, cur, days as cg.ChartRange));
    } else {
      res.json(await getChartWithFallback(req.params.id, cur, days as cg.ChartRange));
    }
  } catch (e) {
    next(e);
  }
});

api.get('/fear-greed', async (_req, res, next) => {
  try {
    res.json(await getFearGreed());
  } catch (e) {
    next(e);
  }
});

api.get('/news', async (_req, res, next) => {
  try {
    res.json(await getNews());
  } catch (e) {
    next(e);
  }
});
