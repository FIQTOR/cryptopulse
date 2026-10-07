import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type UTCTimestamp,
  ColorType,
  LineStyle,
  CrosshairMode,
} from 'lightweight-charts';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import type { ChartPoint, ChartRange, ChartType, OhlcCandle } from '../lib/types';
import { useSettings } from '../lib/store';
import { sma, ema, bollinger, rsi, macd } from '../lib/indicators';
import type { IndicatorConfig } from '../lib/indicatorsConfig';
import { clsx } from 'clsx';

const RANGES: Array<{ key: ChartRange; label: string }> = [
  { key: '1', label: '1D' },
  { key: '7', label: '7D' },
  { key: '30', label: '1M' },
  { key: '90', label: '3M' },
  { key: '365', label: '1Y' },
  { key: 'max', label: 'ALL' },
];

const CHART_TYPES: Array<{ key: ChartType; label: string }> = [
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
  { key: 'candle', label: 'Candle' },
  { key: 'bar', label: 'Bar' },
];

const INDICATOR_TOGGLES: Array<{ key: keyof IndicatorConfig; label: string }> = [
  { key: 'sma20', label: 'SMA 20' },
  { key: 'sma50', label: 'SMA 50' },
  { key: 'ema200', label: 'EMA 200' },
  { key: 'bollinger', label: 'BB' },
  { key: 'volume', label: 'Vol' },
  { key: 'rsi', label: 'RSI' },
  { key: 'macd', label: 'MACD' },
];

type Colors = { text: string; grid: string; border: string; up: string; down: string };

function themeColors(theme: 'dark' | 'light'): Colors {
  return theme === 'light'
    ? { text: '#475569', grid: '#e2e8f0', border: '#d8e0ec', up: '#16a34a', down: '#dc2626' }
    : { text: '#94a3b8', grid: '#1a2233', border: '#24304a', up: '#22c55e', down: '#ef4444' };
}

function baseOptions(width: number, height: number, c: Colors) {
  return {
    width,
    height,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: c.text },
    grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
    rightPriceScale: { borderColor: c.border },
    timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
    crosshair: { mode: CrosshairMode.Normal },
  };
}

function toLine(data: Array<{ t: number }>, series: Array<number | null>) {
  const seen = new Set<number>();
  const out: { time: UTCTimestamp; value: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const v = series[i];
    if (v == null) continue;
    const time = Math.floor(data[i].t / 1000) as UTCTimestamp;
    if (seen.has(time)) continue;
    seen.add(time);
    out.push({ time, value: v });
  }
  return out;
}

export function PriceChart({
  data,
  candles,
  indicators,
  onToggleIndicator,
  range,
  onRangeChange,
  chartType,
  onChartTypeChange,
  height = 380,
  showToolbar = true,
}: {
  data: ChartPoint[];
  candles: OhlcCandle[] | null;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  height?: number;
  showToolbar?: boolean;
}) {
  const theme = useSettings((s) => s.theme);
  const c = themeColors(theme);
  const [fullscreen, setFullscreen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const priceChartRef = useRef<IChartApi | null>(null);

  const prices = useMemo(() => data.map((d) => d.price), [data]);
  const ind = useMemo(
    () => ({
      sma20: sma(prices, 20),
      sma50: sma(prices, 50),
      ema200: ema(prices, 200),
      bb: bollinger(prices, 20, 2),
      rsi: rsi(prices, 14),
      macd: macd(prices, 12, 26, 9),
    }),
    [prices],
  );

  const showVolume = indicators.volume;
  const showRsi = indicators.rsi;
  const showMacd = indicators.macd;
  const useCandles = (chartType === 'candle' || chartType === 'bar') && candles && candles.length > 0;

  // --- Price chart (overlays + optional candles) ---
  useEffect(() => {
    if (!priceRef.current) return;
    const chart = createChart(priceRef.current, baseOptions(priceRef.current.clientWidth, height, c));
    priceChartRef.current = chart;

    if (useCandles && candles) {
      const candleSeries =
        chartType === 'bar'
          ? chart.addBarSeries({ upColor: c.up, downColor: c.down, thinBars: false })
          : chart.addCandlestickSeries({ upColor: c.up, downColor: c.down, borderVisible: false });
      const seen = new Set<number>();
      candleSeries.setData(
        candles
          .map((k) => ({
            time: Math.floor(k.t / 1000) as UTCTimestamp,
            open: k.o,
            high: k.h,
            low: k.l,
            close: k.c,
          }))
          .filter((p) => {
            const t = p.time as unknown as number;
            if (seen.has(t)) return false;
            seen.add(t);
            return true;
          }),
      );
    } else {
      const priceSeries =
        chartType === 'line'
          ? chart.addLineSeries({ color: '#22d3ee', lineWidth: 2 })
          : chart.addAreaSeries({
              lineColor: '#22d3ee',
              topColor: 'rgba(34,211,238,0.35)',
              bottomColor: 'rgba(34,211,238,0.02)',
              lineWidth: 2,
            });
      priceSeries.setData(toLine(data, prices));
    }

    // Overlays
    const addLine = (series: Array<number | null>, color: string, width = 1, dashed = false) => {
      const s = chart.addLineSeries({
        color,
        lineWidth: width as 1 | 2 | 3 | 4,
        lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toLine(data, series));
    };
    if (indicators.bollinger) {
      addLine(ind.bb.upper, '#a78bfa');
      addLine(ind.bb.middle, '#a78bfa', 1, true);
      addLine(ind.bb.lower, '#a78bfa');
    }
    if (indicators.sma20) addLine(ind.sma20, '#f59e0b');
    if (indicators.sma50) addLine(ind.sma50, '#3b82f6');
    if (indicators.ema200) addLine(ind.ema200, '#ec4899', 2);

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (priceRef.current) chart.applyOptions({ width: priceRef.current.clientWidth });
    });
    ro.observe(priceRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      priceChartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, candles, indicators, chartType, useCandles, height, theme, ind, prices]);

  // --- Volume pane ---
  useEffect(() => {
    if (!showVolume || !volRef.current) return;
    const chart = createChart(volRef.current, baseOptions(volRef.current.clientWidth, 92, c));
    const hist = chart.addHistogramSeries({ priceFormat: { type: 'volume' } });
    hist.setData(
      (useCandles && candles ? candles.map((k) => ({ t: k.t, v: k.v })) : data.map((d) => ({ t: d.t, v: d.volume }))).map(
        (d) => ({
          time: Math.floor(d.t / 1000) as UTCTimestamp,
          value: d.v,
          color: 'rgba(34,211,238,0.45)',
        }),
      ),
    );
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      if (volRef.current) chart.applyOptions({ width: volRef.current.clientWidth });
    });
    ro.observe(volRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, candles, showVolume, useCandles, theme]);

  // --- RSI pane ---
  useEffect(() => {
    if (!showRsi || !rsiRef.current) return;
    const chart = createChart(rsiRef.current, baseOptions(rsiRef.current.clientWidth, 120, c));
    const line = chart.addLineSeries({ color: '#eab308', lineWidth: 2, priceLineVisible: false });
    line.setData(toLine(data, ind.rsi));
    line.createPriceLine({ price: 70, color: c.down, lineStyle: LineStyle.Dashed, title: '70' });
    line.createPriceLine({ price: 30, color: c.up, lineStyle: LineStyle.Dashed, title: '30' });
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      if (rsiRef.current) chart.applyOptions({ width: rsiRef.current.clientWidth });
    });
    ro.observe(rsiRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showRsi, theme, ind]);

  // --- MACD pane ---
  useEffect(() => {
    if (!showMacd || !macdRef.current) return;
    const chart = createChart(macdRef.current, baseOptions(macdRef.current.clientWidth, 120, c));
    const hist = chart.addHistogramSeries({ priceLineVisible: false });
    hist.setData(
      toLine(data, ind.macd.histogram).map((p) => ({
        ...p,
        color: p.value >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)',
      })),
    );
    const macdLine = chart.addLineSeries({ color: '#22d3ee', lineWidth: 1, priceLineVisible: false });
    macdLine.setData(toLine(data, ind.macd.macd));
    const signalLine = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false });
    signalLine.setData(toLine(data, ind.macd.signal));
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      if (macdRef.current) chart.applyOptions({ width: macdRef.current.clientWidth });
    });
    ro.observe(macdRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showMacd, theme, ind]);

  const resetZoom = () => priceChartRef.current?.timeScale().fitContent();

  return (
    <div
      ref={wrapRef}
      className={clsx(
        'space-y-2',
        fullscreen && 'fixed inset-0 z-50 overflow-auto bg-[var(--color-bg)] p-4',
      )}
    >
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Range */}
          <div className="flex rounded-lg border border-[var(--color-border)] p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => onRangeChange(r.key)}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  range === r.key ? 'bg-accent text-black' : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex rounded-lg border border-[var(--color-border)] p-0.5">
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => onChartTypeChange(t.key)}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  chartType === t.key ? 'bg-accent text-black' : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex flex-wrap gap-1">
            {INDICATOR_TOGGLES.map((t) => (
              <button
                key={t.key}
                onClick={() => onToggleIndicator(t.key)}
                className={clsx(
                  'rounded-lg px-2 py-1 text-xs font-medium transition',
                  indicators[t.key] ? 'bg-[var(--color-surface-2)] text-accent' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1">
            <button
              onClick={resetZoom}
              title="Reset zoom"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setFullscreen((f) => !f)}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200"
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      )}

      <div ref={priceRef} className="w-full" style={{ height: fullscreen ? '60vh' : height }} />
      {showVolume && (
        <div>
          <div className="px-1 text-xs text-slate-500">Volume</div>
          <div ref={volRef} className="w-full" style={{ height: 92 }} />
        </div>
      )}
      {showRsi && (
        <div>
          <div className="px-1 text-xs text-slate-500">RSI (14)</div>
          <div ref={rsiRef} className="w-full" style={{ height: 120 }} />
        </div>
      )}
      {showMacd && (
        <div>
          <div className="flex items-center gap-3 px-1 text-xs text-slate-500">
            <span>MACD (12, 26, 9)</span>
            <Legend color="#22d3ee" label="MACD" />
            <Legend color="#f59e0b" label="Signal" />
          </div>
          <div ref={macdRef} className="w-full" style={{ height: 120 }} />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-400">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
