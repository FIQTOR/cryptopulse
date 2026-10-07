import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettings, useWatchlist } from '../lib/store';
import { CoinTable } from '../components/CoinTable';
import { EmptyState, Skeleton } from '../components/ui';

export function WatchlistPage() {
  const currency = useSettings((s) => s.currency);
  const ids = useWatchlist((s) => s.ids);

  const marketsQ = useQuery({
    queryKey: ['markets', currency],
    queryFn: () => api.markets(currency, 250),
    refetchInterval: 60_000,
  });

  if (marketsQ.isLoading) return <Skeleton className="h-96" />;
  const coins = (marketsQ.data ?? []).filter((c) => ids.includes(c.id));

  if (coins.length === 0)
    return <EmptyState title="Your watchlist is empty" hint="Tap the ★ on any coin to add it here." />;

  return <CoinTable coins={coins} currency={currency} title="Watchlist" live />;
}
