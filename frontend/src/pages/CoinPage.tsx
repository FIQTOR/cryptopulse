import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettings, useWatchlist } from '../lib/store';
import type { ChartRange, ChartType } from '../lib/types';
import { PriceChart } from '../components/PriceChart';
import { DEFAULT_INDICATORS, type IndicatorConfig } from '../lib/indicatorsConfig';
import { Card, ErrorState, Skeleton } from '../components/ui';
import { classForChange, formatCompact, formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { WatchToggle } from '../components/WatchToggle';
import { OrderBookHeatmap } from '../components/OrderBookHeatmap';
import { RecentTrades } from '../components/RecentTrades';
import { useOrderBook } from '../hooks/useOrderBook';
import { useTrades } from '../hooks/useTrades';
import { toBinanceSymbol, BINANCE_SYMBOLS } from '../lib/binanceSymbols';
import { clsx } from 'clsx';

type Tab = 'chart' | 'info' | 'news';

export function CoinPage() {
  const { id = 'bitcoin' } = useParams();
  const currency = useSettings((s) => s.currency);
  const [range, setRange] = useState<ChartRange>('7');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [indicators, setIndicators] = useState<IndicatorConfig>(DEFAULT_INDICATORS);
  const [tab, setTab] = useState<Tab>('chart');
  const has = useWatchlist((s) => s.has(id));

  const coinQ = useQuery({ queryKey: ['coin', id], queryFn: () => api.coin(id) });
  const chartQ = useQuery({
    queryKey: ['chart', id, currency, range],
    queryFn: () => api.chart(id, currency, range),
  });
  const needCandles = chartType === 'candle' || chartType === 'bar';
  const candlesQ = useQuery({
    queryKey: ['candles', id, currency, range],
    queryFn: () => api.candles(id, currency, range),
    enabled: needCandles,
  });

  const binanceSymbol = toBinanceSymbol(id, coinQ.data?.symbol);
  const listedOnBinance = Boolean(BINANCE_SYMBOLS[id]);
  const { book } = useOrderBook(listedOnBinance ? binanceSymbol : null);
  const { trades, paused, togglePause } = useTrades(listedOnBinance ? binanceSymbol : null);

  if (coinQ.isLoading) return <Skeleton className="h-96" />;
  if (coinQ.isError) return <ErrorState message={(coinQ.error as Error).message} onRetry={() => coinQ.refetch()} />;

  const c = coinQ.data!;
  const md = c.market_data;
  const cur = currency;

  const toggleIndicator = (key: keyof IndicatorConfig) =>
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      {/* ---- Header bar (Binance-style) ---- */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <img src={c.image.large} alt="" className="h-10 w-10 rounded-full" />
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold">{c.name}</h1>
          <span className="text-sm uppercase text-slate-500">{c.symbol}</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular">
            {formatCurrency(md.current_price[cur], cur)}
          </span>
          <span className={clsx('tabular text-sm', classForChange(md.price_change_percentage_24h))}>
            {formatPercent(md.price_change_percentage_24h)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <WatchToggle id={id} />
          <span className="text-sm text-slate-400">{has ? 'Watching' : 'Watch'}</span>
        </div>
      </div>

      {/* ---- 24h stat strip ---- */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm sm:grid-cols-4">
        <Stat label="24h High" value={formatCurrency(md.high_24h[cur], cur)} />
        <Stat label="24h Low" value={formatCurrency(md.low_24h[cur], cur)} />
        <Stat label="24h Volume" value={formatCompact(md.total_volume[cur], cur)} />
        <Stat label="Market Cap" value={formatCompact(md.market_cap[cur], cur)} />
      </div>

      {/* ---- Tabs ---- */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {(['chart', 'info', 'news'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium capitalize transition',
              tab === t
                ? 'border-b-2 border-accent text-accent'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'chart' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Chart area */}
          <Card className="min-w-0">
            {chartQ.isLoading ? (
              <Skeleton className="h-[420px]" />
            ) : chartQ.data ? (
              <PriceChart
                data={chartQ.data}
                candles={candlesQ.data ?? null}
                indicators={indicators}
                onToggleIndicator={toggleIndicator}
                range={range}
                onRangeChange={setRange}
                chartType={chartType}
                onChartTypeChange={setChartType}
              />
            ) : (
              <ErrorState message="Failed to load chart" onRetry={() => chartQ.refetch()} />
            )}
          </Card>

          {/* Order book + trades sidebar (Binance-style) */}
          <div className="min-w-0 space-y-4">
            {listedOnBinance ? (
              <>
                <Card>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs uppercase text-slate-500">Order Book</span>
                    <span className="text-xs text-slate-500">{binanceSymbol}</span>
                  </div>
                  <OrderBookHeatmap book={book} currency={cur} levels={10} />
                </Card>
                <Card>
                  <RecentTrades trades={trades} currency={cur} paused={paused} onTogglePause={togglePause} />
                </Card>
              </>
            ) : (
              <Card className="text-center text-sm text-slate-500">
                Live order book &amp; trades are only available for coins listed on Binance.
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="space-y-4">
          <Card>
            <div className="mb-3 font-semibold">Market Stats</div>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Stat label="All-Time High" value={formatCurrency(md.ath[cur], cur)} />
              <Stat label="7d Change" value={formatPercent(md.price_change_percentage_7d)} accent={md.price_change_percentage_7d} />
              <Stat label="30d Change" value={formatPercent(md.price_change_percentage_30d)} accent={md.price_change_percentage_30d} />
              <Stat label="24h Change" value={formatPercent(md.price_change_percentage_24h)} accent={md.price_change_percentage_24h} />
              <Stat label="Circulating Supply" value={`${formatNumber(md.circulating_supply)} ${c.symbol.toUpperCase()}`} />
              <Stat label="Total Supply" value={md.total_supply ? formatNumber(md.total_supply) : '—'} />
              <Stat label="Max Supply" value={md.max_supply ? formatNumber(md.max_supply) : '∞'} />
              <Stat label="24h Range" value={`${formatCurrency(md.low_24h[cur], cur)} – ${formatCurrency(md.high_24h[cur], cur)}`} />
            </div>
          </Card>
          {c.description?.en && (
            <Card>
              <div className="mb-2 font-semibold">About {c.name}</div>
              <p className="text-sm leading-relaxed text-slate-400">{c.description.en}</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'news' && <CoinNews name={c.name} symbol={c.symbol} />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: number | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span
        className={clsx(
          'tabular font-medium',
          accent != null && (accent >= 0 ? 'text-up' : 'text-down'),
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CoinNews({ name, symbol }: { name: string; symbol: string }) {
  const newsQ = useQuery({ queryKey: ['news'], queryFn: api.news });
  const terms = [name.toLowerCase(), symbol.toLowerCase()];
  const filtered = (newsQ.data ?? []).filter((n) =>
    terms.some((t) => `${n.title} ${n.body}`.toLowerCase().includes(t)),
  );
  const items = filtered.length ? filtered : (newsQ.data ?? []);

  if (newsQ.isLoading) return <Skeleton className="h-64" />;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 9).map((n) => (
        <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="group">
          <Card className="flex h-full flex-col gap-2 p-4 transition group-hover:border-[var(--color-accent)]">
            <div className="text-xs text-slate-500">
              <span className="text-accent">{n.source}</span>
            </div>
            <h3 className="font-medium leading-snug group-hover:text-accent">{n.title}</h3>
            <p className="line-clamp-3 text-sm text-slate-400">{n.body}</p>
          </Card>
        </a>
      ))}
    </div>
  );
}
