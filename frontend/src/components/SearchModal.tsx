import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '../lib/api';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q),
    enabled: q.trim().length >= 1,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search coins (e.g. bitcoin, sol)…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="mt-2 max-h-80 overflow-y-auto">
          {(data?.coins ?? []).slice(0, 12).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                navigate(`/coin/${c.id}`);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[var(--color-surface-2)]"
            >
              <img src={c.thumb} alt="" className="h-6 w-6 rounded-full" />
              <span className="font-medium">{c.name}</span>
              <span className="text-xs uppercase text-slate-500">{c.symbol}</span>
              {c.market_cap_rank && (
                <span className="ml-auto text-xs text-slate-500">#{c.market_cap_rank}</span>
              )}
            </button>
          ))}
          {q && data?.coins.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-slate-500">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}
