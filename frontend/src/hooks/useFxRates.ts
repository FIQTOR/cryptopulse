import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Currency } from '../lib/types';

/**
 * USD-based FX rates (cached ~1h by the backend).
 * Used to convert live USDT ticks (which are USD-pegged) into the
 * user's selected currency so labels and numbers always agree.
 */
export function useFxRates() {
  const q = useQuery({
    queryKey: ['fx'],
    queryFn: api.fx,
    staleTime: 30 * 60_000,
    refetchInterval: 60 * 60_000,
  });
  return q.data;
}

/** Convert a USDT (≈USD) price into the target currency. */
export function convertFromUsd(usd: number, currency: Currency, rates?: { usd: number; idr: number; eur: number }): number {
  if (!rates) return usd; // best effort until rates load
  return usd * (rates[currency] ?? 1);
}
