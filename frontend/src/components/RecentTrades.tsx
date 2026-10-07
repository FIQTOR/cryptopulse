import { Pause, Play } from 'lucide-react';
import type { TradeTick } from '../lib/types';
import { formatCurrency, formatNumber } from '../lib/format';
import { clsx } from 'clsx';

/**
 * Realtime trade tape (a.k.a. "market trades" / time & sales).
 * Newest trade on top, colored by aggressor side.
 */
export function RecentTrades({
  trades,
  currency = 'usd',
  paused,
  onTogglePause,
}: {
  trades: TradeTick[];
  currency?: 'usd' | 'idr' | 'eur';
  paused?: boolean;
  onTogglePause?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase text-slate-500">Recent Trades</span>
        {onTogglePause && (
          <button
            onClick={onTogglePause}
            className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200"
          >
            {paused ? <Play size={11} /> : <Pause size={11} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 px-2 pb-1 text-xs uppercase text-slate-500">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Value</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto tabular">
        {trades.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">Waiting for trades…</div>
        )}
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 px-2 py-[3px] text-sm">
            <span className={clsx(t.side === 'buy' ? 'text-up' : 'text-down')}>
              {formatCurrency(t.price, currency)}
            </span>
            <span className="text-right text-slate-300">{formatNumber(t.qty, 5)}</span>
            <span className="text-right text-slate-400">
              {formatCurrency(t.price * t.qty, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
