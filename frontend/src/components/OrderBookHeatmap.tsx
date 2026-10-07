import { useMemo } from 'react';
import type { OrderBookSnapshot } from '../lib/types';
import { formatCurrency, formatNumber } from '../lib/format';
import { clsx } from 'clsx';

/**
 * Visual order book "heatmap":
 *  - asks stacked above the spread (red), bids below (green)
 *  - each row's background intensity scales with relative size (cumulative depth)
 *  - the spread row shows mid price + spread %
 */
export function OrderBookHeatmap({
  book,
  currency = 'usd',
  levels = 12,
}: {
  book: OrderBookSnapshot | null;
  currency?: 'usd' | 'idr' | 'eur';
  levels?: number;
}) {
  const view = useMemo(() => {
    if (!book) return null;

    const asks = book.asks.slice(0, levels); // ascending price
    const bids = book.bids.slice(0, levels); // descending price
    if (!asks.length || !bids.length) return null;

    // Cumulative depth from best price outward.
    const askCum: { price: number; qty: number; cum: number }[] = [];
    let acc = 0;
    for (const [price, qty] of asks) {
      acc += qty;
      askCum.push({ price, qty, cum: acc });
    }
    const bidCum: { price: number; qty: number; cum: number }[] = [];
    acc = 0;
    for (const [price, qty] of bids) {
      acc += qty;
      bidCum.push({ price, qty, cum: acc });
    }

    const maxCum = Math.max(askCum.at(-1)!.cum, bidCum.at(-1)!.cum) || 1;
    const bestAsk = asks[0][0];
    const bestBid = bids[0][0];
    const mid = (bestAsk + bestBid) / 2;
    const spread = bestAsk - bestBid;
    const spreadPct = (spread / mid) * 100;

    return { askCum, bidCum, maxCum, mid, spread, spreadPct };
  }, [book, levels]);

  if (!view) {
    return <div className="py-10 text-center text-sm text-slate-500">Connecting to order book…</div>;
  }

  // Asks are displayed highest-price first (top), best ask nearest the middle.
  const asksTopDown = [...view.askCum].reverse();

  return (
    <div className="text-sm tabular">
      <div className="grid grid-cols-3 px-2 pb-1 text-xs uppercase text-slate-500">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Cumulative</span>
      </div>

      {asksTopDown.map((l, i) => (
        <Row
          key={`a${i}`}
          price={l.price}
          qty={l.qty}
          cum={l.cum}
          maxCum={view.maxCum}
          side="ask"
          currency={currency}
        />
      ))}

      <div className="my-1 flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-2 py-1.5">
        <span className="text-base font-semibold text-accent">{formatCurrency(view.mid, currency)}</span>
        <span className="text-xs text-slate-400">
          Spread {formatCurrency(view.spread, currency)} ({view.spreadPct.toFixed(3)}%)
        </span>
      </div>

      {view.bidCum.map((l, i) => (
        <Row
          key={`b${i}`}
          price={l.price}
          qty={l.qty}
          cum={l.cum}
          maxCum={view.maxCum}
          side="bid"
          currency={currency}
        />
      ))}
    </div>
  );
}

function Row({
  price,
  qty,
  cum,
  maxCum,
  side,
  currency,
}: {
  price: number;
  qty: number;
  cum: number;
  maxCum: number;
  side: 'bid' | 'ask';
  currency: 'usd' | 'idr' | 'eur';
}) {
  const intensity = Math.min(cum / maxCum, 1);
  const pct = Math.max(intensity * 100, 2);
  const color = side === 'bid' ? '34,197,94' : '239,68,68';
  return (
    <div className="relative grid grid-cols-3 px-2 py-[3px]">
      {/* depth heat bar */}
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${pct}%`, backgroundColor: `rgba(${color},${0.10 + intensity * 0.35})` }}
      />
      <span className={clsx('relative z-10', side === 'bid' ? 'text-up' : 'text-down')}>
        {formatCurrency(price, currency)}
      </span>
      <span className="relative z-10 text-right text-slate-300">{formatNumber(qty, 4)}</span>
      <span className="relative z-10 text-right text-slate-400">{formatNumber(cum, 4)}</span>
    </div>
  );
}
