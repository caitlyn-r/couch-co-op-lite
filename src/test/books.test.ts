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

  it('searches books with fallback matching when offline', async () => {
    const results = await searchBooksOpenLibrary('tomorrow');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Tomorrow, and Tomorrow, and Tomorrow');
    expect(results[0].author_name).toContain('Gabrielle Zevin');
  });
});
