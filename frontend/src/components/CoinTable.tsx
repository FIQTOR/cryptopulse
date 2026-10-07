import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Currency, MarketCoin } from '../lib/types';
import { classForChange, formatCompact, formatCurrency, formatPercent } from '../lib/format';
import { Sparkline } from './Sparkline';
import { WatchToggle } from './WatchToggle';
import { useLivePrices } from '../hooks/useLivePrices';
import { useFxRates } from '../hooks/useFxRates';
import { Card } from './ui';
import { clsx } from 'clsx';

type SortKey = 'market_cap_rank' | 'current_price' | 'price_change_percentage_24h';

export function CoinTable({
  coins,
  currency,
  title,
  live = false,
}: {
  coins: MarketCoin[];
  currency: Currency;
  title?: string;
  live?: boolean;
}) {
  const navigate = useNavigate();
  const fx = useFxRates();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'market_cap_rank',
    dir: 'asc',
  });

  const symbols = useMemo(() => coins.slice(0, 30).map((c) => c.symbol), [coins]);
  const { ticks } = useLivePrices(live ? symbols : []);

  const sorted = useMemo(() => {
    const list = [...coins];
    list.sort((a, b) => {
      const av = a[sort.key] ?? 0;
      const bv = b[sort.key] ?? 0;
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [coins, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  // Live ticks from Binance are USDT (≈USD). Convert to the active currency so
  // the displayed number always matches the currency label.
  const rate = fx?.[currency] ?? 1;

  return (
    <Card className="overflow-hidden p-0">
      {title && (
        <div className="border-b border-[var(--color-border)] px-4 py-3 font-semibold">{title}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Coin</th>
              <th
                className="cursor-pointer px-3 py-2 text-right"
                onClick={() => toggleSort('current_price')}
              >
                Price {sort.key === 'current_price' && (sort.dir === 'asc' ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />)}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-right"
                onClick={() => toggleSort('price_change_percentage_24h')}
              >
                24h
              </th>
              <th className="hidden px-3 py-2 text-right sm:table-cell">Market Cap</th>
              <th className="hidden px-3 py-2 text-right md:table-cell">7d</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const tick = ticks[`${c.symbol.toUpperCase()}USDT`];
              const price = tick ? tick.price * rate : c.current_price;
              const change24 = tick?.changePercent ?? c.price_change_percentage_24h;
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/coin/${c.id}`)}
                  className="cursor-pointer border-b border-[var(--color-border)]/50 transition hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-3 py-2 text-slate-500">{c.market_cap_rank}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <WatchToggle id={c.id} />
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full" />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs uppercase text-slate-500">{c.symbol}</span>
                    </div>
                  </td>
                  <td className={clsx('px-3 py-2 text-right tabular', tick && 'flash')}>
                    {formatCurrency(price, currency)}
                  </td>
                  <td className={clsx('px-3 py-2 text-right tabular', classForChange(change24))}>
                    {formatPercent(change24)}
                  </td>
                  <td className="hidden px-3 py-2 text-right tabular sm:table-cell">
                    {formatCompact(c.market_cap, currency)}
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">
                    <div className="flex items-center justify-end gap-3">
                      <span className={classForChange(c.price_change_percentage_7d_in_currency)}>
                        {formatPercent(c.price_change_percentage_7d_in_currency)}
                      </span>
                      {c.sparkline_in_7d?.price && (
                        <Sparkline
                          data={c.sparkline_in_7d.price}
                          positive={(c.price_change_percentage_7d_in_currency ?? 0) >= 0}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
