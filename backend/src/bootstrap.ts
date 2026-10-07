import dns from 'node:dns';
import net from 'node:net';

/**
 * Must run before ANY network module is evaluated.
 *
 * Many dev machines advertise IPv6 but cannot actually route it, which makes
 * Node's fetch (undici) fail with "fetch failed" while curl works fine (curl
 * falls back to IPv4). Node's default Happy-Eyeballs (autoSelectFamily) still
 * tries IPv6 and can hang, so we:
 *   1. prefer IPv4 addresses, and
 *   2. disable auto family selection so that preference is honored.
 */
try {
  dns.setDefaultResultOrder('ipv4first');
  if (typeof (net as unknown as { setDefaultAutoSelectFamily?: unknown }).setDefaultAutoSelectFamily === 'function') {
    (net as unknown as { setDefaultAutoSelectFamily: (v: boolean) => void }).setDefaultAutoSelectFamily(false);
  }
} catch {
  /* older Node — ignore */
}
