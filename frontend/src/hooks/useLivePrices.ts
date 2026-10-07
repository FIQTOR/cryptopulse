import { useEffect, useRef, useState } from 'react';
import { liveSocketUrl } from '../lib/api';
import type { LiveTick } from '../lib/types';

/**
 * Subscribes to live ticker updates for the given symbols (Binance format,
 * e.g. "btcusdt"). Returns a map keyed by uppercase symbol.
 */
export function useLivePrices(symbols: string[]) {
  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const key = symbols.join(',');

  useEffect(() => {
    if (!key) return;
    const ws = new WebSocket(liveSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ symbols: symbols.map((s) => `${s}usdt`) }));
    };
    ws.onmessage = (ev) => {
      try {
        const tick = JSON.parse(ev.data) as LiveTick & { error?: string };
        if (tick.error) return;
        setTicks((prev) => ({ ...prev, [tick.symbol.toUpperCase()]: tick }));
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { ticks, connected };
}
