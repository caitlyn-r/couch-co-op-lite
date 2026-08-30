import { describe, it, expect } from 'vitest';
import { getBookCoverUrl, searchBooksOpenLibrary } from '../lib/books';

describe('Open Library Books Client', () => {
  it('generates correct Open Library cover URLs', () => {
    const coverId = 12843003;
    const url = getBookCoverUrl(coverId);
    expect(url).toBe('https://covers.openlibrary.org/b/id/12843003-L.jpg');
  });

  it('provides a fallback cover image when cover ID is missing', () => {
    const url = getBookCoverUrl(null);
    expect(url).toContain('unsplash.com');
  });

  it('generates correct Open Library ISBN cover URLs', () => {
    const isbn = '9780062060624';
    const url = getBookCoverUrl(null, isbn);
    expect(url).toBe('https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg');
  });

  it('searches books with fallback matching when offline', async () => {
    const results = await searchBooksOpenLibrary('Tomorrow, and Tomorrow, and Tomorrow');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((b) => b.title.includes('Tomorrow'))).toBe(true);
  });
});
