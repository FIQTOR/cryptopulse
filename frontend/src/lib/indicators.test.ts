import { describe, it, expect } from 'vitest';
import { sma, ema, bollinger, rsi, macd } from '../lib/indicators';

describe('sma', () => {
  it('computes a simple moving average with warm-up nulls', () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out).toEqual([null, null, 2, 3, 4]);
  });

  it('handles period larger than data', () => {
    expect(sma([1, 2], 5)).toEqual([null, null]);
  });

  it('returns all nulls for invalid period', () => {
    expect(sma([1, 2, 3], 0)).toEqual([null, null, null]);
  });
});

describe('ema', () => {
  it('seeds with the SMA of the first period', () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    // seed at index 2 = (1+2+3)/3 = 2
    expect(out[2]).toBeCloseTo(2);
    // then k = 2/(3+1) = 0.5 -> 4*0.5 + 2*0.5 = 3
    expect(out[3]).toBeCloseTo(3);
    // 5*0.5 + 3*0.5 = 4
    expect(out[4]).toBeCloseTo(4);
  });

  it('returns nulls when data shorter than period', () => {
    expect(ema([1, 2], 3)).toEqual([null, null]);
  });
});

describe('bollinger', () => {
  it('has zero-width bands for constant input', () => {
    const { upper, middle, lower } = bollinger([5, 5, 5, 5, 5], 3, 2);
    expect(middle[2]).toBeCloseTo(5);
    expect(upper[2]).toBeCloseTo(5);
    expect(lower[2]).toBeCloseTo(5);
  });

  it('upper > middle > lower for varying input', () => {
    const { upper, middle, lower } = bollinger([1, 2, 3, 4, 5, 6, 7], 3, 2);
    const i = 6;
    expect(upper[i]!).toBeGreaterThan(middle[i]!);
    expect(middle[i]!).toBeGreaterThan(lower[i]!);
  });
});

describe('rsi', () => {
  it('is 100 when price only rises', () => {
    const out = rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14);
    expect(out[14]).toBeCloseTo(100);
  });

  it('is between 0 and 100 for mixed data', () => {
    const out = rsi([44, 44.3, 44.1, 44.5, 45, 44.8, 45.2, 45.5, 45.1, 45.7, 46, 45.6, 46.2, 46.5, 46.1], 14);
    const v = out[14]!;
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(100);
  });

  it('has nulls during the warm-up period', () => {
    const out = rsi([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[3]).not.toBeNull();
  });
});

describe('macd', () => {
  it('produces histogram = macd - signal where both defined', () => {
    const data = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 4) * 5 + i * 0.2);
    const { macd: m, signal, histogram } = macd(data, 12, 26, 9);
    for (let i = 0; i < data.length; i++) {
      if (m[i] != null && signal[i] != null) {
        expect(histogram[i]).toBeCloseTo((m[i] as number) - (signal[i] as number), 6);
      }
    }
  });

  it('has nulls before the slow EMA is available', () => {
    const data = Array.from({ length: 40 }, (_, i) => i + 1);
    const { macd: m } = macd(data, 12, 26, 9);
    expect(m[24]).toBeNull();
    expect(m[26]).not.toBeNull();
  });
});
