import { config } from './config.js';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_HEADERS: Record<string, string> = {
  accept: 'application/json',
  'user-agent': 'CryptoPulse/1.0 (+https://github.com)',
};

/**
 * fetch wrapper with timeout, JSON parsing, and error normalization.
 * Auto-attaches the CoinGecko demo key when calling the CoinGecko host.
 */
export async function fetchJson<T>(
  url: string,
  { timeoutMs = 12_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  const headers = { ...DEFAULT_HEADERS };
  const isCoinGecko = url.includes('coingecko.com');
  if (isCoinGecko && config.coingecko.apiKey) {
    headers['x-cg-demo-api-key'] = config.coingecko.apiKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (res.status === 429) {
      throw new ApiError(429, 'Upstream rate limit reached. Try again shortly.');
    }
    if (!res.ok) {
      throw new ApiError(res.status, `Upstream error ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(504, 'Upstream request timed out');
    }
    throw new ApiError(502, `Failed to reach upstream: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
