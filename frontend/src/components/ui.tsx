import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
        'shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: 'up' | 'down' | 'none';
}) {
  return (
    <Card className="min-w-[150px] flex-1">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular">{value}</div>
      {sub && (
        <div
          className={clsx(
            'mt-1 text-sm tabular',
            accent === 'up' && 'text-up',
            accent === 'down' && 'text-down',
            accent === 'none' && 'text-slate-400',
          )}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded bg-[var(--color-surface-2)]', className)} />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="text-center">
      <div className="text-down font-medium">⚠ {message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-[var(--color-surface-2)] px-4 py-2 text-sm hover:bg-[var(--color-border)]"
        >
          Retry
        </button>
      )}
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="py-10 text-center">
      <div className="text-slate-300 font-medium">{title}</div>
      {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
    </Card>
  );
}
