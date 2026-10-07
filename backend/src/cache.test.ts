import { describe, it, expect } from 'vitest';
import { cached } from './cache.js';

describe('cache helper', () => {
  it('caches the result of the factory function', async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      return { value: 42 };
    };
    const a = await cached('t1', 60, fn);
    const b = await cached('t1', 60, fn);
    expect(a).toEqual({ value: 42 });
    expect(b).toEqual({ value: 42 });
    expect(calls).toBe(1);
  });
});
