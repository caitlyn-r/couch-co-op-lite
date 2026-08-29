import React, { useState } from 'react';
import { X, Save, Key, Cloud, Users, Download, Upload, ExternalLink, RotateCcw, Film, Gamepad2, BookOpen } from 'lucide-react';
import { UserSettings, WatchlistEntry } from '../types';
import { exportWatchlistJSON } from '../lib/storage';
import { bulkSyncToSheets } from '../lib/sheets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  watchlist: WatchlistEntry[];
  onImportWatchlist: (imported: WatchlistEntry[]) => void;
  onResetDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  watchlist,
  onImportWatchlist,
  onResetDemo,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTestingSync, setIsTestingSync] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleTestSync = async () => {
    if (!formData.sheetsSyncUrl) {
      setSyncStatusMsg('⚠️ Please enter a Google Apps Script Webhook URL first.');
      return;
    }

    setIsTestingSync(true);
    setSyncStatusMsg(null);

    try {
      await bulkSyncToSheets(formData.sheetsSyncUrl, watchlist);
      setSyncStatusMsg('✅ Connection successful! Synced with your Google Sheet.');
    } catch (err: any) {
      setSyncStatusMsg(`❌ Failed: ${err.message || 'Check Apps Script Web App permissions (set to Anyone).'}`);
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportWatchlist(parsed);
          alert(`Successfully imported ${parsed.length} titles into your library!`);
          onClose();
        } else {
          alert('Invalid watchlist file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-500/20 text-primary-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">App Settings & Add-ons</h2>
              <p className="text-xs text-slate-400">Zero server secrets — all configuration stays in your browser.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Entertainment Add-ons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Entertainment Add-ons</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Movies & TV */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-light border border-surface-border cursor-pointer hover:border-red-500/50">
                <input
                  type="checkbox"
                  checked={formData.enabledMedia.movies}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enabledMedia: { ...formData.enabledMedia, movies: e.target.checked },
                    })
                  }
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Film className="w-4 h-4 text-red-400" />
                  <span>Movies & TV</span>
                </div>
              </label>

              {/* Video Games */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-light border border-surface-border cursor-pointer hover:border-emerald-500/50">
                <input
                  type="checkbox"
                  checked={formData.enabledMedia.games}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enabledMedia: { ...formData.enabledMedia, games: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Video Games</span>
                </div>
              </label>

              {/* Books */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-light border border-surface-border cursor-pointer hover:border-amber-500/50">
                <input
                  type="checkbox"
                  checked={formData.enabledMedia.books}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enabledMedia: { ...formData.enabledMedia, books: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Books & Club</span>
                </div>
              </label>

            </div>
          </div>

          {/* Partner Profiles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Partner Profiles</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Partner 1 Name</label>
                <input
                  type="text"
                  value={formData.partner1Name}
                  onChange={(e) => setFormData({ ...formData, partner1Name: e.target.value })}
                  placeholder="e.g. Alex"
                  required
                  className="w-full glass-input rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Partner 2 Name</label>
                <input
                  type="text"
                  value={formData.partner2Name}
                  onChange={(e) => setFormData({ ...formData, partner2Name: e.target.value })}
                  placeholder="e.g. Taylor"
                  required
                  className="w-full glass-input rounded-xl p-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Google Gemini Free API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="text-yellow-400">✨</span>
                <span>Google Gemini Free API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
              >
                <span>Get Free Key (ai.google.dev)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full glass-input rounded-xl p-2.5 text-sm font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Powers dual-taste AI recommendations, solo picks, and movie/game/book night roulette.
            </p>
          </div>

          {/* TMDB API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>🎬</span>
                <span>TMDB API Key (or Bearer Token)</span>
              </label>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium"
              >
                <span>Get Free TMDB Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={formData.tmdbApiKey}
              onChange={(e) => setFormData({ ...formData, tmdbApiKey: e.target.value })}
              placeholder="v3 API key or v4 Bearer token"
              className="w-full glass-input rounded-xl p-2.5 text-sm font-mono"
            />
          </div>

          {/* RAWG Video Games Key */}
          {formData.enabledMedia.games && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RAWG Video Games API Key (Optional)</span>
                </label>
                <a
                  href="https://rawg.io/apidocs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <span>Get Free RAWG Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={formData.rawgApiKey || ''}
                onChange={(e) => setFormData({ ...formData, rawgApiKey: e.target.value })}
                placeholder="RAWG API Key"
                className="w-full glass-input rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
          )}

          {/* Google Sheets Sync Webhook */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Webhook Sync URL (Optional)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.sheetsSyncUrl}
                onChange={(e) => setFormData({ ...formData, sheetsSyncUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 glass-input rounded-xl p-2.5 text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleTestSync}
                disabled={isTestingSync}
                className="px-3 py-2 rounded-xl bg-surface-light hover:bg-surface-border text-slate-200 text-xs font-bold border border-surface-border whitespace-nowrap"
              >
                {isTestingSync ? 'Testing...' : 'Test & Sync'}
              </button>
            </div>
            {syncStatusMsg && (
              <p className="text-xs font-medium text-slate-200 p-2 rounded-lg bg-surface-light border border-surface-border">
                {syncStatusMsg}
              </p>
            )}
          </div>

          {/* Data Backup & Reset */}
          <div className="pt-3 border-t border-surface-border space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Data Management & Backup
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => exportWatchlistJSON(watchlist)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light hover:bg-surface-border text-slate-200 text-xs font-semibold border border-surface-border transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light hover:bg-surface-border text-slate-200 text-xs font-semibold border border-surface-border transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset library to default multi-media demo dataset?')) {
                    onResetDemo();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold border border-red-800/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold shadow-lg shadow-primary-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
