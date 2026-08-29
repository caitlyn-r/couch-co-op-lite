import { describe, it, expect } from 'vitest';
import { SAMPLE_WATCHLIST, DEFAULT_SETTINGS } from '../lib/storage';

describe('Storage & Data Models', () => {
  it('contains diverse sample library covering Movies, TV, Games, and Books', () => {
    const types = new Set(SAMPLE_WATCHLIST.map((item) => item.type));
    expect(types.has('movie')).toBe(true);
    expect(types.has('tv')).toBe(true);
    expect(types.has('game')).toBe(true);
    expect(types.has('book')).toBe(true);
  });

  it('differentiates between Together, Partner 1 Solo, and Partner 2 Solo', () => {
    const audiences = new Set(SAMPLE_WATCHLIST.map((item) => item.audience));
    expect(audiences.has('together')).toBe(true);
    expect(audiences.has('partner1')).toBe(true);
    expect(audiences.has('partner2')).toBe(true);
  });

  it('defaults settings to all media enabled', () => {
    expect(DEFAULT_SETTINGS.enabledMedia.movies).toBe(true);
    expect(DEFAULT_SETTINGS.enabledMedia.games).toBe(true);
    expect(DEFAULT_SETTINGS.enabledMedia.books).toBe(true);
  });
});
