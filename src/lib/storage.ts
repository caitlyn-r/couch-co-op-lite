import { WatchlistEntry, UserSettings } from '../types';

const STORAGE_KEYS = {
  WATCHLIST: 'couch_coop_watchlist',
  SETTINGS: 'couch_coop_settings',
};

export const DEFAULT_SETTINGS: UserSettings = {
  partner1Name: 'Player 1',
  partner2Name: 'Player 2',
  geminiApiKey: '',
  tmdbApiKey: '',
  rawgApiKey: '',
  sheetsSyncUrl: '',
  autoSync: true,
  enabledMedia: {
    movies: true,
    games: true,
    books: true,
  },
};

export const SAMPLE_WATCHLIST: WatchlistEntry[] = [
  {
    id: 'sample-1',
    tmdbId: 346698,
    title: 'Barbie',
    type: 'movie',
    year: '2023',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/ctMserH8g2SeOAnCw5gFjdQF8eo.jpg',
    overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.',
    genres: ['Comedy', 'Adventure', 'Fantasy'],
    status: 'watched',
    priority: 'high',
    audience: 'together',
    addedBy: 'Player 1',
    partner1Rating: 9,
    partner2Rating: 8,
    partner1Interest: 'hyped',
    partner2Interest: 'interested',
    notes: 'Incredible set design and funny songs!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    tmdbId: 94605,
    title: 'Severance',
    type: 'tv',
    year: '2022',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pPHqWf5pvgt5q7cZzTqP4qL2t0Z.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9faGSFi5jam6pAOpncVCv07DMR9.jpg',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    genres: ['Drama', 'Mystery', 'Sci-Fi'],
    status: 'watching',
    priority: 'high',
    audience: 'together',
    addedBy: 'Player 2',
    partner1Rating: 9,
    partner2Rating: 10,
    partner1Interest: 'hyped',
    partner2Interest: 'hyped',
    notes: 'Currently on episode 5! Do not watch without both of us present.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    tmdbId: 91363,
    title: 'Bridgerton',
    type: 'tv',
    year: '2020',
    posterUrl: 'https://image.tmdb.org/t/p/w500/luoKQM5wAS1rCDBfnG1w5MmYEV8.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/mZjZgYDCi2VN0r74H376aQxG5.jpg',
    overview: 'Wealth, lust, and betrayal set against the backdrop of Regency-era England, seen through the eyes of the powerful Bridgerton family.',
    genres: ['Drama', 'Romance', 'Period'],
    status: 'watching',
    priority: 'medium',
    audience: 'partner1',
    addedBy: 'Player 1',
    partner1Rating: 9,
    partner2Rating: null,
    partner1Interest: 'hyped',
    partner2Interest: 'pass',
    notes: 'Solo watch when Player 2 is working late.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    title: 'It Takes Two',
    type: 'game',
    year: '2021',
    posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=60',
    overview: 'Embark on the craziest journey of your lives in It Takes Two, a genre-bending platform adventure created purely for co-op.',
    genres: ['Platformer', 'Adventure', 'Co-op'],
    status: 'watching',
    priority: 'high',
    audience: 'together',
    addedBy: 'Player 2',
    creator: 'Hazelight Studios',
    platforms: ['Switch', 'PS5', 'PC'],
    length: '14 hours',
    partner1Rating: 10,
    partner2Rating: 9,
    partner1Interest: 'hyped',
    partner2Interest: 'hyped',
    notes: 'The best 2-player co-op game ever made.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    title: 'Elden Ring',
    type: 'game',
    year: '2022',
    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=60',
    overview: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
    genres: ['Action RPG', 'Dark Fantasy'],
    status: 'watching',
    priority: 'high',
    audience: 'partner2',
    addedBy: 'Player 2',
    creator: 'FromSoftware',
    platforms: ['PS5', 'PC'],
    length: '60+ hours',
    partner1Rating: null,
    partner2Rating: 10,
    partner1Interest: 'pass',
    partner2Interest: 'hyped',
    notes: 'Too stressful for Player 1, Player 2 is conquering bosses solo.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-6',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    type: 'book',
    year: '2022',
    posterUrl: 'https://covers.openlibrary.org/b/id/12843003-L.jpg',
    overview: 'A dazzling story of two friends who come together as creative partners in the world of video game design.',
    genres: ['Fiction', 'Friendship', 'Romance'],
    status: 'watchlist',
    priority: 'high',
    audience: 'together',
    addedBy: 'Player 1',
    creator: 'Gabrielle Zevin',
    length: '416 pages',
    partner1Rating: null,
    partner2Rating: null,
    partner1Interest: 'hyped',
    partner2Interest: 'interested',
    notes: 'Starting our 2-person book club next month!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-7',
    title: 'Twilight',
    type: 'book',
    year: '2005',
    posterUrl: 'https://covers.openlibrary.org/b/id/8235431-L.jpg',
    overview: 'Isabella Swan moves to gloomy Forks, Washington and finds herself drawn to the brooding, mysterious Edward Cullen.',
    genres: ['Fantasy', 'Young Adult', 'Romance'],
    status: 'watched',
    priority: 'low',
    audience: 'partner1',
    addedBy: 'Player 1',
    creator: 'Stephenie Meyer',
    length: '498 pages',
    partner1Rating: 8,
    partner2Rating: null,
    partner1Interest: 'hyped',
    partner2Interest: 'pass',
    notes: 'Nostalgic autumn reread.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export function loadLocalWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (!raw) {
      saveLocalWatchlist(SAMPLE_WATCHLIST);
      return SAMPLE_WATCHLIST;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load watchlist from localStorage:', err);
    return SAMPLE_WATCHLIST;
  }
}

export function saveLocalWatchlist(entries: WatchlistEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save watchlist to localStorage:', err);
  }
}

export function loadLocalSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      enabledMedia: {
        ...DEFAULT_SETTINGS.enabledMedia,
        ...(parsed.enabledMedia || {}),
      },
    };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function exportWatchlistJSON(entries: WatchlistEntry[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `couch-co-op-library-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Generate a 1-click shareable invite link for Partner 2 to connect instantly
 */
export function generateInviteLink(settings: UserSettings): string {
  const payload = {
    p1: settings.partner1Name,
    p2: settings.partner2Name,
    sync: settings.sheetsSyncUrl,
    gemini: settings.geminiApiKey,
    tmdb: settings.tmdbApiKey,
    rawg: settings.rawgApiKey,
    media: settings.enabledMedia,
  };
  const json = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(json));
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://caitlyn-r.github.io/couch-co-op-lite/';
  return `${baseUrl}#invite=${encoded}`;
}

/**
 * Parse an invite link payload from the window URL hash
 */
export function parseInviteConfig(hash: string): Partial<UserSettings> | null {
  if (!hash || !hash.includes('#invite=')) return null;
  try {
    const raw = hash.split('#invite=')[1];
    if (!raw) return null;
    const json = decodeURIComponent(atob(raw));
    const data = JSON.parse(json);
    return {
      partner1Name: data.p1 || DEFAULT_SETTINGS.partner1Name,
      partner2Name: data.p2 || DEFAULT_SETTINGS.partner2Name,
      sheetsSyncUrl: data.sync || '',
      geminiApiKey: data.gemini || '',
      tmdbApiKey: data.tmdb || '',
      rawgApiKey: data.rawg || '',
      enabledMedia: data.media || DEFAULT_SETTINGS.enabledMedia,
      autoSync: true,
    };
  } catch (err) {
    console.error('Failed to parse invite link:', err);
    return null;
  }
}
