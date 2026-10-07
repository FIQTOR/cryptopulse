/**
 * Map CoinGecko coin IDs to Binance USDT spot symbols.
 * Only coins listed on Binance (USDT pairs) have live order book & trades.
 * Add more pairs here as needed.
 */
export const BINANCE_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT',
  ripple: 'XRPUSDT',
  cardano: 'ADAUSDT',
  dogecoin: 'DOGEUSDT',
  'avalanche-2': 'AVAXUSDT',
  polkadot: 'DOTUSDT',
  chainlink: 'LINKUSDT',
  'matic-network': 'MATICUSDT',
  polygon: 'POLUSDT',
  tron: 'TRXUSDT',
  litecoin: 'LTCUSDT',
  'shiba-inu': 'SHIBUSDT',
  uniswap: 'UNIUSDT',
  cosmos: 'ATOMUSDT',
  stellar: 'XLMUSDT',
  'near-protocol': 'NEARUSDT',
  aptos: 'APTUSDT',
  arbitrum: 'ARBUSDT',
  optimism: 'OPUSDT',
  'the-open-network': 'TONUSDT',
  pepe: 'PEPEUSDT',
  sui: 'SUIUSDT',
  'internet-computer': 'ICPUSDT',
  filecoin: 'FILUSDT',
  'hedera-hashgraph': 'HBARUSDT',
  'injective-protocol': 'INJUSDT',
  algorand: 'ALGOUSDT',
  fantom: 'FTMUSDT',
  'render-token': 'RENDERUSDT',
  sei: 'SEIUSDT',
};

/**
 * Resolve a Binance symbol for a given CoinGecko coin.
 * Falls back to `${symbol}USDT` uppercased when not explicitly mapped,
 * since Binance pairs commonly follow that convention.
 */
export function toBinanceSymbol(coinId: string, coinSymbol?: string): string {
  const mapped = BINANCE_SYMBOLS[coinId];
  if (mapped) return mapped;
  if (coinSymbol) return `${coinSymbol.toUpperCase()}USDT`;
  return `${coinId.toUpperCase()}USDT`;
}
