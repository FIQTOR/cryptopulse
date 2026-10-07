import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, ErrorState, Skeleton } from '../components/ui';
import { timeAgo } from '../lib/format';

export function NewsPage() {
  const newsQ = useQuery({ queryKey: ['news'], queryFn: api.news, refetchInterval: 300_000 });

  if (newsQ.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );

  if (newsQ.isError) return <ErrorState message={(newsQ.error as Error).message} onRetry={() => newsQ.refetch()} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(newsQ.data ?? []).map((n) => (
        <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="group">
          <Card className="flex h-full flex-col gap-2 overflow-hidden p-0 transition group-hover:border-[var(--color-accent)]">
            {n.imageUrl && (
              <img src={n.imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="text-accent">{n.source}</span>
                <span>·</span>
                <span>{timeAgo(n.publishedAt)}</span>
              </div>
              <h3 className="font-medium leading-snug group-hover:text-accent">{n.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-400">{n.body}</p>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
