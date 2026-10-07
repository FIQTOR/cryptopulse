import { useEffect, useRef, useState } from 'react';
import { liveSocketUrl } from '../lib/api';
import type { TradeTick } from '../lib/types';

const MAX_TRADES = 60;

/**
 * Live recent market trades for a Binance symbol, e.g. "BTCUSDT".
 * Backed by Binance's free @aggTrade stream. Newest trade is first.
 */
export function useTrades(binanceSymbol: string | null, limit = MAX_TRADES) {
  const [trades, setTrades] = useState<TradeTick[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!binanceSymbol) return;
    const ws = new WebSocket(liveSocketUrl());
    pausedRef.current = false;
    setPaused(false);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'trades', symbol: binanceSymbol }));
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as TradeTick & { error?: string };
        if (msg.error) return;
        if (msg.stream === 'trade' && !pausedRef.current) {
          setTrades((prev) => [msg, ...prev].slice(0, limit));
        }
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
      setConnected(false);
      setTrades([]);
    };
  }, [binanceSymbol, limit]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  return { trades, connected, paused, togglePause };
}
