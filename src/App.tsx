import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { MediaCard } from './components/MediaCard';
import { SearchModal } from './components/SearchModal';
import { GeminiMatchmaker } from './components/GeminiMatchmaker';
import { VibeRoulette } from './components/VibeRoulette';
import { SettingsModal } from './components/SettingsModal';
import { WatchlistEntry, UserSettings, WatchStatus, AudienceType, InterestLevel, MediaType } from './types';
import {
  loadLocalWatchlist,
  saveLocalWatchlist,
  loadLocalSettings,
  saveLocalSettings,
  SAMPLE_WATCHLIST,
} from './lib/storage';
import { fetchWatchlistFromSheets, syncEntryToSheets, bulkSyncToSheets } from './lib/sheets';
import { Search, Plus, Sparkles, Film, Gamepad2, BookOpen } from 'lucide-react';

export function App() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(loadLocalWatchlist);
  const [settings, setSettings] = useState<UserSettings>(loadLocalSettings);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'matchmaker' | 'roulette'>('watchlist');
  const [selectedAudience, setSelectedAudience] = useState<AudienceType | 'all'>('together');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // In-library search & filters
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title'>('recent');

  // Save changes to localStorage on state change
  useEffect(() => {
    saveLocalWatchlist(watchlist);
  }, [watchlist]);

  useEffect(() => {
    saveLocalSettings(settings);
  }, [settings]);

  // Background sync on mount if Google Sheets URL configured
  useEffect(() => {
    if (settings.sheetsSyncUrl && settings.autoSync) {
      handleManualSync();
    }
  }, [settings.sheetsSyncUrl]);

  const handleManualSync = async () => {
    if (!settings.sheetsSyncUrl) return;
    setIsSyncing(true);
    try {
      const remoteItems = await fetchWatchlistFromSheets(settings.sheetsSyncUrl);
      if (remoteItems && remoteItems.length > 0) {
        setWatchlist(remoteItems);
      } else {
        await bulkSyncToSheets(settings.sheetsSyncUrl, watchlist);
      }
    } catch (err) {
      console.warn('Sync failed, using local storage:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add new entry
  const handleAddEntry = (entryData: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: WatchlistEntry = {
      ...entryData,
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWatchlist((prev) => [newEntry, ...prev]);

    if (settings.sheetsSyncUrl) {
      syncEntryToSheets(settings.sheetsSyncUrl, newEntry, 'add');
    }
  };

  // Update status (watchlist, watching, watched)
  const handleUpdateStatus = (id: string, newStatus: WatchStatus) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, status: newStatus, updatedAt: new Date().toISOString() };
          if (settings.sheetsSyncUrl) syncEntryToSheets(settings.sheetsSyncUrl, updated, 'update');
          return updated;
        }
        return item;
      })
    );
  };

  // Update ratings
  const handleUpdateRatings = (id: string, p1Rating: number | null, p2Rating: number | null) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            partner1Rating: p1Rating,
            partner2Rating: p2Rating,
            updatedAt: new Date().toISOString(),
          };
          if (settings.sheetsSyncUrl) syncEntryToSheets(settings.sheetsSyncUrl, updated, 'update');
          return updated;
        }
        return item;
      })
    );
  };

  // Update interest level
  const handleUpdateInterest = (id: string, p1Interest: InterestLevel | null, p2Interest: InterestLevel | null) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            partner1Interest: p1Interest,
            partner2Interest: p2Interest,
            updatedAt: new Date().toISOString(),
          };
          if (settings.sheetsSyncUrl) syncEntryToSheets(settings.sheetsSyncUrl, updated, 'update');
          return updated;
        }
        return item;
      })
    );
  };

  // Update audience (Together ↔ Partner 1 Solo ↔ Partner 2 Solo)
  const handleUpdateAudience = (id: string, audience: AudienceType) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            audience,
            updatedAt: new Date().toISOString(),
          };
          if (settings.sheetsSyncUrl) syncEntryToSheets(settings.sheetsSyncUrl, updated, 'update');
          return updated;
        }
        return item;
      })
    );
  };

  // Update notes
  const handleUpdateNotes = (id: string, notes: string) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, notes, updatedAt: new Date().toISOString() };
          if (settings.sheetsSyncUrl) syncEntryToSheets(settings.sheetsSyncUrl, updated, 'update');
          return updated;
        }
        return item;
      })
    );
  };

  // Delete entry
  const handleDelete = (id: string) => {
    const target = watchlist.find((w) => w.id === id);
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
    if (target && settings.sheetsSyncUrl) {
      syncEntryToSheets(settings.sheetsSyncUrl, target, 'delete');
    }
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return watchlist
      .filter((item) => {
        // Tab filter (Backlog vs Completed)
        if (activeTab === 'watchlist') {
          if (item.status === 'watched') return false;
        } else if (activeTab === 'watched') {
          if (item.status !== 'watched') return false;
        }

        // Audience filter
        if (selectedAudience !== 'all' && item.audience !== selectedAudience) {
          return false;
        }

        // Search text
        if (filterQuery.trim()) {
          const q = filterQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCreator = (item.creator || '').toLowerCase().includes(q);
          const matchGenre = item.genres.some((g) => g.toLowerCase().includes(q));
          if (!matchTitle && !matchCreator && !matchGenre) return false;
        }

        // Media format filter
        if (filterType !== 'all') {
          if (filterType === 'movie' && item.type !== 'movie' && item.type !== 'tv') return false;
          if (filterType === 'game' && item.type !== 'game') return false;
          if (filterType === 'book' && item.type !== 'book') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          const avgA = (a.partner1Rating || 0) + (a.partner2Rating || 0);
          const avgB = (b.partner1Rating || 0) + (b.partner2Rating || 0);
          return avgB - avgA;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [watchlist, activeTab, selectedAudience, filterQuery, filterType, sortBy]);

  const watchlistCount = watchlist.filter((w) => w.status === 'watchlist' || w.status === 'watching').length;
  const watchedCount = watchlist.filter((w) => w.status === 'watched').length;
  const existingTitles = useMemo(() => new Set(watchlist.map((w) => w.title.toLowerCase())), [watchlist]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      
      {/* Navbar with Audience View Filter */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAudience={selectedAudience}
        setSelectedAudience={setSelectedAudience}
        watchlistCount={watchlistCount}
        watchedCount={watchedCount}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Top Stats Overview */}
        <StatsBar watchlist={watchlist} settings={settings} />

        {/* Tab 1: Backlog & Tab 2: Completed */}
        {(activeTab === 'watchlist' || activeTab === 'watched') && (
          <div className="space-y-6">
            
            {/* Filter & Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-surface-border">
              
              {/* Search in library */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={`Search title, author, studio, or genre...`}
                  className="w-full glass-input text-xs sm:text-sm rounded-xl py-2.5 pl-10 pr-4 placeholder:text-slate-500"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                
                {/* Format Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-surface-light text-slate-200 px-3 py-2 rounded-xl border border-surface-border font-medium outline-none cursor-pointer"
                >
                  <option value="all">All Formats</option>
                  <option value="movie">Movies & TV</option>
                  {settings.enabledMedia.games && <option value="game">Video Games</option>}
                  {settings.enabledMedia.books && <option value="book">Books & Audiobooks</option>}
                </select>

                {/* Sort Order */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-surface-light text-slate-200 px-3 py-2 rounded-xl border border-surface-border font-medium outline-none cursor-pointer"
                >
                  <option value="recent">Recently Added</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title (A-Z)</option>
                </select>

              </div>
            </div>

            {/* Media Cards Grid */}
            {filteredList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredList.map((entry) => (
                  <MediaCard
                    key={entry.id}
                    entry={entry}
                    settings={settings}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRatings={handleUpdateRatings}
                    onUpdateInterest={handleUpdateInterest}
                    onUpdateAudience={handleUpdateAudience}
                    onUpdateNotes={handleUpdateNotes}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16 px-4 rounded-3xl glass-card border border-surface-border space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-surface-light text-slate-400 mx-auto flex items-center justify-center text-3xl">
                  {selectedAudience === 'together' ? '🛋️' : '👤'}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {activeTab === 'watchlist'
                    ? selectedAudience === 'together'
                      ? 'No Shared Media in Backlog'
                      : 'No Solo Items in Queue'
                    : 'No Completed Titles in this View'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Add movies, video games, or books to your backlog, or use Gemini to discover fresh picks!
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Media
                  </button>
                  <button
                    onClick={() => setActiveTab('matchmaker')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> Try AI Match
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 3: AI Matchmaker */}
        {activeTab === 'matchmaker' && (
          <GeminiMatchmaker
            watchlist={watchlist}
            settings={settings}
            onAddEntry={handleAddEntry}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Tab 4: Vibe Roulette */}
        {activeTab === 'roulette' && (
          <VibeRoulette
            watchlist={watchlist}
            settings={settings}
            onSetStatus={handleUpdateStatus}
            onAddAndWatch={handleAddEntry}
          />
        )}

      </main>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddEntry={handleAddEntry}
        settings={settings}
        existingTitles={existingTitles}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        watchlist={watchlist}
        onImportWatchlist={setWatchlist}
        onResetDemo={() => setWatchlist(SAMPLE_WATCHLIST)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border/60 py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <p className="text-slate-300 font-medium">
          🛋️ <strong>Couch Co-Op Lite</strong> • Shared & Solo Entertainment Tracker
        </p>
        <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Video game data provided by RAWG. Book metadata and covers provided by Open Library. AI features powered by Google Gemini API.
        </p>
      </footer>

    </div>
  );
}
export default App;
