import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../lib/store';

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('adds the light class and removes dark for light theme', () => {
    applyTheme('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('adds the dark class and removes light for dark theme', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('switches cleanly from light to dark', () => {
    applyTheme('light');
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
