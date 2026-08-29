import { describe, it, expect } from 'vitest';
import { SAMPLE_WATCHLIST, DEFAULT_SETTINGS, generateInviteLink, parseInviteConfig } from '../lib/storage';

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

  it('generates and parses 1-click partner invite links correctly', () => {
    const testSettings = {
      ...DEFAULT_SETTINGS,
      partner1Name: 'Caitlyn',
      partner2Name: 'Alex',
      sheetsSyncUrl: 'https://script.google.com/macros/s/test-id/exec',
      geminiApiKey: 'test-gemini-key',
    };

    const link = generateInviteLink(testSettings);
    expect(link).toContain('#invite=');

    const hash = link.substring(link.indexOf('#'));
    const parsed = parseInviteConfig(hash);

    expect(parsed).not.toBeNull();
    expect(parsed?.partner1Name).toBe('Caitlyn');
    expect(parsed?.partner2Name).toBe('Alex');
    expect(parsed?.sheetsSyncUrl).toBe('https://script.google.com/macros/s/test-id/exec');
    expect(parsed?.geminiApiKey).toBe('test-gemini-key');
  });
});
