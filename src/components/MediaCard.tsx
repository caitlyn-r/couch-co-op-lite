import React, { useState } from 'react';
import { Star, Trash2, Edit3, MessageSquare, ChevronDown, ChevronUp, Film, Tv, Gamepad2, BookOpen, Users, User, Flame, ThumbsUp, HelpCircle, Ban } from 'lucide-react';
import { WatchlistEntry, UserSettings, WatchStatus, AudienceType, InterestLevel } from '../types';
import { getPosterUrl } from '../lib/tmdb';

interface MediaCardProps {
  entry: WatchlistEntry;
  settings: UserSettings;
  onUpdateStatus: (id: string, status: WatchStatus) => void;
  onUpdateRatings: (id: string, p1Rating: number | null, p2Rating: number | null) => void;
  onUpdateInterest: (id: string, p1Interest: InterestLevel | null, p2Interest: InterestLevel | null) => void;
  onUpdateAudience: (id: string, audience: AudienceType) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  entry,
  settings,
  onUpdateStatus,
  onUpdateRatings,
  onUpdateInterest,
  onUpdateAudience,
  onUpdateNotes,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(entry.notes || '');

  const p1 = settings.partner1Name || 'P1';
  const p2 = settings.partner2Name || 'P2';

  const avgRating =
    entry.partner1Rating && entry.partner2Rating
      ? ((entry.partner1Rating + entry.partner2Rating) / 2).toFixed(1)
      : entry.partner1Rating
      ? entry.partner1Rating.toFixed(1)
      : entry.partner2Rating
      ? entry.partner2Rating.toFixed(1)
      : null;

  const handleSaveNotes = () => {
    onUpdateNotes(entry.id, tempNotes);
    setIsEditingNotes(false);
  };

  const getMediaIcon = () => {
    switch (entry.type) {
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

  const getMediaLabel = () => {
    switch (entry.type) {
      case 'game':
        return 'Game';
      case 'book':
        return 'Book';
      case 'tv':
        return 'TV Series';
      default:
        return 'Movie';
    }
  };

  const getStatusOptions = () => {
    if (entry.type === 'game') {
      return [
        { value: 'watchlist', label: '🎮 Backlog' },
        { value: 'watching', label: '🕹️ Playing' },
        { value: 'watched', label: '🏆 Completed' },
      ];
    }
    if (entry.type === 'book') {
      return [
        { value: 'watchlist', label: '📚 To Read' },
        { value: 'watching', label: '📖 Reading' },
        { value: 'watched', label: '✨ Finished' },
      ];
    }
    return [
      { value: 'watchlist', label: '🍿 Watchlist' },
      { value: 'watching', label: '👀 Watching' },
      { value: 'watched', label: '✅ Watched' },
    ];
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-slate-500/50 hover:shadow-xl hover:shadow-primary-950/20">
      
      {/* Top Poster Banner */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={getPosterUrl(entry.posterUrl || entry.backdropUrl, 'w500')}
          alt={entry.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          
          {/* Media Format */}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/70 backdrop-blur-md text-white border border-white/10">
            {getMediaIcon()}
            <span>{getMediaLabel()}</span>
          </span>

          {/* Audience Dropdown Selection (Together vs Solo) */}
          <div className="relative inline-flex items-center">
            <select
              value={entry.audience}
              onChange={(e) => onUpdateAudience(entry.id, e.target.value as AudienceType)}
              title="Select Audience (Together or Solo)"
              className={`text-xs font-bold pl-2.5 pr-6 py-1 rounded-lg border backdrop-blur-md cursor-pointer transition-all outline-none appearance-none ${
                entry.audience === 'together'
                  ? 'bg-purple-600/80 text-white border-purple-400/40 hover:bg-purple-600'
                  : entry.audience === 'partner1'
                  ? 'bg-pink-600/80 text-white border-pink-400/40 hover:bg-pink-600'
                  : 'bg-blue-600/80 text-white border-blue-400/40 hover:bg-blue-600'
              }`}
            >
              <option value="together" className="bg-slate-900 text-white">
                🛋️ Together
              </option>
              <option value="partner1" className="bg-slate-900 text-white">
                👤 {p1} Solo
              </option>
              <option value="partner2" className="bg-slate-900 text-white">
                👤 {p2} Solo
              </option>
            </select>
            <ChevronDown className="w-3 h-3 text-white/80 absolute right-1.5 pointer-events-none" />
          </div>
        </div>

        {/* Status Selector on Top Right */}
        <div className="absolute top-3 right-3">
          <select
            value={entry.status}
            onChange={(e) => onUpdateStatus(entry.id, e.target.value as WatchStatus)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md cursor-pointer transition-all outline-none ${
              entry.status === 'watched'
                ? 'bg-emerald-600/90 text-white border-emerald-400/30'
                : entry.status === 'watching'
                ? 'bg-amber-600/90 text-white border-amber-400/30 animate-pulse-slow'
                : 'bg-slate-800/90 text-slate-200 border-white/10 hover:bg-slate-700/90'
            }`}
          >
            {getStatusOptions().map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title Overlay at bottom of poster */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md truncate">
            {entry.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 flex-wrap">
            {entry.creator && (
              <span className="font-semibold text-slate-200 bg-black/50 px-2 py-0.5 rounded-md">
                {entry.type === 'book' ? `By ${entry.creator}` : entry.creator}
              </span>
            )}
            {entry.length && (
              <span className="bg-black/50 px-2 py-0.5 rounded-md text-slate-300">
                {entry.length}
              </span>
            )}
            {entry.platforms && entry.platforms.length > 0 && (
              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium">
                {entry.platforms.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Rating or Eagerness Interest Section */}
        {entry.status === 'watched' ? (
          /* Watched Duo Ratings */
          <div className="bg-surface/90 rounded-xl p-3 border border-surface-border space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>Ratings</span>
              </span>
              {avgRating && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                  Avg: {avgRating} / 10
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-surface-light/80 px-2.5 py-1.5 rounded-lg border border-surface-border">
                <span className="text-xs font-semibold text-slate-300 truncate mr-1">{p1}:</span>
                <select
                  value={entry.partner1Rating ?? ''}
                  onChange={(e) => onUpdateRatings(entry.id, e.target.value ? Number(e.target.value) : null, entry.partner2Rating ?? null)}
                  className="bg-transparent text-xs font-bold text-yellow-400 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-yellow-400 font-semibold">{num} ★</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between bg-surface-light/80 px-2.5 py-1.5 rounded-lg border border-surface-border">
                <span className="text-xs font-semibold text-slate-300 truncate mr-1">{p2}:</span>
                <select
                  value={entry.partner2Rating ?? ''}
                  onChange={(e) => onUpdateRatings(entry.id, entry.partner1Rating ?? null, e.target.value ? Number(e.target.value) : null)}
                  className="bg-transparent text-xs font-bold text-yellow-400 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-yellow-400 font-semibold">{num} ★</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Backlog Interest / Eagerness Meter */
          <div className="bg-surface/90 rounded-xl p-3 border border-surface-border space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Interest & Eagerness</span>
              {entry.audience === 'together' && (entry.partner1Interest === 'pass' || entry.partner2Interest === 'pass') && (
                <button
                  onClick={() => onUpdateAudience(entry.id, entry.partner1Interest === 'pass' ? 'partner2' : 'partner1')}
                  className="text-[10px] text-pink-400 hover:underline font-bold"
                >
                  Move to Solo Queue →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Partner 1 Interest */}
              <div className="flex items-center justify-between bg-surface-light/80 px-2.5 py-1.5 rounded-lg border border-surface-border">
                <span className="text-xs font-semibold text-slate-300 truncate mr-1">{p1}:</span>
                <select
                  value={entry.partner1Interest || ''}
                  onChange={(e) => onUpdateInterest(entry.id, (e.target.value || null) as InterestLevel, entry.partner2Interest || null)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Set...</option>
                  <option value="hyped" className="bg-slate-900 text-orange-400">🔥 Hyped</option>
                  <option value="interested" className="bg-slate-900 text-emerald-400">👍 Down</option>
                  <option value="neutral" className="bg-slate-900 text-slate-400">🤷 Neutral</option>
                  <option value="pass" className="bg-slate-900 text-red-400">👎 Pass</option>
                </select>
              </div>

              {/* Partner 2 Interest */}
              <div className="flex items-center justify-between bg-surface-light/80 px-2.5 py-1.5 rounded-lg border border-surface-border">
                <span className="text-xs font-semibold text-slate-300 truncate mr-1">{p2}:</span>
                <select
                  value={entry.partner2Interest || ''}
                  onChange={(e) => onUpdateInterest(entry.id, entry.partner1Interest || null, (e.target.value || null) as InterestLevel)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Set...</option>
                  <option value="hyped" className="bg-slate-900 text-orange-400">🔥 Hyped</option>
                  <option value="interested" className="bg-slate-900 text-emerald-400">👍 Down</option>
                  <option value="neutral" className="bg-slate-900 text-slate-400">🤷 Neutral</option>
                  <option value="pass" className="bg-slate-900 text-red-400">👎 Pass</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Synopsis & Notes */}
        <div className="space-y-2">
          {entry.overview && (
            <p className={`text-xs text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {entry.overview}
            </p>
          )}

          {entry.notes && !isEditingNotes && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-2 text-xs text-primary-200 flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary-400" />
              <span className="italic">"{entry.notes}"</span>
            </div>
          )}

          {isEditingNotes && (
            <div className="space-y-1.5">
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Notes, book chapters, favorite quotes..."
                className="w-full glass-input text-xs rounded-lg p-2 resize-none h-16"
              />
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setIsEditingNotes(false)} className="px-2 py-1 text-xs text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleSaveNotes} className="px-2.5 py-1 text-xs bg-primary-600 text-white font-medium rounded-md">Save</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-400">Added by <strong className="text-slate-300">{entry.addedBy}</strong></span>

          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditingNotes(!isEditingNotes)} className="p-1.5 rounded-lg hover:bg-surface-light text-slate-400 hover:text-slate-200" title="Edit notes">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-lg hover:bg-surface-light text-slate-400 hover:text-slate-200" title="Expand synopsis">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { if (window.confirm(`Remove "${entry.title}"?`)) onDelete(entry.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
