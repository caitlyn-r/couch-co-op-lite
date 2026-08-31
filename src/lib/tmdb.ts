import { TMDBSearchResult } from '../types';
import { fuzzySimilarity, sanitizeImageUrl } from './fuzzy';

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Fallback search results when no TMDB API key is provided
const FALLBACK_POPULAR_MEDIA: TMDBSearchResult[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    media_type: 'movie',
    release_date: '2024-02-27',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200fr.jpg',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge.',
    genre_ids: [878, 12],
    vote_average: 8.2,
  },
  {
    id: 66732,
    name: 'Stranger Things',
    media_type: 'tv',
    first_air_date: '2016-07-15',
    poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    genre_ids: [18, 10765, 9648],
    vote_average: 8.6,
  },
  {
    id: 27205,
    title: 'Inception',
    media_type: 'movie',
    release_date: '2010-07-15',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    overview: 'Cobb steals information from his targets by entering their dreams. He is given the inverse task of planting an idea.',
    genre_ids: [28, 878, 12],
    vote_average: 8.4,
  },
  {
    id: 157336,
    title: 'Interstellar',
    media_type: 'movie',
    release_date: '2014-11-05',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/rAiYTsqLtkvp92Jw8YkiHaSnMA9.jpg',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass human space travel limitations.',
    genre_ids: [12, 18, 878],
    vote_average: 8.4,
  },
  {
    id: 155,
    title: 'The Dark Knight',
    media_type: 'movie',
    release_date: '2008-07-16',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    genre_ids: [18, 28, 80, 53],
    vote_average: 8.5,
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    media_type: 'movie',
    release_date: '2023-07-19',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
    genre_ids: [18, 36],
    vote_average: 8.1,
  },
  {
    id: 346698,
    title: 'Barbie',
    media_type: 'movie',
    release_date: '2023-07-19',
    poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    backdrop_path: '/nHf61UzkfFno5X1ofIhugCPus2R.jpg',
    overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.',
    genre_ids: [35, 12],
    vote_average: 7.1,
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    media_type: 'movie',
    release_date: '2024-07-24',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yD39589d8zYpT7fOqL7aX0bZl8v.jpg',
    overview: 'A listless Wade Wilson toils in civilian life with his days as the morally flexible mercenary behind him.',
    genre_ids: [28, 35, 878],
    vote_average: 7.7,
  },
  {
    id: 124364,
    name: 'The Bear',
    media_type: 'tv',
    first_air_date: '2022-06-23',
    poster_path: '/sHFlB7hCBT537F7r4f5w5q9sS7m.jpg',
    backdrop_path: '/n79e95BsmG6g6aJ6P7Z1b3M1Y8z.jpg',
    overview: 'A young chef from the fine dining world comes home to Chicago to run his family Italian beef sandwich shop.',
    genre_ids: [18, 35],
    vote_average: 8.3,
  },
  {
    id: 93405,
    name: 'Squid Game',
    media_type: 'tv',
    first_air_date: '2021-09-17',
    poster_path: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    backdrop_path: '/7q448JHab0W1G299bZq31b5lZl8.jpg',
    overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games.',
    genre_ids: [18, 9648, 10759],
    vote_average: 7.8,
  },
  {
    id: 1022789,
    title: 'Inside Out 2',
    media_type: 'movie',
    release_date: '2024-06-11',
    poster_path: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop_path: '/stKGOmPAg6n1jI467vlqg0M13fT.jpg',
    overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for unexpected new Emotions!',
    genre_ids: [16, 10751, 35, 12],
    vote_average: 7.6,
  },
  {
    id: 1399,
    name: 'Game of Thrones',
    media_type: 'tv',
    first_air_date: '2011-04-17',
    poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    overview: 'Seven noble families fight for control of the mythical land of Westeros.',
    genre_ids: [10765, 18, 10759],
    vote_average: 8.4,
  },
  {
    id: 91363,
    name: 'Bridgerton',
    media_type: 'tv',
    first_air_date: '2020-12-25',
    poster_path: '/uXTg565ahu9RwonCX1V2Hex1NU6.jpg',
    backdrop_path: '/6umsRLI7t0ydFwCl0JNEIO0q2LH.jpg',
    overview: 'Wealth, lust, and betrayal set against the backdrop of Regency era England.',
    genre_ids: [18, 10749],
    vote_average: 8.1,
  }
];

export async function searchTMDB(
  query: string,
  apiKey: string,
  filterType: 'all' | 'movie' | 'tv' = 'all'
): Promise<TMDBSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!apiKey) {
    // Return ranked results using fuzzy matching and substring scoring
    const candidates = filterType === 'all'
      ? FALLBACK_POPULAR_MEDIA
      : FALLBACK_POPULAR_MEDIA.filter((item) => item.media_type === filterType);

    const ranked = candidates
      .map((item) => {
        const title = item.title || item.name || '';
        const score = fuzzySimilarity(trimmed, title);
        return { item, score };
      })
      .filter((r) => r.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);

    return ranked.length > 0 ? ranked : candidates.slice(0, 4);
  }

  try {
    const isBearer = apiKey.startsWith('ey') || apiKey.length > 50;
    const url =
      filterType === 'all'
        ? `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(trimmed)}&include_adult=false`
        : `https://api.themoviedb.org/3/search/${filterType}?query=${encodeURIComponent(trimmed)}&include_adult=false`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let fetchUrl = url;
    if (isBearer) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      fetchUrl += `&api_key=${apiKey}`;
    }

    const res = await fetch(fetchUrl, { headers });
    if (!res.ok) {
      throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const results = (data.results || [])
      .filter((item: any) => {
        const type = item.media_type || filterType;
        return type === 'movie' || type === 'tv';
      })
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        name: item.name,
        media_type: item.media_type || filterType,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview || 'No synopsis available.',
        genre_ids: item.genre_ids || [],
        vote_average: item.vote_average || 0,
      }));

    return results;
  } catch (err) {
    console.error('TMDB Search Error:', err);
    return [];
  }
}

export async function fetchTrendingTMDB(apiKey: string): Promise<TMDBSearchResult[]> {
  if (!apiKey) {
    return FALLBACK_POPULAR_MEDIA;
  }

  try {
    const isBearer = apiKey.startsWith('ey') || apiKey.length > 50;
    const url = 'https://api.themoviedb.org/3/trending/all/week';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let fetchUrl = url;
    if (isBearer) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      fetchUrl += `?api_key=${apiKey}`;
    }

    const res = await fetch(fetchUrl, { headers });
    if (!res.ok) throw new Error('Failed to fetch trending');
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        name: item.name,
        media_type: item.media_type,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview || '',
        genre_ids: item.genre_ids || [],
        vote_average: item.vote_average || 0,
      }));
  } catch (err) {
    console.error('TMDB Trending Error:', err);
    return FALLBACK_POPULAR_MEDIA;
  }
}

export function getPosterUrl(path?: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
  }
  if (path.startsWith('http')) return sanitizeImageUrl(path);
  return sanitizeImageUrl(`https://image.tmdb.org/t/p/${size}${path}`);
}

export function getBackdropUrl(path?: string | null, size: 'w780' | 'w1280' | 'original' = 'original'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';
  }
  if (path.startsWith('http')) return sanitizeImageUrl(path);
  return sanitizeImageUrl(`https://image.tmdb.org/t/p/${size}${path}`);
}
