import React from 'react';
import { Film, Users, User, Star, Gamepad2, BookOpen } from 'lucide-react';
import { WatchlistEntry, UserSettings } from '../types';

interface StatsBarProps {
  watchlist: WatchlistEntry[];
  settings: UserSettings;
}

export const StatsBar: React.FC<StatsBarProps> = ({ watchlist, settings }) => {
  const p1 = settings.partner1Name || 'P1';
  const p2 = settings.partner2Name || 'P2';

  const togetherCount = watchlist.filter((w) => w.audience === 'together').length;
  const p1SoloCount = watchlist.filter((w) => w.audience === 'partner1').length;
  const p2SoloCount = watchlist.filter((w) => w.audience === 'partner2').length;

  const ratedItems = watchlist.filter((w) => w.partner1Rating && w.partner2Rating);
  const avgDuoScore =
    ratedItems.length > 0
      ? (
          ratedItems.reduce((acc, item) => acc + (item.partner1Rating! + item.partner2Rating!) / 2, 0) /
          ratedItems.length
        ).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      
      <div className="glass-card rounded-xl p-3.5 sm:p-4 border border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Shared (Together)</p>
          <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{togetherCount} items</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-3.5 sm:p-4 border border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">{p1}'s Solo List</p>
          <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{p1SoloCount} items</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-3.5 sm:p-4 border border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">{p2}'s Solo List</p>
          <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{p2SoloCount} items</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-3.5 sm:p-4 border border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 fill-yellow-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Co-Op Match Avg</p>
          <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {avgDuoScore ? `${avgDuoScore} / 10` : '—'}
          </p>
        </div>
      </div>

    </div>
  );
};
