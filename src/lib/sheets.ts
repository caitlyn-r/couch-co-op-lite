import { WatchlistEntry } from '../types';

export interface SyncStatus {
  lastSyncedAt: string | null;
  inProgress: boolean;
  error: string | null;
}

/**
 * Fetch all watchlist entries from the connected Google Sheet
 */
export async function fetchWatchlistFromSheets(syncUrl: string): Promise<WatchlistEntry[]> {
  if (!syncUrl || !syncUrl.trim()) return [];

  const url = `${syncUrl.trim()}${syncUrl.includes('?') ? '&' : '?'}action=getWatchlist&_t=${Date.now()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (err: any) {
    console.error('Failed to fetch from Google Sheets:', err);
    throw err;
  }
}

/**
 * Send an entry update/creation to Google Sheets Webhook
 */
export async function syncEntryToSheets(
  syncUrl: string,
  entry: WatchlistEntry,
  action: 'add' | 'update' | 'delete'
): Promise<boolean> {
  if (!syncUrl || !syncUrl.trim()) return false;

  try {
    // Send as text/plain with JSON body to avoid complex CORS preflights with Google Apps Script
    const payload = JSON.stringify({
      action,
      entry,
      timestamp: new Date().toISOString(),
    });

    await fetch(syncUrl.trim(), {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script redirects 302
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });

    return true;
  } catch (err) {
    console.error('Failed to sync entry to Google Sheets:', err);
    return false;
  }
}

/**
 * Bulk sync the full local watchlist to Google Sheets
 */
export async function bulkSyncToSheets(syncUrl: string, entries: WatchlistEntry[]): Promise<boolean> {
  if (!syncUrl || !syncUrl.trim()) return false;

  try {
    const payload = JSON.stringify({
      action: 'bulkSync',
      items: entries,
      timestamp: new Date().toISOString(),
    });

    await fetch(syncUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });

    return true;
  } catch (err) {
    console.error('Failed to bulk sync to Google Sheets:', err);
    return false;
  }
}
