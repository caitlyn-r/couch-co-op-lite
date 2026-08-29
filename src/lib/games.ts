import { GameSearchResult } from '../types';

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
  }
];

export async function searchGamesRAWG(query: string, apiKey?: string): Promise<GameSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return FALLBACK_GAMES;

  if (!apiKey) {
    return FALLBACK_GAMES.filter((g) =>
      g.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      g.genres?.some((genre) => genre.toLowerCase().includes(trimmed.toLowerCase()))
    );
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
      background_image: game.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60',
      rating: game.rating,
      metacritic: game.metacritic,
      platforms: (game.platforms || []).map((p: any) => p.platform?.name).filter(Boolean),
      genres: (game.genres || []).map((g: any) => g.name).filter(Boolean),
      isCoop: (game.tags || []).some((t: any) => t.slug?.includes('co-op') || t.slug?.includes('multiplayer')),
    }));
  } catch (err) {
    console.error('RAWG Search Error:', err);
    return FALLBACK_GAMES.filter((g) =>
      g.name.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}

export function fetchTrendingGames(): GameSearchResult[] {
  return FALLBACK_GAMES;
}
