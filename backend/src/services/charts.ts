import * as cg from './coingecko.js';
import { getBinanceKlines } from './binanceChart.js';
import { lastSource } from './markets.js';
import type { Currency } from './coingecko.js';

/**
 * Chart orchestration with failover:
 *   line/area -> CoinGecko market_chart -> Binance klines (converted)
 *   candle    -> CoinGecko ohlc         -> Binance klines
 */
export async function getChartWithFallback(
  coinId: string,
  currency: Currency,
  days: cg.ChartRange,
): Promise<Array<{ t: number; price: number; volume: number }>> {
  try {
    const data = await cg.getChart(coinId, currency, days);
    lastSource.chart = 'coingecko';
    return data;
  } catch {
    const klines = await getBinanceKlines(coinId, currency, days);
    if (klines) {
      lastSource.chart = 'binance';
      return klines.map((k) => ({ t: k.t, price: k.c, volume: k.v }));
    }
    throw new Error('chart sources failed');
  }
}

export async function getOhlcWithFallback(
  coinId: string,
  currency: Currency,
  days: cg.ChartRange,
): Promise<Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>> {
  try {
    const data = await cg.getOhlc(coinId, currency, days);
    lastSource.chart = 'coingecko';
    return data;
  } catch {
    const klines = await getBinanceKlines(coinId, currency, days);
    if (klines) {
      lastSource.chart = 'binance';
      return klines;
    }
    throw new Error('candle sources failed');
  }
}
