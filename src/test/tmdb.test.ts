import { describe, it, expect } from 'vitest';
import { getPosterUrl, getBackdropUrl, GENRE_MAP, searchTMDB } from '../lib/tmdb';

describe('TMDB Client', () => {
  it('generates high-resolution poster URLs from TMDB paths', () => {
    const path = '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg';
    const url = getPosterUrl(path, 'w500');
    expect(url).toBe('https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg');
  });

  it('handles empty poster paths with high quality fallback image', () => {
    const url = getPosterUrl(null);
    expect(url).toContain('unsplash.com');
  });

  it('correctly maps genre IDs to readable genre strings', () => {
    expect(GENRE_MAP[28]).toBe('Action');
    expect(GENRE_MAP[35]).toBe('Comedy');
    expect(GENRE_MAP[878]).toBe('Sci-Fi');
    expect(GENRE_MAP[18]).toBe('Drama');
  });

  it('returns filtered fallback search results when no API key is provided', async () => {
    const results = await searchTMDB('dune', '');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Dune: Part Two');
  });
});
