/**
 * 🛋️ Couch Co-Op Lite - Google Apps Script Webhook & Sheet Sync
 * 
 * Supports Movies, TV Series, Video Games, Books, and Shared vs. Solo Audience Tracking.
 */

const SHEET_NAME = 'Library';

const HEADERS = [
  'id',
  'tmdbId',
  'type',
  'title',
  'year',
  'audience',
  'creator',
  'platforms',
  'length',
  'posterUrl',
  'backdropUrl',
  'overview',
  'genres',
  'status',
  'priority',
  'addedBy',
  'partner1Interest',
  'partner2Interest',
  'partner1Rating',
  'partner2Rating',
  'notes',
  'createdAt',
  'updatedAt'
];

function doGet(e) {
  const sheet = getOrCreateSheet();
  const data = getWatchlistData(sheet);
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const rawContent = e.postData ? e.postData.contents : '{}';
    const payload = JSON.parse(rawContent);
    const sheet = getOrCreateSheet();

    if (payload.action === 'add') {
      appendEntry(sheet, payload.entry);
    } else if (payload.action === 'update') {
      updateEntry(sheet, payload.entry);
    } else if (payload.action === 'delete') {
      deleteEntry(sheet, payload.entry.id);
    } else if (payload.action === 'bulkSync' && Array.isArray(payload.items)) {
      bulkSync(sheet, payload.items);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheetByName('Watchlist');

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getWatchlistData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  
  return values.map(function(row) {
    return {
      id: String(row[0] || ''),
      tmdbId: row[1] ? Number(row[1]) : undefined,
      type: String(row[2] || 'movie'),
      title: String(row[3] || ''),
      year: String(row[4] || ''),
      audience: String(row[5] || 'together'),
      creator: String(row[6] || ''),
      platforms: row[7] ? String(row[7]).split(',').map(function(s) { return s.trim(); }) : [],
      length: String(row[8] || ''),
      posterUrl: String(row[9] || ''),
      backdropUrl: String(row[10] || ''),
      overview: String(row[11] || ''),
      genres: row[12] ? String(row[12]).split(',').map(function(s) { return s.trim(); }) : [],
      status: String(row[13] || 'watchlist'),
      priority: String(row[14] || 'high'),
      addedBy: String(row[15] || ''),
      partner1Interest: row[16] || null,
      partner2Interest: row[17] || null,
      partner1Rating: row[18] !== '' && row[18] !== null ? Number(row[18]) : null,
      partner2Rating: row[19] !== '' && row[19] !== null ? Number(row[19]) : null,
      notes: String(row[20] || ''),
      createdAt: String(row[21] || new Date().toISOString()),
      updatedAt: String(row[22] || new Date().toISOString()),
    };
  });
}

function appendEntry(sheet, entry) {
  const row = [
    entry.id,
    entry.tmdbId || '',
    entry.type || 'movie',
    entry.title,
    entry.year || '',
    entry.audience || 'together',
    entry.creator || '',
    Array.isArray(entry.platforms) ? entry.platforms.join(', ') : '',
    entry.length || '',
    entry.posterUrl || '',
    entry.backdropUrl || '',
    entry.overview || '',
    Array.isArray(entry.genres) ? entry.genres.join(', ') : '',
    entry.status || 'watchlist',
    entry.priority || 'high',
    entry.addedBy || '',
    entry.partner1Interest || '',
    entry.partner2Interest || '',
    entry.partner1Rating ?? '',
    entry.partner2Rating ?? '',
    entry.notes || '',
    entry.createdAt || new Date().toISOString(),
    entry.updatedAt || new Date().toISOString()
  ];
  sheet.appendRow(row);
}

function updateEntry(sheet, entry) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    appendEntry(sheet, entry);
    return;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(entry.id)) {
      const rowIndex = i + 2;
      const row = [
        entry.id,
        entry.tmdbId || '',
        entry.type || 'movie',
        entry.title,
        entry.year || '',
        entry.audience || 'together',
        entry.creator || '',
        Array.isArray(entry.platforms) ? entry.platforms.join(', ') : '',
        entry.length || '',
        entry.posterUrl || '',
        entry.backdropUrl || '',
        entry.overview || '',
        Array.isArray(entry.genres) ? entry.genres.join(', ') : '',
        entry.status || 'watchlist',
        entry.priority || 'high',
        entry.addedBy || '',
        entry.partner1Interest || '',
        entry.partner2Interest || '',
        entry.partner1Rating ?? '',
        entry.partner2Rating ?? '',
        entry.notes || '',
        entry.createdAt,
        new Date().toISOString()
      ];
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
      return;
    }
  }

  appendEntry(sheet, entry);
}

function deleteEntry(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function bulkSync(sheet, items) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }

  if (items.length === 0) return;

  const rows = items.map(function(entry) {
    return [
      entry.id,
      entry.tmdbId || '',
      entry.type || 'movie',
      entry.title,
      entry.year || '',
      entry.audience || 'together',
      entry.creator || '',
      Array.isArray(entry.platforms) ? entry.platforms.join(', ') : '',
      entry.length || '',
      entry.posterUrl || '',
      entry.backdropUrl || '',
      entry.overview || '',
      Array.isArray(entry.genres) ? entry.genres.join(', ') : '',
      entry.status || 'watchlist',
      entry.priority || 'high',
      entry.addedBy || '',
      entry.partner1Interest || '',
      entry.partner2Interest || '',
      entry.partner1Rating ?? '',
      entry.partner2Rating ?? '',
      entry.notes || '',
      entry.createdAt || new Date().toISOString(),
      entry.updatedAt || new Date().toISOString()
    ];
  });

  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛋️ Couch Co-Op')
    .addItem('📊 Format Library Sheet', 'getOrCreateSheet')
    .addToUi();
}
