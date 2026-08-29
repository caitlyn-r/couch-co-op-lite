import { TMDBSearchResult } from '../types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

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

export function getPosterUrl(path?: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function getBackdropUrl(path?: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=1280&auto=format&fit=crop&q=60';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

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
    id: 94605,
    name: 'Severance',
    media_type: 'tv',
    first_air_date: '2022-02-17',
    poster_path: '/pPHqWf5pvgt5q7cZzTqP4qL2t0Z.jpg',
    backdrop_path: '/9faGSFi5jam6pAOpncVCv07DMR9.jpg',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    genre_ids: [18, 9648, 10765],
    vote_average: 8.4,
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
    // Return filtered fallback results with simulated search match
    return FALLBACK_POPULAR_MEDIA.filter((item) => {
      const title = (item.title || item.name || '').toLowerCase();
      const matchesText = title.includes(trimmed.toLowerCase());
      const matchesType = filterType === 'all' || item.media_type === filterType;
      return matchesText && matchesType;
    });
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
