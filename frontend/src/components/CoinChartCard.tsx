import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettings } from '../lib/store';
import type { ChartRange, ChartType } from '../lib/types';
import { PriceChart } from '../components/PriceChart';
import { DEFAULT_INDICATORS, type IndicatorConfig } from '../lib/indicatorsConfig';
import { Card, ErrorState, Skeleton } from '../components/ui';

/**
 * Self-contained chart card for a given coin — used on the home page hero.
 * Owns its own range/type/indicator state so it can be embedded anywhere.
 */
export function CoinChartCard({
  coinId,
  title,
  height = 340,
}: {
  coinId: string;
  title?: string;
  height?: number;
}) {
  const currency = useSettings((s) => s.currency);
  const [range, setRange] = useState<ChartRange>('7');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [indicators, setIndicators] = useState<IndicatorConfig>(DEFAULT_INDICATORS);

  const chartQ = useQuery({
    queryKey: ['chart', coinId, currency, range],
    queryFn: () => api.chart(coinId, currency, range),
  });
  const needCandles = chartType === 'candle' || chartType === 'bar';
  const candlesQ = useQuery({
    queryKey: ['candles', coinId, currency, range],
    queryFn: () => api.candles(coinId, currency, range),
    enabled: needCandles,
  });

  const toggleIndicator = (key: keyof IndicatorConfig) =>
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Card className="min-w-0">
      {title && <div className="mb-3 font-semibold">{title}</div>}
      {chartQ.isLoading ? (
        <div style={{ height }}>
          <Skeleton className="h-full" />
        </div>
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
          height={height}
        />
      ) : (
        <ErrorState message="Failed to load chart" onRetry={() => chartQ.refetch()} />
      )}
    </Card>
  );
}
