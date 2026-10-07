import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { usePortfolio, useSettings } from '../lib/store';
import { Card, EmptyState, Skeleton } from '../components/ui';
import { classForChange, formatCurrency, formatPercent } from '../lib/format';
import { clsx } from 'clsx';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb923c', '#60a5fa'];

export function PortfolioPage() {
  const currency = useSettings((s) => s.currency);
  const { holdings, add, remove, clear } = usePortfolio();
  const [form, setForm] = useState({ coinId: '', amount: '', buyPrice: '' });

  const marketsQ = useQuery({
    queryKey: ['markets', currency],
    queryFn: () => api.markets(currency, 250),
    refetchInterval: 60_000,
  });

  const priceMap = useMemo(() => {
    const m = new Map<string, { price: number; name: string; symbol: string; image: string }>();
    for (const c of marketsQ.data ?? [])
      m.set(c.id, { price: c.current_price, name: c.name, symbol: c.symbol, image: c.image });
    return m;
  }, [marketsQ.data]);

  const rows = holdings.map((h) => {
    const meta = priceMap.get(h.coinId);
    const price = meta?.price ?? 0;
    const value = price * h.amount;
    const cost = h.buyPrice * h.amount;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...h, price, value, cost, pnl, pnlPct, image: meta?.image };
  });

  const totalValue = rows.reduce((a, r) => a + r.value, 0);
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const pieData = rows
    .filter((r) => r.value > 0)
    .map((r) => ({ name: r.symbol.toUpperCase(), value: r.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const meta = priceMap.get(form.coinId.trim().toLowerCase());
    const amount = Number(form.amount);
    const buyPrice = Number(form.buyPrice);
    if (!form.coinId || !amount || !buyPrice) return;
    add({
      coinId: form.coinId.trim().toLowerCase(),
      name: meta?.name ?? form.coinId,
      symbol: meta?.symbol ?? form.coinId.slice(0, 4),
      image: meta?.image,
      amount,
      buyPrice,
    });
    setForm({ coinId: '', amount: '', buyPrice: '' });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total Value" value={formatCurrency(totalValue, currency)} />
        <SummaryCard label="Total Cost" value={formatCurrency(totalCost, currency)} />
        <SummaryCard
          label="Total P&L"
          value={formatCurrency(totalPnl, currency)}
          accent={totalPnl >= 0 ? 'up' : 'down'}
          sub={formatPercent(totalPnlPct)}
        />
        <SummaryCard label="Assets" value={String(rows.length)} />
      </div>

      <Card>
        <div className="mb-3 font-semibold">Add Holding</div>
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <input
            list="coin-options"
            placeholder="Coin id (e.g. bitcoin)"
            value={form.coinId}
            onChange={(e) => setForm({ ...form, coinId: e.target.value })}
            className="input"
          />
          <datalist id="coin-options">
            {(marketsQ.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </datalist>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input w-32"
          />
          <input
            type="number"
            step="any"
            placeholder={`Buy price (${currency.toUpperCase()})`}
            value={form.buyPrice}
            onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
            className="input w-40"
          />
          <button type="submit" className="btn-accent flex items-center gap-1">
            <Plus size={15} /> Add
          </button>
        </form>
      </Card>

      {marketsQ.isLoading && <Skeleton className="h-40" />}

      {rows.length === 0 && !marketsQ.isLoading && (
        <EmptyState title="No holdings yet" hint="Add a coin above to start tracking your portfolio." />
      )}

      {rows.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-3 py-2">Asset</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-right">P&L</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.coinId} className="border-b border-[var(--color-border)]/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.image && <img src={r.image} alt="" className="h-5 w-5 rounded-full" />}
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular">{r.amount}</td>
                    <td className="px-3 py-2 text-right tabular">{formatCurrency(r.price, currency)}</td>
                    <td className="px-3 py-2 text-right tabular">{formatCurrency(r.value, currency)}</td>
                    <td className={clsx('px-3 py-2 text-right tabular', classForChange(r.pnl))}>
                      {formatCurrency(r.pnl, currency)}
                      <div className="text-xs">{formatPercent(r.pnlPct)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => remove(r.coinId)} className="text-slate-500 hover:text-down">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={clear} className="w-full py-2 text-xs text-slate-500 hover:text-down">
              Clear all
            </button>
          </Card>

          <Card>
            <div className="mb-2 font-semibold">Allocation</div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v, currency)}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{d.name}</span>
                  <span className="ml-auto text-slate-400">
                    {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'up' | 'down';
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={clsx('mt-1 text-lg font-semibold tabular', accent === 'up' && 'text-up', accent === 'down' && 'text-down')}>
        {value}
      </div>
      {sub && <div className={clsx('text-xs tabular', accent === 'up' ? 'text-up' : 'text-down')}>{sub}</div>}
    </Card>
  );
}
