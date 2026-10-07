import { describe, it, expect } from 'vitest';
import { convertFromUsd } from '../hooks/useFxRates';

describe('convertFromUsd', () => {
  const rates = { usd: 1, idr: 17841, eur: 0.887 };

  it('keeps USD unchanged', () => {
    expect(convertFromUsd(84000, 'usd', rates)).toBe(84000);
  });

  it('converts USDT price into IDR', () => {
    // Regression: live Binance ticks are USDT; switching to IDR must scale the price.
    expect(convertFromUsd(84000, 'idr', rates)).toBeCloseTo(84000 * 17841);
  });

  it('converts USDT price into EUR', () => {
    expect(convertFromUsd(84000, 'eur', rates)).toBeCloseTo(84000 * 0.887);
  });

  it('falls back to identity when rates are missing', () => {
    expect(convertFromUsd(84000, 'idr', undefined)).toBe(84000);
  });
});
