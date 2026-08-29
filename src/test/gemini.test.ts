import { describe, it, expect } from 'vitest';
import { generateAIRecommendations, pickMovieNightVibe } from '../lib/gemini';
import { DEFAULT_SETTINGS, SAMPLE_WATCHLIST } from '../lib/storage';

describe('Gemini AI Engine', () => {
  it('generates Compromise / Shared recommendations for two partners', async () => {
    const recs = await generateAIRecommendations(SAMPLE_WATCHLIST, DEFAULT_SETTINGS, 'compromise');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].audience).toBe('together');
    expect(recs[0].matchScore).toBeGreaterThanOrEqual(90);
  });

  it('never recommends titles that are already watched or in the backlog', async () => {
    const recs = await generateAIRecommendations(SAMPLE_WATCHLIST, DEFAULT_SETTINGS, 'compromise');
    const existingTitles = new Set(SAMPLE_WATCHLIST.map((w) => w.title.toLowerCase()));

    for (const rec of recs) {
      expect(existingTitles.has(rec.title.toLowerCase())).toBe(false);
    }
  });

  it('generates Solo recommendations for Partner 1 without watched duplicates', async () => {
    const recs = await generateAIRecommendations(SAMPLE_WATCHLIST, DEFAULT_SETTINGS, 'partner1_solo');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].audience).toBe('partner1');

    const existingTitles = new Set(SAMPLE_WATCHLIST.map((w) => w.title.toLowerCase()));
    for (const rec of recs) {
      expect(existingTitles.has(rec.title.toLowerCase())).toBe(false);
    }
  });

  it('generates Solo recommendations for Partner 2 without watched duplicates', async () => {
    const recs = await generateAIRecommendations(SAMPLE_WATCHLIST, DEFAULT_SETTINGS, 'partner2_solo');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].audience).toBe('partner2');

    const existingTitles = new Set(SAMPLE_WATCHLIST.map((w) => w.title.toLowerCase()));
    for (const rec of recs) {
      expect(existingTitles.has(rec.title.toLowerCase())).toBe(false);
    }
  });

  it('picks a winning feature during Vibe Roulette', async () => {
    const pick = await pickMovieNightVibe(SAMPLE_WATCHLIST, 'Quick funny comedy', DEFAULT_SETTINGS, 'movies');
    expect(pick.title).toBeDefined();
    expect(pick.pitch).toBeDefined();
  });
});
