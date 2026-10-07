import { useEffect, useRef, useState } from 'react';
import { liveSocketUrl } from '../lib/api';
import type { OrderBookSnapshot } from '../lib/types';

/**
 * Live order book (bids/asks) for a Binance symbol, e.g. "BTCUSDT".
 * Backed by Binance's free @depth20@100ms stream.
 */
export function useOrderBook(binanceSymbol: string | null, depth = 20) {
  const [book, setBook] = useState<OrderBookSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!binanceSymbol) return;
    const ws = new WebSocket(liveSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'depth', symbol: binanceSymbol }));
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as OrderBookSnapshot & { error?: string };
        if (msg.error) return;
        if (msg.stream === 'depth') {
          setBook({
            ...msg,
            bids: msg.bids.slice(0, depth),
            asks: msg.asks.slice(0, depth),
          });
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
      setBook(null);
    };
  }, [binanceSymbol, depth]);

  return { book, connected };
}
