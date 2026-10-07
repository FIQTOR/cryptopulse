import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useWatchlist } from '../lib/store';

export function WatchToggle({ id }: { id: string }) {
  const { has, toggle } = useWatchlist();
  const active = has(id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      aria-label={active ? 'Remove from watchlist' : 'Add to watchlist'}
      className={clsx('p-1 transition', active ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400')}
    >
      <Star size={16} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
