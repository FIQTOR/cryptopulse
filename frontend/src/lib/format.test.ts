import { describe, it, expect } from 'vitest';
import { formatPercent, formatNumber, classForChange } from '../lib/format';

describe('format helpers', () => {
  it('formats positive percent with a plus sign', () => {
    expect(formatPercent(3.456)).toBe('+3.46%');
  });

  it('formats negative percent', () => {
    expect(formatPercent(-2.1)).toBe('-2.10%');
  });

  it('handles undefined', () => {
    expect(formatPercent(undefined)).toBe('—');
  });

  it('handles null (CoinGecko can return null)', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('handles NaN', () => {
    expect(formatPercent(NaN)).toBe('—');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(1234567.89)).toBe('1,234,568');
  });

  it('returns correct color class by sign', () => {
    expect(classForChange(1)).toContain('text-up');
    expect(classForChange(-1)).toContain('text-down');
    expect(classForChange(0)).toContain('text-slate-400');
  });

  it('handles null in classForChange', () => {
    expect(classForChange(null)).toContain('text-slate-400');
  });
});
