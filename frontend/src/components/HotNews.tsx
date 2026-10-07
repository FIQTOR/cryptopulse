import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, ErrorState, Skeleton } from './ui';
import { timeAgo } from '../lib/format';

/** Compact "hot news" list for the home page. */
export function HotNews({ limit = 6 }: { limit?: number }) {
  const newsQ = useQuery({ queryKey: ['news'], queryFn: api.news, refetchInterval: 300_000 });

  if (newsQ.isLoading) {
    return (
      <Card className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </Card>
    );
  }
  if (newsQ.isError)
    return <ErrorState message={(newsQ.error as Error).message} onRetry={() => newsQ.refetch()} />;

  return (
    <Card className="p-0">
      <div className="border-b border-[var(--color-border)] px-4 py-3 font-semibold">
        🔥 Hot News
      </div>
      <div className="divide-y divide-[var(--color-border)]/60">
        {(newsQ.data ?? []).slice(0, limit).map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--color-surface-2)]"
          >
            {n.imageUrl && (
              <img src={n.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" loading="lazy" />
            )}
            <div className="min-w-0">
              <div className="line-clamp-2 text-sm font-medium leading-snug">{n.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                <span className="text-accent">{n.source}</span> · {timeAgo(n.publishedAt)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
