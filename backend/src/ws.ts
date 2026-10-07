import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import { config } from './config.js';

/**
 * Realtime relay with three subscription modes, all from Binance's free
 * public WebSocket (no API key required):
 *
 *   { "symbols": ["btcusdt"] }                  -> ticker (price/change)
 *   { "type": "depth",  "symbol": "btcusdt" }   -> order book (bids/asks)
 *   { "type": "trades", "symbol": "btcusdt" }   -> recent market trades
 */
type ClientMsg = {
  symbols?: string[];
  type?: 'ticker' | 'depth' | 'trades';
  symbol?: string;
};

function sanitize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function attachPriceSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (client) => {
    let tickerUp: WebSocket | null = null;
    let depthUp: WebSocket | null = null;
    let tradesUp: WebSocket | null = null;

    const closeAll = () => {
      tickerUp?.close();
      depthUp?.close();
      tradesUp?.close();
      tickerUp = depthUp = tradesUp = null;
    };

    const subscribeTickers = (symbols: string[]) => {
      tickerUp?.close();
      const streams = symbols.map((s) => `${s}@ticker`).join('/');
      tickerUp = new WebSocket(`${config.binance.ws}?streams=${streams}`);
      tickerUp.on('message', (data) => {
        const parsed = JSON.parse(data.toString()) as {
          data?: { s: string; c: string; P: string; q: string };
        };
        const d = parsed.data;
        if (!d || client.readyState !== WebSocket.OPEN) return;
        client.send(
          JSON.stringify({
            stream: 'ticker',
            symbol: d.s,
            price: Number(d.c),
            changePercent: Number(d.P),
            volume: Number(d.q),
            ts: Date.now(),
          }),
        );
      });
      tickerUp.on('error', () => sendErr(client, 'ticker_upstream_unavailable'));
    };

    const subscribeDepth = (symbol: string) => {
      depthUp?.close();
      // @depth20@100ms gives top 20 levels, refreshed 10x/second.
      depthUp = new WebSocket(`${config.binance.ws}?streams=${symbol}@depth20@100ms`);
      depthUp.on('message', (data) => {
        const parsed = JSON.parse(data.toString()) as {
          data?: { lastUpdateId: number; bids: [string, string][]; asks: [string, string][] };
        };
        const d = parsed.data;
        if (!d || client.readyState !== WebSocket.OPEN) return;
        client.send(
          JSON.stringify({
            stream: 'depth',
            symbol: symbol.toUpperCase(),
            bids: d.bids.map(([p, q]) => [Number(p), Number(q)]),
            asks: d.asks.map(([p, q]) => [Number(p), Number(q)]),
            ts: Date.now(),
          }),
        );
      });
      depthUp.on('error', () => sendErr(client, 'depth_upstream_unavailable'));
    };

    const subscribeTrades = (symbol: string) => {
      tradesUp?.close();
      tradesUp = new WebSocket(`${config.binance.ws}?streams=${symbol}@aggTrade`);
      tradesUp.on('message', (data) => {
        const parsed = JSON.parse(data.toString()) as {
          data?: { p: string; q: string; m: boolean; T: number; a: number };
        };
        const d = parsed.data;
        if (!d || client.readyState !== WebSocket.OPEN) return;
        client.send(
          JSON.stringify({
            stream: 'trade',
            symbol: symbol.toUpperCase(),
            price: Number(d.p),
            qty: Number(d.q),
            // m=true -> buyer is maker -> seller aggressor -> SELL side.
            side: d.m ? 'sell' : 'buy',
            ts: d.T,
            id: d.a,
          }),
        );
      });
      tradesUp.on('error', () => sendErr(client, 'trades_upstream_unavailable'));
    };

    client.on('message', (raw) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(raw.toString()) as ClientMsg;
      } catch {
        return;
      }

      if (msg.type === 'depth' && msg.symbol) {
        subscribeDepth(sanitize(msg.symbol));
        return;
      }
      if (msg.type === 'trades' && msg.symbol) {
        subscribeTrades(sanitize(msg.symbol));
        return;
      }

      // Default: ticker subscription for a list of symbols.
      const symbols = (msg.symbols ?? []).map(sanitize).filter(Boolean).slice(0, 30);
      if (symbols.length) subscribeTickers(symbols);
    });

    client.on('close', closeAll);
    client.on('error', closeAll);
  });

  return wss;
}

function sendErr(client: WebSocket, message: string) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ error: message }));
  }
}
