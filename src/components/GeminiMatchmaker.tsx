import React, { useState } from 'react';
import { Sparkles, Film, Tv, Gamepad2, BookOpen, Plus, Check, Loader2, HeartHandshake, User, Users, AlertCircle } from 'lucide-react';
import { GeminiRecommendation, WatchlistEntry, UserSettings, AudienceType } from '../types';
import { generateAIRecommendations } from '../lib/gemini';
import { getPosterUrl } from '../lib/tmdb';

interface GeminiMatchmakerProps {
  watchlist: WatchlistEntry[];
  settings: UserSettings;
  onAddEntry: (entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenSettings: () => void;
}

export const GeminiMatchmaker: React.FC<GeminiMatchmakerProps> = ({
  watchlist,
  settings,
  onAddEntry,
  onOpenSettings,
}) => {
  const [mode, setMode] = useState<'compromise' | 'partner1_solo' | 'partner2_solo'>('compromise');
  const [category, setCategory] = useState<'all' | 'movies' | 'games' | 'books'>('all');
  const [recommendations, setRecommendations] = useState<GeminiRecommendation[]>([]);
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());

  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';

  const handleGenerate = async (resetSeen = false) => {
    setIsLoading(true);
    try {
      const currentTitles = recommendations.map((r) => r.title.toLowerCase());
      const nextSeen = resetSeen ? new Set<string>() : new Set([...seenTitles, ...currentTitles]);
      setSeenTitles(nextSeen);

      const recs = await generateAIRecommendations(watchlist, settings, mode, category, nextSeen);
      setRecommendations(recs);
      setHasGenerated(true);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRec = (rec: GeminiRecommendation) => {
    onAddEntry({
      title: rec.title,
      type: rec.type,
      year: rec.year || '',
      posterUrl: rec.posterUrl || '',
      creator: rec.creator,
      platforms: rec.platforms,
      overview: rec.overview || rec.reason,
      genres: rec.genres || ['AI Pick'],
      status: 'watchlist',
      priority: 'high',
      audience: rec.audience || (mode === 'compromise' ? 'together' : mode === 'partner1_solo' ? 'partner1' : 'partner2'),
      addedBy: '✨ Gemini AI',
      partner1Rating: null,
      partner2Rating: null,
      partner1Interest: 'hyped',
      partner2Interest: rec.audience === 'together' ? 'interested' : null,
      notes: `AI Reason: ${rec.reason}`,
    });

    setAddedTitles((prev) => new Set([...prev, rec.title]));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'game':
        return <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'tv':
        return <Tv className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-surface border border-purple-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Shared & Solo AI Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Personalized Picks for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              {mode === 'compromise'
                ? `${p1} & ${p2}'s Shared Sweet Spot`
                : mode === 'partner1_solo'
                ? `${p1}'s Solo Indulgences`
                : `${p2}'s Solo Backlog`}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {mode === 'compromise'
              ? `Gemini analyzes both of your high ratings to bridge your tastes and discover crossover hits you'll both love.`
              : mode === 'partner1_solo'
              ? `Tailored specifically to ${p1}'s personal favorites (period dramas, romance, cozy reads, solo games).`
              : `Tailored specifically to ${p2}'s personal favorites (sci-fi mysteries, complex RPGs, high-concept books).`}
          </p>

          {!settings.geminiApiKey && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                Preview Mode active. Add your free Gemini API key in{' '}
                <button onClick={onOpenSettings} className="underline font-bold hover:text-white">
                  Settings
                </button>{' '}
                to run live custom prompts!
              </span>
            </div>
          )}

          {/* Mode Selector Chips */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1. Choose Recommendation Target:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMode('compromise')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === 'compromise'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400'
                    : 'bg-surface-light text-slate-300 hover:text-white border border-surface-border'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>🤝 The Compromise (Shared Co-Op)</span>
              </button>

              <button
                onClick={() => setMode('partner1_solo')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === 'partner1_solo'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40 border border-pink-400'
                    : 'bg-surface-light text-slate-300 hover:text-white border border-surface-border'
                }`}
              >
                <User className="w-4 h-4 text-pink-300" />
                <span>👤 Just For {p1}</span>
              </button>

              <button
                onClick={() => setMode('partner2_solo')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === 'partner2_solo'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-400'
                    : 'bg-surface-light text-slate-300 hover:text-white border border-surface-border'
                }`}
              >
                <User className="w-4 h-4 text-blue-300" />
                <span>👤 Just For {p2}</span>
              </button>
            </div>
          </div>

          {/* Category Selector Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              2. Media Category:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold ${category === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-surface-light text-slate-400 hover:text-white'}`}
              >
                All Media
              </button>
              <button
                onClick={() => setCategory('movies')}
                className={`px-3 py-1.5 rounded-lg font-semibold ${category === 'movies' ? 'bg-red-600 text-white' : 'bg-surface-light text-slate-400 hover:text-white'}`}
              >
                🎬 Movies & TV Only
              </button>
              {settings.enabledMedia.games && (
                <button
                  onClick={() => setCategory('games')}
                  className={`px-3 py-1.5 rounded-lg font-semibold ${category === 'games' ? 'bg-emerald-600 text-white' : 'bg-surface-light text-slate-400 hover:text-white'}`}
                >
                  🎮 Games Only
                </button>
              )}
              {settings.enabledMedia.books && (
                <button
                  onClick={() => setCategory('books')}
                  className={`px-3 py-1.5 rounded-lg font-semibold ${category === 'books' ? 'bg-amber-600 text-white' : 'bg-surface-light text-slate-400 hover:text-white'}`}
                >
                  📚 Books Only
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Curating Recommendations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>{hasGenerated ? 'Generate Fresh Picks' : 'Find Our Next Pick'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>
                {mode === 'compromise'
                  ? '🤝 Top Shared Matches'
                  : mode === 'partner1_solo'
                  ? `👤 Top Solo Picks for ${p1}`
                  : `👤 Top Solo Picks for ${p2}`}
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              {recommendations.length} tailored suggestion{recommendations.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {recommendations.map((rec, idx) => {
              const isAdded = addedTitles.has(rec.title);
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <img
                      src={getPosterUrl(rec.posterUrl, 'w342')}
                      alt={rec.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          rec.type === 'game'
                            ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80'
                            : rec.type === 'book'
                            ? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
                      }}
                      className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl shadow-lg bg-slate-900 flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                          {rec.matchScore}% Match
                        </span>
                        <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
                          {getMediaIcon(rec.type)}
                          <span className="capitalize">{rec.type}</span>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                        {rec.title}
                      </h3>

                      {rec.creator && (
                        <p className="text-xs text-slate-300 font-medium">By {rec.creator}</p>
                      )}

                      {rec.genres && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {rec.genres.slice(0, 3).map((g) => (
                            <span key={g} className="text-[10px] text-slate-400 bg-surface px-1.5 py-0.5 rounded border border-surface-border">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Reasoning Callout */}
                      <div className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                        <strong className="text-purple-300 font-semibold block mb-0.5">Why this fits:</strong>
                        {rec.reason}
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="pt-2 border-t border-surface-border flex justify-end">
                    {isAdded ? (
                      <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-4 h-4" /> Added to Library
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddRec(rec)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add to {mode === 'compromise' ? 'Shared List' : 'Solo List'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
