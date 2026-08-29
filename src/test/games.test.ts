import { describe, it, expect } from 'vitest';
import { searchGamesRAWG, fetchTrendingGames } from '../lib/games';

describe('RAWG Video Games Client', () => {
  it('returns trending co-op and solo games', () => {
    const games = fetchTrendingGames();
    expect(games.length).toBeGreaterThanOrEqual(4);
    
    const itTakesTwo = games.find((g) => g.name === 'It Takes Two');
    expect(itTakesTwo).toBeDefined();
    expect(itTakesTwo?.isCoop).toBe(true);
    expect(itTakesTwo?.platforms).toContain('Nintendo Switch');
  });

  it('searches games correctly in offline fallback mode', async () => {
    const results = await searchGamesRAWG('elden');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Elden Ring');
    expect(results[0].genres).toContain('Action RPG');
  });
});
