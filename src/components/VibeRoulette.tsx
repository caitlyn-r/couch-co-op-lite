import React, { useState } from 'react';
import { Dices, Clock, Play, Check, Flame, Award, Film, Gamepad2, BookOpen, Users, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WatchlistEntry, UserSettings, VibeRouletteResult } from '../types';
import { pickMovieNightVibe } from '../lib/gemini';
import { getPosterUrl } from '../lib/tmdb';

interface VibeRouletteProps {
  watchlist: WatchlistEntry[];
  settings: UserSettings;
  onSetStatus: (id: string, status: 'watching' | 'watched') => void;
  onAddAndWatch: (entry: Omit<WatchlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const PRESETS = {
  movies: [
    { label: 'Quick & Fun (<90 min)', emoji: '⚡', prompt: 'Fast-paced, high-energy comedy or thriller under 90 minutes that gets straight to the point.' },
    { label: 'Mind-Bending Mystery', emoji: '🧠', prompt: 'Clever psychological thriller or puzzle-box mystery with great twists.' },
    { label: 'Laugh-Out-Loud Comedy', emoji: '😂', prompt: 'Hilarious feel-good comedy perfect for unwinding together on the couch.' },
    { label: 'Cozy Sunday Comfort Watch', emoji: '☕', prompt: 'Warm, aesthetic comfort film with lovable characters and great atmosphere.' },
    { label: 'Epic Sci-Fi / Adventure', emoji: '🚀', prompt: 'Immersive worldbuilding adventure with stunning visuals.' },
  ],
  games: [
    { label: 'Chill 2-Player Co-Op', emoji: '🎮', prompt: 'Relaxing, cooperative 2-player game that is fun, collaborative, and low-stress.' },
    { label: 'Chaotic Party Fun', emoji: '🔥', prompt: 'Fast, hilarious multiplayer game filled with friendly competition and loud laughs.' },
    { label: 'Deep Story RPG', emoji: '⚔️', prompt: 'Rich narrative RPG adventure with great character choices and lore.' },
    { label: 'Quick Pick-Up-and-Play', emoji: '🕹️', prompt: 'Arcade or puzzle game that takes 0 seconds to learn and 100% fun.' },
  ],
  books: [
    { label: 'Page-Turner Thriller', emoji: '📖', prompt: 'Gripping, fast-paced mystery thriller you cannot put down.' },
    { label: 'Cozy Fantasy / Romance', emoji: '✨', prompt: 'Charming romantic fantasy with delightful worldbuilding and witty banter.' },
    { label: 'Mind-Expanding Sci-Fi', emoji: '🌌', prompt: 'High-concept science fiction that makes you question reality and the future.' },
    { label: 'Quick Weekend Read (<300 pgs)', emoji: '⚡', prompt: 'Bite-sized, engaging book under 300 pages that you can finish in a weekend.' },
  ],
};

export const VibeRoulette: React.FC<VibeRouletteProps> = ({
  watchlist,
  settings,
  onSetStatus,
  onAddAndWatch,
}) => {
  const [activeCategory, setActiveCategory] = useState<'movies' | 'games' | 'books'>('movies');
  const [selectedPrompt, setSelectedPrompt] = useState(PRESETS.movies[0].prompt);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<VibeRouletteResult | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const activeVibe = customPrompt.trim() || selectedPrompt;
  const currentPresets = PRESETS[activeCategory];

  const handleSpin = async () => {
    setIsSpinning(true);
    setResult(null);
    setHasStarted(false);

    try {
      const pick = await pickMovieNightVibe(watchlist, activeVibe, settings, activeCategory);
      setResult(pick);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#8b5cf6', '#f59e0b', '#10b981'],
      });
    } catch (err) {
      console.error('Error during Vibe Roulette:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleStartTonight = () => {
    if (!result) return;

    const localMatch = watchlist.find((w) => w.title.toLowerCase() === result.title.toLowerCase());
    if (localMatch) {
      onSetStatus(localMatch.id, 'watching');
    } else {
      onAddAndWatch({
        title: result.title,
        type: result.type,
        year: result.year || '2023',
        creator: result.creator,
        platforms: result.platforms,
        length: result.runtime,
        posterUrl: result.posterUrl || '',
        overview: result.pitch,
        genres: result.genres || ['Roulette Pick'],
        status: 'watching',
        priority: 'high',
        audience: result.audience || 'together',
        addedBy: '🎲 Vibe Roulette',
        partner1Interest: 'hyped',
        partner2Interest: 'interested',
        partner1Rating: null,
        partner2Rating: null,
        notes: `Selected for tonight: ${result.pitch}`,
      });
    }

    setHasStarted(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900/50 via-orange-900/40 to-surface border border-amber-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <Dices className="w-3.5 h-3.5" />
            <span>Indecision Breaker</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Can't decide what to enjoy tonight? <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-red-400 bg-clip-text text-transparent">
              Spin the Vibe Roulette
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            Pick a format and tonight's vibe. Gemini will scan your library and pitch the winning feature!
          </p>
        </div>
      </div>

      {/* Format & Mood Selector */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-surface-border space-y-5">
        
        {/* Category format switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Step 1: Choose Media Format
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveCategory('movies'); setSelectedPrompt(PRESETS.movies[0].prompt); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeCategory === 'movies'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>🍿 Movie Night</span>
            </button>

            {settings.enabledMedia.games && (
              <button
                onClick={() => { setActiveCategory('games'); setSelectedPrompt(PRESETS.games[0].prompt); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === 'games'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>🎮 Game Night</span>
              </button>
            )}

            {settings.enabledMedia.books && (
              <button
                onClick={() => { setActiveCategory('books'); setSelectedPrompt(PRESETS.books[0].prompt); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === 'books'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📚 Next Book Pick</span>
              </button>
            )}
          </div>
        </div>

        {/* Preset Vibes */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Step 2: Choose Tonight's Vibe</span>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            {currentPresets.map((preset, idx) => {
              const isSelected = selectedPrompt === preset.prompt && !customPrompt.trim();
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedPrompt(preset.prompt); setCustomPrompt(''); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-600/30 border border-amber-400/40 scale-105'
                      : 'bg-surface-light text-slate-300 hover:text-white border border-surface-border'
                  }`}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Box */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Or type a custom request:</label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Victorian mystery or funny co-op game with puzzle mechanics..."
            className="w-full glass-input rounded-xl p-3 text-sm placeholder:text-slate-500"
          />
        </div>

        {/* Spin Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-primary-600 hover:from-amber-400 hover:to-primary-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-orange-600/40 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Dices className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Rolling The Reels...' : '🎲 Spin Media Roulette!'}</span>
          </button>
        </div>
      </div>

      {/* Winner Showcase */}
      {result && (
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-surface-light via-surface to-surface border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-300">
          
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Tonight's Winning Pick</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative group w-full sm:w-48 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-white/10">
              <img src={getPosterUrl(result.posterUrl, 'w500')} alt={result.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur-sm text-[11px] font-bold text-white uppercase">
                {result.type}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {result.title}
                  </h2>
                  {result.year && <span className="text-sm font-semibold text-slate-400">({result.year})</span>}
                  {result.matchedFromWatchlist && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                      From Your Library
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  {result.creator && <span className="text-slate-200 font-semibold">By {result.creator}</span>}
                  {result.runtime && <span className="flex items-center gap-1">• <Clock className="w-3 h-3" /> {result.runtime}</span>}
                  {result.genres && <span>• {result.genres.join(', ')}</span>}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-amber-100 leading-relaxed font-medium">
                <p className="italic">"{result.pitch}"</p>
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {hasStarted ? (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600/90 text-white font-bold text-sm shadow-lg">
                    <Check className="w-5 h-5" />
                    <span>Marked as "Starting Tonight"! Enjoy 🍿</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartTonight}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start This Tonight!</span>
                  </button>
                )}

                <button onClick={handleSpin} className="px-4 py-3 rounded-xl bg-surface-light hover:bg-surface-border text-slate-300 hover:text-white text-sm font-semibold border border-surface-border transition-colors">
                  Spin Again ↻
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
