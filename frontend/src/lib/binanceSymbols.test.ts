import { describe, it, expect } from 'vitest';
import { toBinanceSymbol, BINANCE_SYMBOLS } from '../lib/binanceSymbols';

describe('toBinanceSymbol', () => {
  it('maps known coingecko ids to binance pairs', () => {
    expect(toBinanceSymbol('bitcoin')).toBe('BTCUSDT');
    expect(toBinanceSymbol('ethereum')).toBe('ETHUSDT');
    expect(toBinanceSymbol('solana')).toBe('SOLUSDT');
  });

  it('falls back to symbol + USDT when not mapped', () => {
    expect(toBinanceSymbol('unknowncoin', 'xyz')).toBe('XYZUSDT');
  });

  it('falls back to id + USDT when no symbol given', () => {
    expect(toBinanceSymbol('weirdcoin')).toBe('WEIRDCOINUSDT');
  });

  it('has all mapped values uppercase ending in USDT', () => {
    for (const v of Object.values(BINANCE_SYMBOLS)) {
      expect(v).toMatch(/^[A-Z0-9]+USDT$/);
    }
  });
});
