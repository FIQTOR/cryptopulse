import { cached, TTL } from '../cache.js';

/**
 * Crypto news via free RSS feeds — no API key required.
 * Feeds are parsed with a tiny dependency-free XML extractor.
 */
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: number;
  body: string;
}

const FEEDS: Array<{ source: string; url: string }> = [
  { source: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { source: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { source: 'Decrypt', url: 'https://decrypt.co/feed' },
];

/** Decode the handful of HTML entities that show up in RSS text. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // &amp; must be decoded last so `&amp;lt;` becomes `&lt;`, not `<`.
    .replace(/&amp;/g, '&');
}

function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return '';
  const text = m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
  return decodeEntities(text);
}

function extractAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { accept: 'application/rss+xml, application/xml, text/xml, */*' },
  });
  if (!res.ok) throw new Error(`Feed ${source} failed: ${res.status}`);
  const xml = await res.text();
  const items = extractAll(xml, 'item');
  return items.slice(0, 15).map((item, i) => {
    const title = extract(item, 'title');
    const link = extract(item, 'link');
    const pubDate = extract(item, 'pubDate') || extract(item, 'dc:date');
    const desc = extract(item, 'description');
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/i) || item.match(/<enclosure[^>]*url="([^"]+)"/i);
    return {
      id: `${source}-${i}-${link}`,
      title,
      url: link,
      source,
      imageUrl: mediaMatch ? mediaMatch[1] : null,
      publishedAt: pubDate ? new Date(pubDate).getTime() : Date.now(),
      body: desc,
    } satisfies NewsItem;
  });
}

export async function getNews(): Promise<NewsItem[]> {
  return cached('news', TTL.news, async () => {
    const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f.source, f.url)));
    const items = results
      .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);
    items.sort((a, b) => b.publishedAt - a.publishedAt);
    return items.slice(0, 40);
  });
}
