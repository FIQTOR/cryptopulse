import { describe, it, expect } from 'vitest';
import { decodeEntities } from './services/news.js';

describe('news decodeEntities', () => {
  it('decodes apostrophes (numeric and named)', () => {
    expect(decodeEntities('Google&#39;s new model')).toBe("Google's new model");
    expect(decodeEntities('Khaled &apos;Team')).toBe("Khaled 'Team");
  });

  it('decodes ampersands, angles and quotes', () => {
    expect(decodeEntities('A &amp; B')).toBe('A & B');
    expect(decodeEntities('&quot;hi&quot;')).toBe('"hi"');
    expect(decodeEntities('&lt;tag&gt;')).toBe('<tag>');
    expect(decodeEntities('a&nbsp;b')).toBe('a b');
  });

  it('decodes hex entities', () => {
    expect(decodeEntities('it&#x27;s')).toBe("it's");
  });

  it('does not double-decode ampersands', () => {
    // &amp;lt; should become &lt;, not <
    expect(decodeEntities('&amp;lt;')).toBe('&lt;');
  });
});
