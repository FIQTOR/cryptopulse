import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useSettings } from '../lib/store';
import { Card, ErrorState, Skeleton, Stat } from '../components/ui';
import { formatCompact, formatPercent, formatNumber } from '../lib/format';
import { CoinTable } from '../components/CoinTable';
import { Gauge } from '../components/Gauge';
import { CoinChartCard } from '../components/CoinChartCard';
import { HotNews } from '../components/HotNews';

export function MarketsPage() {
  const currency = useSettings((s) => s.currency);

  const globalQ = useQuery({ queryKey: ['global'], queryFn: api.global, refetchInterval: 60_000 });
  const marketsQ = useQuery({
    queryKey: ['markets', currency],
    queryFn: () => api.markets(currency, 100),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const fngQ = useQuery({ queryKey: ['fng'], queryFn: api.fearGreed, refetchInterval: 300_000 });

  return (
    <div className="space-y-6">
      {/* ---- Hero: Bitcoin chart ---- */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">Bitcoin (BTC)</h1>
          <Link to="/coin/bitcoin" className="text-sm text-accent hover:underline">
            View details →
          </Link>
        </div>
        <CoinChartCard coinId="bitcoin" height={340} />
      </section>

      {/* ---- Global stats ---- */}
      <section className="flex flex-wrap gap-3">
        {globalQ.isLoading && <Skeleton className="h-24 flex-1" />}
        {globalQ.data && (
          <>
            <Stat
              label="Global Market Cap"
              value={formatCompact(globalQ.data.totalMarketCap, currency)}
              sub={formatPercent(globalQ.data.marketCapChange24h)}
              accent={globalQ.data.marketCapChange24h >= 0 ? 'up' : 'down'}
            />
            <Stat label="24h Volume" value={formatCompact(globalQ.data.totalVolume, currency)} />
            <Stat label="BTC Dominance" value={`${formatNumber(globalQ.data.btcDominance, 1)}%`} />
            <Stat label="ETH Dominance" value={`${formatNumber(globalQ.data.ethDominance, 1)}%`} />
            <Stat label="Coins" value={globalQ.data.activeCryptocurrencies.toLocaleString()} />
          </>
        )}
        {fngQ.data && (
          <Card className="flex min-w-[180px] flex-1 items-center gap-4">
            <Gauge value={fngQ.data.value} />
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Fear &amp; Greed</div>
              <div className="text-lg font-semibold">{fngQ.data.value}</div>
              <div className="text-sm text-slate-400">{fngQ.data.classification}</div>
            </div>
          </Card>
        )}
      </section>

      {/* ---- Hot news + markets ---- */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {marketsQ.isError && (
            <ErrorState message={(marketsQ.error as Error).message} onRetry={() => marketsQ.refetch()} />
          )}
          {marketsQ.data && <CoinTable coins={marketsQ.data} currency={currency} title="Top Cryptocurrencies" live />}
        </div>
        <div className="min-w-0">
          <HotNews limit={7} />
        </div>
      </section>
    </div>
  );
}
