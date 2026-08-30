import React from 'react';
import { Film, CheckCircle2, Sparkles, Dices, Settings as SettingsIcon, Plus, Cloud, HardDrive, RefreshCw, Users, User, Gamepad2, BookOpen } from 'lucide-react';
import { UserSettings, AudienceType } from '../types';

interface NavbarProps {
  activeTab: 'watchlist' | 'watched' | 'matchmaker' | 'roulette';
  setActiveTab: (tab: 'watchlist' | 'watched' | 'matchmaker' | 'roulette') => void;
  selectedAudience: AudienceType | 'all';
  setSelectedAudience: (aud: AudienceType | 'all') => void;
  watchlistCount: number;
  watchedCount: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  settings: UserSettings;
  isSyncing: boolean;
  onManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedAudience,
  setSelectedAudience,
  watchlistCount,
  watchedCount,
  onOpenSearch,
  onOpenSettings,
  settings,
  isSyncing,
  onManualSync,
}) => {
  const isCloudConnected = Boolean(settings.sheetsSyncUrl);
  const p1 = settings.partner1Name || 'P1';
  const p2 = settings.partner2Name || 'P2';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('watchlist')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-1 ring-white/20">
              <span className="text-2xl">🛋️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Couch Co-Op
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  Lite
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {p1} & {p2}'s Shared & Solo Hub
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-surface/80 rounded-xl border border-surface-border">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'watchlist'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Backlog</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === 'watchlist' ? 'bg-primary-700 text-white' : 'bg-surface-border text-slate-300'}`}>
                {watchlistCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('watched')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'watched'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === 'watched' ? 'bg-primary-700 text-white' : 'bg-surface-border text-slate-300'}`}>
                {watchedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matchmaker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'matchmaker'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-surface-light'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span>AI Matchmaker</span>
            </button>

            <button
              onClick={() => setActiveTab('roulette')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'roulette'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-600/30 font-semibold'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-surface-light'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Vibe Roulette</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Sync indicator */}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title={isCloudConnected ? 'Synced with Google Sheet' : 'Using Local Storage'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCloudConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 border-surface-border hover:bg-slate-700/80'
              }`}
            >
              {isCloudConnected ? (
                <>
                  <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Google Sheet</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Local</span>
                </>
              )}
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
            </button>

            {/* Add Title Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-semibold shadow-lg shadow-primary-600/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Add Media</span>
            </button>

            {/* Settings Gear */}
            <button
              onClick={onOpenSettings}
              className="p-2 sm:p-2.5 rounded-xl bg-surface-light/80 hover:bg-surface-border text-slate-300 hover:text-white border border-surface-border transition-all"
              title="Settings & Add-ons"
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>

        {/* Audience Sub-Navigation Filter Bar */}
        {(activeTab === 'watchlist' || activeTab === 'watched') && (
          <div className="flex items-center justify-between pb-3 pt-1 border-t border-surface-border/40 gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Viewing:
              </span>

              <button
                onClick={() => setSelectedAudience('together')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedAudience === 'together'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Together (Co-Op)</span>
              </button>

              <button
                onClick={() => setSelectedAudience('partner1')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedAudience === 'partner1'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                <User className="w-3.5 h-3.5 text-pink-300" />
                <span>{p1}'s Solo</span>
              </button>

              <button
                onClick={() => setSelectedAudience('partner2')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedAudience === 'partner2'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-300" />
                <span>{p2}'s Solo</span>
              </button>

              <button
                onClick={() => setSelectedAudience('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedAudience === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-surface-light text-slate-400 hover:text-white border border-surface-border'
                }`}
              >
                All Combined
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-surface-border px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all relative ${
            activeTab === 'watchlist'
              ? 'text-primary-400 bg-primary-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Film className="w-5 h-5" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                {watchlistCount}
              </span>
            )}
          </div>
          <span>Backlog</span>
        </button>

        <button
          onClick={() => setActiveTab('watched')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all relative ${
            activeTab === 'watched'
              ? 'text-primary-400 bg-primary-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <CheckCircle2 className="w-5 h-5" />
            {watchedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                {watchedCount}
              </span>
            )}
          </div>
          <span>Completed</span>
        </button>

        <button
          onClick={() => setActiveTab('matchmaker')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all ${
            activeTab === 'matchmaker'
              ? 'text-purple-300 bg-purple-500/20'
              : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'matchmaker' ? 'text-yellow-400 animate-pulse' : 'text-purple-400'}`} />
          <span>AI Match</span>
        </button>

        <button
          onClick={() => setActiveTab('roulette')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all ${
            activeTab === 'roulette'
              ? 'text-amber-300 bg-amber-500/20'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <Dices className={`w-5 h-5 ${activeTab === 'roulette' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Roulette</span>
        </button>
      </nav>
    </header>
  );
};
