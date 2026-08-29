import React, { useState, useEffect } from 'react';
import { Search, X, Film, Tv, Gamepad2, BookOpen, Plus, Check, TrendingUp, Star, Loader2, Users, User } from 'lucide-react';
import { TMDBSearchResult, GameSearchResult, BookSearchResult, UserSettings, WatchlistEntry, MediaType, AudienceType } from '../types';
import { searchTMDB, fetchTrendingTMDB, getPosterUrl, GENRE_MAP } from '../lib/tmdb';
import { searchGamesRAWG, fetchTrendingGames } from '../lib/games';
import { searchBooksOpenLibrary, fetchTrendingBooks, getBookCoverUrl } from '../lib/books';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  settings: UserSettings;
  existingTitles: Set<string>;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  settings,
  existingTitles,
}) => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [movieFilter, setMovieFilter] = useState<'all' | 'movie' | 'tv'>('all');
  
  // Results
  const [movieResults, setMovieResults] = useState<TMDBSearchResult[]>([]);
  const [gameResults, setGameResults] = useState<GameSearchResult[]>([]);
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add settings
  const [targetAudience, setTargetAudience] = useState<AudienceType>('together');
  const [addedBy, setAddedBy] = useState(settings.partner1Name || 'Player 1');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const p1 = settings.partner1Name || 'P1';
  const p2 = settings.partner2Name || 'P2';

  // Load trending when modal opens
  useEffect(() => {
    if (isOpen) {
      if (activeCategory === 'movie' || activeCategory === 'tv') {
        fetchTrendingTMDB(settings.tmdbApiKey).then(setMovieResults);
      } else if (activeCategory === 'game') {
        setGameResults(fetchTrendingGames());
      } else if (activeCategory === 'book') {
        setBookResults(fetchTrendingBooks());
      }
      setAddedBy(settings.partner1Name || 'Player 1');
    }
  }, [isOpen, activeCategory, settings.tmdbApiKey, settings.partner1Name]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      if (activeCategory === 'movie' || activeCategory === 'tv') {
        fetchTrendingTMDB(settings.tmdbApiKey).then(setMovieResults);
      } else if (activeCategory === 'game') {
        setGameResults(fetchTrendingGames());
      } else if (activeCategory === 'book') {
        setBookResults(fetchTrendingBooks());
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      if (activeCategory === 'movie' || activeCategory === 'tv') {
        const res = await searchTMDB(query, settings.tmdbApiKey, movieFilter);
        setMovieResults(res);
      } else if (activeCategory === 'game') {
        const res = await searchGamesRAWG(query, settings.rawgApiKey);
        setGameResults(res);
      } else if (activeCategory === 'book') {
        const res = await searchBooksOpenLibrary(query);
        setBookResults(res);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeCategory, movieFilter, settings.tmdbApiKey, settings.rawgApiKey]);

  if (!isOpen) return null;

  const handleAddMovie = (item: TMDBSearchResult) => {
    const isTv = item.media_type === 'tv' || Boolean(item.first_air_date && !item.release_date);
    const title = item.title || item.name || 'Untitled';
    const rawDate = item.release_date || item.first_air_date || '';
    const year = rawDate ? rawDate.substring(0, 4) : '';
    const genres = (item.genre_ids || []).map((id) => GENRE_MAP[id]).filter(Boolean);

    onAddEntry({
      tmdbId: item.id,
      title,
      type: isTv ? 'tv' : 'movie',
      year,
      posterUrl: item.poster_path ? getPosterUrl(item.poster_path, 'w500') : '',
      backdropUrl: item.backdrop_path ? getPosterUrl(item.backdrop_path, 'original') : '',
      overview: item.overview || '',
      genres,
      status: 'watchlist',
      priority: 'high',
      audience: targetAudience,
      addedBy,
      partner1Interest: 'hyped',
      partner2Interest: targetAudience === 'together' ? 'interested' : null,
      partner1Rating: null,
      partner2Rating: null,
      notes: '',
    });

    setAddedIds((prev) => new Set([...prev, title.toLowerCase()]));
  };

  const handleAddGame = (game: GameSearchResult) => {
    onAddEntry({
      title: game.name,
      type: 'game',
      year: game.released ? game.released.substring(0, 4) : '',
      posterUrl: game.background_image || '',
      overview: `${game.name} on ${game.platforms?.slice(0, 3).join(', ')}. Metacritic: ${game.metacritic || 'N/A'}.`,
      genres: game.genres || ['Action', 'Co-op'],
      platforms: game.platforms || ['PC', 'Console'],
      length: '15-20 hours',
      status: 'watchlist',
      priority: 'high',
      audience: targetAudience,
      addedBy,
      partner1Interest: 'hyped',
      partner2Interest: targetAudience === 'together' ? 'interested' : null,
      partner1Rating: null,
      partner2Rating: null,
      notes: '',
    });

    setAddedIds((prev) => new Set([...prev, game.name.toLowerCase()]));
  };

  const handleAddBook = (book: BookSearchResult) => {
    const author = book.author_name?.[0] || 'Unknown Author';
    onAddEntry({
      title: book.title,
      type: 'book',
      year: book.first_publish_year ? String(book.first_publish_year) : '',
      creator: author,
      posterUrl: getBookCoverUrl(book.cover_i),
      overview: book.overview || `By ${author}. ${book.number_of_pages_median ? book.number_of_pages_median + ' pages.' : ''}`,
      genres: book.subject || ['Fiction'],
      length: book.number_of_pages_median ? `${book.number_of_pages_median} pages` : '300 pages',
      status: 'watchlist',
      priority: 'high',
      audience: targetAudience,
      addedBy,
      partner1Interest: 'hyped',
      partner2Interest: targetAudience === 'together' ? 'interested' : null,
      partner1Rating: null,
      partner2Rating: null,
      notes: '',
    });

    setAddedIds((prev) => new Set([...prev, book.title.toLowerCase()]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header with Search Box */}
        <div className="p-4 sm:p-5 border-b border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔍 Add Media to Library</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 border-b border-surface-border/60 pb-2">
            {settings.enabledMedia.movies && (
              <button
                onClick={() => { setActiveCategory('movie'); setQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'movie' || activeCategory === 'tv'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies & TV</span>
              </button>
            )}

            {settings.enabledMedia.games && (
              <button
                onClick={() => { setActiveCategory('game'); setQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'game'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Video Games</span>
              </button>
            )}

            {settings.enabledMedia.books && (
              <button
                onClick={() => { setActiveCategory('book'); setQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'book'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Books (Open Library)</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeCategory === 'game'
                  ? 'Search games (e.g. It Takes Two, Stardew Valley, Elden Ring)...'
                  : activeCategory === 'book'
                  ? 'Search books & authors (e.g. Fourth Wing, Dune, Twilight)...'
                  : 'Search movies & shows (e.g. Bridgerton, Severance, Dune)...'
              }
              autoFocus
              className="w-full glass-input rounded-xl py-3 pl-11 pr-10 text-sm placeholder:text-slate-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Audience & Added By Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-surface-light/80 p-2.5 rounded-xl border border-surface-border">
            
            {/* Adding For (Together vs Solo) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Adding for:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTargetAudience('together')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    targetAudience === 'together'
                      ? 'bg-purple-600 text-white'
                      : 'bg-surface text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" /> Together
                </button>
                <button
                  type="button"
                  onClick={() => setTargetAudience('partner1')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    targetAudience === 'partner1'
                      ? 'bg-pink-600 text-white'
                      : 'bg-surface text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 text-pink-300" /> {p1} Solo
                </button>
                <button
                  type="button"
                  onClick={() => setTargetAudience('partner2')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    targetAudience === 'partner2'
                      ? 'bg-blue-600 text-white'
                      : 'bg-surface text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 text-blue-300" /> {p2} Solo
                </button>
              </div>
            </div>

            {/* Added by */}
            <div className="flex items-center gap-1 text-slate-400">
              <span>By:</span>
              <select
                value={addedBy}
                onChange={(e) => setAddedBy(e.target.value)}
                className="bg-surface text-white font-semibold px-2 py-1 rounded-md border border-surface-border outline-none cursor-pointer"
              >
                <option value={settings.partner1Name}>{settings.partner1Name}</option>
                <option value={settings.partner2Name}>{settings.partner2Name}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-sm">Searching titles...</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              
              {/* Movies & TV Results */}
              {(activeCategory === 'movie' || activeCategory === 'tv') &&
                movieResults.map((item) => {
                  const title = item.title || item.name || 'Untitled';
                  const isAdded = existingTitles.has(title.toLowerCase()) || addedIds.has(title.toLowerCase());
                  return (
                    <div key={item.id} className="flex items-center gap-3.5 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-surface-border">
                      <img src={getPosterUrl(item.poster_path, 'w342')} alt={title} className="w-12 aspect-[2/3] object-cover rounded-lg bg-slate-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}</span>
                          {item.vote_average > 0 && <span className="text-yellow-400 font-semibold flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400" /> {item.vote_average.toFixed(1)}</span>}
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Check className="w-3.5 h-3.5" /> Added</span>
                      ) : (
                        <button onClick={() => handleAddMovie(item)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white"><Plus className="w-3.5 h-3.5" /> Add</button>
                      )}
                    </div>
                  );
                })}

              {/* Video Games Results */}
              {activeCategory === 'game' &&
                gameResults.map((game) => {
                  const isAdded = existingTitles.has(game.name.toLowerCase()) || addedIds.has(game.name.toLowerCase());
                  return (
                    <div key={game.id} className="flex items-center gap-3.5 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-surface-border">
                      <img src={game.background_image} alt={game.name} className="w-14 aspect-[16/10] object-cover rounded-lg bg-slate-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{game.name}</h4>
                          {game.isCoop && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">Co-Op</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {game.platforms && <span>{game.platforms.slice(0, 3).join(', ')}</span>}
                          {game.rating && <span className="text-yellow-400 font-semibold">{game.rating.toFixed(1)} ★</span>}
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Check className="w-3.5 h-3.5" /> Added</span>
                      ) : (
                        <button onClick={() => handleAddGame(game)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"><Plus className="w-3.5 h-3.5" /> Add Game</button>
                      )}
                    </div>
                  );
                })}

              {/* Books Results */}
              {activeCategory === 'book' &&
                bookResults.map((book) => {
                  const isAdded = existingTitles.has(book.title.toLowerCase()) || addedIds.has(book.title.toLowerCase());
                  const author = book.author_name?.[0] || 'Unknown';
                  return (
                    <div key={book.key} className="flex items-center gap-3.5 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-surface-border">
                      <img src={getBookCoverUrl(book.cover_i)} alt={book.title} className="w-12 aspect-[2/3] object-cover rounded-lg bg-slate-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{book.title}</h4>
                        <p className="text-xs text-amber-300 font-medium">By {author}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {book.first_publish_year && <span>{book.first_publish_year}</span>}
                          {book.number_of_pages_median && <span>• {book.number_of_pages_median} pages</span>}
                        </div>
                      </div>
                      {isAdded ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Check className="w-3.5 h-3.5" /> Added</span>
                      ) : (
                        <button onClick={() => handleAddBook(book)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"><Plus className="w-3.5 h-3.5" /> Add Book</button>
                      )}
                    </div>
                  );
                })}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-light border-t border-surface-border text-center text-xs text-slate-400">
          Powered by TMDB, RAWG Video Games, and Open Library
        </div>

      </div>
    </div>
  );
};
