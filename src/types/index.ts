export type MediaType = 'movie' | 'tv' | 'game' | 'book';

export type AudienceType = 'together' | 'partner1' | 'partner2';

export type InterestLevel = 'hyped' | 'interested' | 'neutral' | 'pass';

export type WatchStatus = 'watchlist' | 'watching' | 'watched'; // For games: Backlog/Playing/Completed, For books: To Read/Reading/Finished

export type WatchPriority = 'low' | 'medium' | 'high';

export interface WatchlistEntry {
  id: string;
  tmdbId?: number;
  type: MediaType;
  title: string;
  year: string;
  posterUrl: string;
  backdropUrl?: string;
  overview: string;
  genres: string[];
  status: WatchStatus;
  priority: WatchPriority;
  audience: AudienceType;
  addedBy: string;
  creator?: string; // Author (Books) / Studio (Games) / Director (Movies)
  platforms?: string[]; // e.g. ['Nintendo Switch', 'PS5', 'PC'] for games
  length?: string; // '115 min' / '320 pages' / '20 hours'
  partner1Interest?: InterestLevel | null;
  partner2Interest?: InterestLevel | null;
  partner1Rating?: number | null; // 1-10
  partner2Rating?: number | null; // 1-10
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  partner1Name: string;
  partner2Name: string;
  geminiApiKey: string;
  tmdbApiKey: string;
  rawgApiKey?: string;
  sheetsSyncUrl: string;
  autoSync: boolean;
  enabledMedia: {
    movies: boolean;
    games: boolean;
    books: boolean;
  };
}

export interface GeminiRecommendation {
  title: string;
  type: MediaType;
  year?: string;
  genres?: string[];
  creator?: string;
  platforms?: string[];
  reason: string;
  matchScore: number;
  posterUrl?: string;
  overview?: string;
  audience: AudienceType;
}

export interface VibeRouletteResult {
  title: string;
  type: MediaType;
  pitch: string;
  vibe: string;
  matchedFromWatchlist: boolean;
  posterUrl?: string;
  year?: string;
  creator?: string;
  runtime?: string;
  genres?: string[];
  platforms?: string[];
  audience: AudienceType;
}

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview: string;
  genre_ids: number[];
  vote_average: number;
}

export interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  overview?: string;
}

export interface GameSearchResult {
  id: number;
  name: string;
  released?: string;
  background_image?: string;
  rating?: number;
  metacritic?: number;
  platforms?: string[];
  genres?: string[];
  isCoop?: boolean;
}
