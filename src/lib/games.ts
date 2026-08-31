import { GameSearchResult } from '../types';
import { fuzzySimilarity, sanitizeImageUrl } from './fuzzy';

const FALLBACK_GAMES: GameSearchResult[] = [
  {
    id: 457752,
    name: 'It Takes Two',
    released: '2021-03-26',
    background_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    metacritic: 89,
    platforms: ['PC', 'PlayStation 5', 'Nintendo Switch', 'Xbox Series S/X'],
    genres: ['Platformer', 'Adventure', 'Co-op'],
    isCoop: true,
  },
  {
    id: 22509,
    name: 'Overcooked! 2',
    released: '2018-08-07',
    background_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=60',
    rating: 4.5,
    metacritic: 81,
    platforms: ['Nintendo Switch', 'PC', 'PlayStation 4', 'Xbox One'],
    genres: ['Casual', 'Indie', 'Party Co-op'],
    isCoop: true,
  },
  {
    id: 3498,
    name: 'Baldur’s Gate 3',
    released: '2023-08-03',
    background_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    metacritic: 96,
    platforms: ['PC', 'PlayStation 5', 'Xbox Series S/X'],
    genres: ['RPG', 'Strategy', 'Co-op Story'],
    isCoop: true,
  },
  {
    id: 3272,
    name: 'Stardew Valley',
    released: '2016-02-26',
    background_image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&auto=format&fit=crop&q=60',
    rating: 4.7,
    metacritic: 89,
    platforms: ['Nintendo Switch', 'PC', 'PlayStation 4', 'iOS', 'Android'],
    genres: ['Farming Sim', 'RPG', 'Relaxing Co-op'],
    isCoop: true,
  },
  {
    id: 326243,
    name: 'Elden Ring',
    released: '2022-02-25',
    background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    metacritic: 96,
    platforms: ['PC', 'PlayStation 5', 'Xbox Series S/X'],
    genres: ['Action RPG', 'Open World', 'Dark Fantasy'],
    isCoop: false,
  },
  {
    id: 3439,
    name: 'Animal Crossing: New Horizons',
    released: '2020-03-20',
    background_image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=60',
    rating: 4.6,
    metacritic: 90,
    platforms: ['Nintendo Switch'],
    genres: ['Life Sim', 'Cozy', 'Casual'],
    isCoop: true,
  },
  {
    id: 4200,
    name: 'Portal 2',
    released: '2011-04-18',
    background_image: 'https://images.unsplash.com/photo-1612287233207-68b368735b54?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    metacritic: 95,
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 3', 'Xbox 360'],
    genres: ['Puzzle', 'Sci-Fi', 'Co-op Puzzle'],
    isCoop: true,
  },
  {
    id: 28,
    name: 'Hades',
    released: '2020-09-17',
    background_image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    metacritic: 93,
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series S/X'],
    genres: ['Action Roguelike', 'Mythology', 'Hack and Slash'],
    isCoop: false,
  },
  {
    id: 9767,
    name: 'Hollow Knight',
    released: '2017-02-24',
    background_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    metacritic: 90,
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    genres: ['Metroidvania', 'Platformer', 'Atmospheric'],
    isCoop: false,
  },
  {
    id: 22511,
    name: 'The Legend of Zelda: Tears of the Kingdom',
    released: '2023-05-12',
    background_image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    metacritic: 96,
    platforms: ['Nintendo Switch'],
    genres: ['Action', 'Adventure', 'Open World'],
    isCoop: false,
  }
];

export async function searchGamesRAWG(query: string, apiKey?: string): Promise<GameSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return FALLBACK_GAMES;

  if (!apiKey) {
    const ranked = FALLBACK_GAMES.map((g) => {
      const score = Math.max(
        fuzzySimilarity(trimmed, g.name),
        ...(g.genres || []).map((genre) => fuzzySimilarity(trimmed, genre) * 0.6)
      );
      return { g, score };
    })
      .filter((r) => r.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.g);

    return ranked.length > 0 ? ranked : FALLBACK_GAMES.slice(0, 4);
  }

  try {
    const res = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(trimmed)}&key=${apiKey}&page_size=12`);
    if (!res.ok) throw new Error('RAWG request failed');

    const data = await res.json();
    const results = data.results || [];

    return results.map((game: any) => ({
      id: game.id,
      name: game.name,
      released: game.released,
      background_image: sanitizeImageUrl(
        game.background_image,
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60'
      ),
      rating: game.rating,
      metacritic: game.metacritic,
      platforms: (game.platforms || []).map((p: any) => p.platform?.name).filter(Boolean),
      genres: (game.genres || []).map((g: any) => g.name).filter(Boolean),
      isCoop: (game.tags || []).some((t: any) => t.slug?.includes('co-op') || t.slug?.includes('multiplayer')),
    }));
  } catch (err) {
    console.error('RAWG Search Error:', err);
    return FALLBACK_GAMES.filter((g) =>
      fuzzySimilarity(trimmed, g.name) >= 0.45
    );
  }
}

export function fetchTrendingGames(): GameSearchResult[] {
  return FALLBACK_GAMES;
}
