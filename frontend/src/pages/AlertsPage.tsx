import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellRing, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAlerts, useSettings } from '../lib/store';
import { Card, EmptyState } from '../components/ui';
import { formatCurrency } from '../lib/format';
import { clsx } from 'clsx';

export function AlertsPage() {
  const currency = useSettings((s) => s.currency);
  const { alerts, add, remove } = useAlerts();
  const [form, setForm] = useState({ coinId: '', target: '', direction: 'above' as 'above' | 'below' });
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const marketsQ = useQuery({
    queryKey: ['markets', currency],
    queryFn: () => api.markets(currency, 250),
    refetchInterval: 60_000,
  });

  const meta = new Map((marketsQ.data ?? []).map((c) => [c.id, c]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const coin = meta.get(form.coinId.trim().toLowerCase());
    const target = Number(form.target);
    if (!form.coinId || !target) return;
    add({
      id: crypto.randomUUID(),
      coinId: form.coinId.trim().toLowerCase(),
      symbol: coin?.symbol ?? form.coinId.slice(0, 4),
      name: coin?.name ?? form.coinId,
      target,
      direction: form.direction,
      triggered: false,
      createdAt: Date.now(),
    });
    setForm({ coinId: '', target: '', direction: 'above' });
  }

  async function enableNotifications() {
    const p = await Notification.requestPermission();
    setPerm(p);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Price Alerts</div>
          {perm !== 'granted' && (
            <button onClick={enableNotifications} className="btn-accent flex items-center gap-1">
              <Bell size={14} /> Enable notifications
            </button>
          )}
        </div>
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <input
            list="alert-coins"
            placeholder="Coin id (e.g. bitcoin)"
            value={form.coinId}
            onChange={(e) => setForm({ ...form, coinId: e.target.value })}
            className="input"
          />
          <datalist id="alert-coins">
            {(marketsQ.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </datalist>
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value as 'above' | 'below' })}
            className="input"
          >
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
          </select>
          <input
            type="number"
            step="any"
            placeholder={`Target (${currency.toUpperCase()})`}
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            className="input w-40"
          />
          <button type="submit" className="btn-accent">
            Create alert
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Alerts fire as browser notifications while CryptoPulse is open (free Web Notifications API).
        </p>
      </Card>

      {alerts.length === 0 && <EmptyState title="No alerts yet" hint="Create one to get notified on a price target." />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((a) => {
          const c = meta.get(a.coinId);
          return (
            <Card key={a.id} className={clsx('flex items-center gap-3', a.triggered && 'opacity-60')}>
              <div className={clsx('rounded-lg p-2', a.triggered ? 'bg-up/20 text-up' : 'bg-[var(--color-surface-2)] text-accent')}>
                {a.triggered ? <BellRing size={18} /> : <Bell size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {a.name} {a.direction} {formatCurrency(a.target, currency)}
                </div>
                <div className="text-xs text-slate-400">
                  Now: {c ? formatCurrency(c.current_price, currency) : '—'} ·{' '}
                  {a.triggered ? 'triggered' : 'active'}
                </div>
              </div>
              <button onClick={() => remove(a.id)} className="text-slate-500 hover:text-down">
                <Trash2 size={15} />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
