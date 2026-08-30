import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Film, Gamepad2, BookOpen, Plus, Check, Star, Loader2, Users, User, Sparkles, CheckCircle, ListPlus, Wand2 } from 'lucide-react';
import { TMDBSearchResult, GameSearchResult, BookSearchResult, UserSettings, WatchlistEntry, MediaType, AudienceType, WatchStatus } from '../types';
import { searchTMDB, fetchTrendingTMDB, getPosterUrl, GENRE_MAP } from '../lib/tmdb';
import { searchGamesRAWG, fetchTrendingGames } from '../lib/games';
import { searchBooksOpenLibrary, fetchTrendingBooks, getBookCoverUrl } from '../lib/books';
import { toTitleCase, findBestFuzzyMatch, normalizeForSearch } from '../lib/fuzzy';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBulkAddEntries?: (entries: Array<Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  settings: UserSettings;
  existingTitles: Set<string>;
  initialMode?: 'search' | 'bulk';
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  onBulkAddEntries,
  settings,
  existingTitles,
  initialMode = 'search',
}) => {
  const [modalMode, setModalMode] = useState<'search' | 'bulk'>(initialMode);
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [movieFilter, setMovieFilter] = useState<'all' | 'movie' | 'tv'>('all');
  
  // Results
  const [movieResults, setMovieResults] = useState<TMDBSearchResult[]>([]);
  const [gameResults, setGameResults] = useState<GameSearchResult[]>([]);
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Single Search Add settings
  const [targetAudience, setTargetAudience] = useState<AudienceType>('together');
  const [addedBy, setAddedBy] = useState(settings.partner1Name || 'Player 1');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Quick Paste / Bulk Add state
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState<MediaType>('movie');
  const [bulkStatus, setBulkStatus] = useState<WatchStatus>('watched'); // Default to Watched as requested
  const [bulkAudience, setBulkAudience] = useState<AudienceType>('together');
  const [bulkRatingP1, setBulkRatingP1] = useState<number | null>(null);
  const [bulkRatingP2, setBulkRatingP2] = useState<number | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const p1 = settings.partner1Name || 'P1';
  const p2 = settings.partner2Name || 'P2';

  // Parse bulk titles from pasted text
  const parsedBulkTitles = useMemo(() => {
    if (!bulkText.trim()) return [];
    return bulkText
      .split(/[\r\n,]+/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((line) => line.length > 0);
  }, [bulkText]);

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
      setBulkSuccessMsg(null);
    }
  }, [isOpen, activeCategory, settings.tmdbApiKey, settings.partner1Name]);

  // Debounced search with auto-fuzzy matching
  useEffect(() => {
    if (modalMode !== 'search') return;
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
  }, [query, activeCategory, movieFilter, modalMode, settings.tmdbApiKey, settings.rawgApiKey]);

  if (!isOpen) return null;

  const handleAddMovie = (item: TMDBSearchResult) => {
    const isTv = item.media_type === 'tv' || Boolean(item.first_air_date && !item.release_date);
    const rawTitle = item.title || item.name || 'Untitled';
    const title = toTitleCase(rawTitle);
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
      genres: genres.length > 0 ? genres : ['Movie'],
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

    setAddedIds((prev) => new Set([...prev, normalizeForSearch(title)]));
  };

  const handleAddGame = (game: GameSearchResult) => {
    const title = toTitleCase(game.name);
    onAddEntry({
      title,
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

    setAddedIds((prev) => new Set([...prev, normalizeForSearch(title)]));
  };

  const handleAddBook = (book: BookSearchResult) => {
    const title = toTitleCase(book.title);
    const author = book.author_name?.[0] || 'Unknown Author';
    onAddEntry({
      title,
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

    setAddedIds((prev) => new Set([...prev, normalizeForSearch(title)]));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkTitles.length === 0) return;

    setIsProcessingBulk(true);
    const count = parsedBulkTitles.length;

    const entriesToCreate: Array<Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>> = [];

    for (const rawTitle of parsedBulkTitles) {
      // 1. Start with clean Title Case normalization (e.g. "dune: part two" -> "Dune: Part Two")
      let resolvedTitle = toTitleCase(rawTitle);
      let posterUrl = '';
      let backdropUrl = '';
      let year = new Date().getFullYear().toString();
      let overview = `Added to ${bulkStatus} via Quick Paste.`;
      let genres = [bulkCategory === 'game' ? 'Video Game' : bulkCategory === 'book' ? 'Book' : 'Movie'];
      let creator = '';

      // 2. Intelligent fuzzy resolution & metadata enrichment across APIs / fallback databases
      if (bulkCategory === 'movie' || bulkCategory === 'tv') {
        try {
          const res = await searchTMDB(rawTitle, settings.tmdbApiKey);
          if (res && res.length > 0) {
            const best = findBestFuzzyMatch(rawTitle, res, (r) => r.title || r.name || '', 0.45) || { item: res[0], score: 1 };
            resolvedTitle = toTitleCase(best.item.title || best.item.name || resolvedTitle);
            posterUrl = best.item.poster_path ? getPosterUrl(best.item.poster_path, 'w500') : '';
            backdropUrl = best.item.backdrop_path ? getPosterUrl(best.item.backdrop_path, 'original') : '';
            year = (best.item.release_date || best.item.first_air_date || '').substring(0, 4) || year;
            overview = best.item.overview || overview;
            genres = (best.item.genre_ids || []).map((id) => GENRE_MAP[id]).filter(Boolean);
          }
        } catch (e) {}
      } else if (bulkCategory === 'game') {
        try {
          const res = await searchGamesRAWG(rawTitle, settings.rawgApiKey);
          if (res && res.length > 0) {
            const best = findBestFuzzyMatch(rawTitle, res, (g) => g.name, 0.45) || { item: res[0], score: 1 };
            resolvedTitle = toTitleCase(best.item.name || resolvedTitle);
            posterUrl = best.item.background_image || '';
            year = (best.item.released || '').substring(0, 4) || year;
            overview = `${best.item.name}. Metacritic: ${best.item.metacritic || 'N/A'}.`;
            genres = best.item.genres || genres;
          }
        } catch (e) {}
      } else if (bulkCategory === 'book') {
        try {
          const res = await searchBooksOpenLibrary(rawTitle);
          if (res && res.length > 0) {
            const best = findBestFuzzyMatch(rawTitle, res, (b) => b.title, 0.45) || { item: res[0], score: 1 };
            resolvedTitle = toTitleCase(best.item.title || resolvedTitle);
            posterUrl = best.item.cover_i
              ? getBookCoverUrl(best.item.cover_i)
              : best.item.posterUrl || '';
            year = best.item.first_publish_year ? String(best.item.first_publish_year) : year;
            creator = best.item.author_name?.[0] || '';
            overview = best.item.overview || (creator ? `By ${creator}.` : overview);
            genres = best.item.subject?.slice(0, 3) || genres;
          }
        } catch (e) {}
      }

      entriesToCreate.push({
        title: resolvedTitle,
        type: bulkCategory,
        year,
        posterUrl:
          posterUrl ||
          (bulkCategory === 'game'
            ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80'
            : bulkCategory === 'book'
            ? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'),
        backdropUrl: backdropUrl || undefined,
        overview,
        genres: genres.length > 0 ? genres : ['Quick Added'],
        creator: creator || undefined,
        status: bulkStatus,
        priority: 'high',
        audience: bulkAudience,
        addedBy,
        partner1Interest: bulkStatus === 'watched' ? null : 'hyped',
        partner2Interest: bulkStatus === 'watched' ? null : bulkAudience === 'together' ? 'interested' : null,
        partner1Rating: bulkRatingP1,
        partner2Rating: bulkRatingP2,
        notes: 'Added via Quick Paste',
      });
    }

    if (onBulkAddEntries) {
      onBulkAddEntries(entriesToCreate);
    } else {
      for (const item of entriesToCreate) {
        onAddEntry(item);
      }
    }

    setBulkSuccessMsg(`🎉 Successfully added ${count} title${count === 1 ? '' : 's'} with autocorrect & title casing!`);
    setBulkText('');
    setIsProcessingBulk(false);
    
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border space-y-3.5">
          <div className="flex items-center justify-between">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-light rounded-xl border border-surface-border">
              <button
                type="button"
                onClick={() => setModalMode('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalMode === 'search'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search & Add</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('bulk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalMode === 'bulk'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>⚡ Quick Paste (Bulk Add)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Single Search Header Controls */}
          {modalMode === 'search' && (
            <div className="space-y-3 pt-1">
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
                      ? 'Search games (e.g. it takes 2, stardew valley, elden ring)...'
                      : activeCategory === 'book'
                      ? 'Search books & authors (e.g. fourth wing, dune, twilight)...'
                      : 'Search movies & shows (e.g. bridgerton, severence, dune 2)...'
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
                {/* Adding For */}
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
                    <option value={settings.partner1Name || 'Player 1'}>{settings.partner1Name || 'Player 1'}</option>
                    <option value={settings.partner2Name || 'Player 2'}>{settings.partner2Name || 'Player 2'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Single Search Mode */}
        {modalMode === 'search' && (
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
                    const rawTitle = item.title || item.name || 'Untitled';
                    const title = toTitleCase(rawTitle);
                    const isAdded = existingTitles.has(normalizeForSearch(title)) || addedIds.has(normalizeForSearch(title));
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
                    const title = toTitleCase(game.name);
                    const isAdded = existingTitles.has(normalizeForSearch(title)) || addedIds.has(normalizeForSearch(title));
                    return (
                      <div key={game.id} className="flex items-center gap-3.5 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-surface-border">
                        <img src={game.background_image} alt={title} className="w-14 aspect-[16/10] object-cover rounded-lg bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{title}</h4>
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
                    const title = toTitleCase(book.title);
                    const isAdded = existingTitles.has(normalizeForSearch(title)) || addedIds.has(normalizeForSearch(title));
                    const author = book.author_name?.[0] || 'Unknown';
                    return (
                      <div key={book.key} className="flex items-center gap-3.5 p-2.5 rounded-xl bg-surface-light/60 hover:bg-surface-light border border-surface-border">
                        <img src={getBookCoverUrl(book.cover_i)} alt={title} className="w-12 aspect-[2/3] object-cover rounded-lg bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{title}</h4>
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
        )}

        {/* Modal Body: Quick Paste / Bulk Add Mode */}
        {modalMode === 'bulk' && (
          <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Success Banner */}
            {bulkSuccessMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            {/* Auto-correction hint badge */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs">
              <Wand2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Smart Autocorrect & Title Casing:</strong> Type lowercase or with minor typos (e.g. <em>severence</em>, <em>dune 2</em>, <em>harry potter</em>) and titles will automatically format with posters & release years!
              </span>
            </div>

            {/* Quick configuration row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Media Format */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Format</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as MediaType)}
                  className="w-full bg-surface-light text-white text-xs font-semibold px-3 py-2 rounded-xl border border-surface-border outline-none"
                >
                  <option value="movie">🍿 Movies & TV</option>
                  {settings.enabledMedia.games && <option value="game">🎮 Video Games</option>}
                  {settings.enabledMedia.books && <option value="book">📚 Books</option>}
                </select>
              </div>

              {/* Target Status List */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Add to List</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as WatchStatus)}
                  className="w-full bg-surface-light text-white text-xs font-semibold px-3 py-2 rounded-xl border border-surface-border outline-none"
                >
                  <option value="watched">✅ Completed / Watched</option>
                  <option value="watchlist">🍿 Backlog / Watchlist</option>
                  <option value="watching">👀 Currently Watching/Playing</option>
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Audience</label>
                <select
                  value={bulkAudience}
                  onChange={(e) => setBulkAudience(e.target.value as AudienceType)}
                  className="w-full bg-surface-light text-white text-xs font-semibold px-3 py-2 rounded-xl border border-surface-border outline-none"
                >
                  <option value="together">🛋️ Together (Shared)</option>
                  <option value="partner1">👤 {p1} Solo</option>
                  <option value="partner2">👤 {p2} Solo</option>
                </select>
              </div>

            </div>

            {/* Optional Ratings (For Watched batch) */}
            {bulkStatus === 'watched' && (
              <div className="p-3 rounded-xl bg-surface-light/60 border border-surface-border space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>Optional: Assign Batch Ratings (1–10)</span>
                  </span>
                  <span className="text-[11px]">Can also rate individually later</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between bg-surface px-2.5 py-1.5 rounded-lg border border-surface-border">
                    <span className="text-xs font-semibold text-slate-300">{p1}:</span>
                    <select
                      value={bulkRatingP1 ?? ''}
                      onChange={(e) => setBulkRatingP1(e.target.value ? Number(e.target.value) : null)}
                      className="bg-transparent text-xs font-bold text-yellow-400 focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Unrated (-)</option>
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n} className="bg-slate-900 text-yellow-400 font-semibold">{n} ★</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-surface px-2.5 py-1.5 rounded-lg border border-surface-border">
                    <span className="text-xs font-semibold text-slate-300">{p2}:</span>
                    <select
                      value={bulkRatingP2 ?? ''}
                      onChange={(e) => setBulkRatingP2(e.target.value ? Number(e.target.value) : null)}
                      className="bg-transparent text-xs font-bold text-yellow-400 focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Unrated (-)</option>
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n} className="bg-slate-900 text-yellow-400 font-semibold">{n} ★</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Paste or type titles (one per line, bullet points, or comma-separated):
                </label>
                {parsedBulkTitles.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    📋 {parsedBulkTitles.length} title{parsedBulkTitles.length === 1 ? '' : 's'} detected
                  </span>
                )}
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`e.g.\ninception\ndune: part two\nseverance\nthe bear\neverything everywhere all at once`}
                rows={6}
                className="w-full glass-input text-xs sm:text-sm rounded-xl p-3 resize-none font-mono leading-relaxed placeholder:text-slate-500"
              />
            </div>

            {/* Live Detected Preview Chips with Title Casing */}
            {parsedBulkTitles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Preview of formatted titles:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-surface-light/40 border border-surface-border">
                  {parsedBulkTitles.map((title, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg bg-surface-light text-slate-200 border border-surface-border font-medium flex items-center gap-1">
                      <span className="text-indigo-400 font-bold">✓</span>
                      <span>{toTitleCase(title)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={parsedBulkTitles.length === 0 || isProcessingBulk}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {isProcessingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autocorrecting & Adding {parsedBulkTitles.length} Titles...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>
                      Add {parsedBulkTitles.length > 0 ? parsedBulkTitles.length : ''} Title{parsedBulkTitles.length === 1 ? '' : 's'} to {bulkStatus === 'watched' ? 'Watched' : 'Library'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-surface-light border-t border-surface-border text-center text-xs text-slate-400">
          Powered by TMDB, RAWG Video Games, and Open Library • Smart Autocorrect Enabled
        </div>

      </div>
    </div>
  );
};
