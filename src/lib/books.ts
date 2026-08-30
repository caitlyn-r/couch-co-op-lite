import { BookSearchResult } from '../types';
import { fuzzySimilarity } from './fuzzy';

export function getBookCoverUrl(coverId?: number | null, isbn?: string | null): string {
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }
  return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60';
}

const FALLBACK_BOOKS: BookSearchResult[] = [
  {
    key: 'works/OL17352669W',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author_name: ['Gabrielle Zevin'],
    first_publish_year: 2022,
    cover_i: 12843003,
    number_of_pages_median: 416,
    subject: ['Video Games', 'Friendship', 'Fiction', 'Romance'],
    overview: 'A dazzling story of two friends often in love, but never lovers, who come together as creative partners in the world of video game design.',
  },
  {
    key: 'works/OL82586W',
    title: 'Dune',
    author_name: ['Frank Herbert'],
    first_publish_year: 1965,
    cover_i: 10522438,
    number_of_pages_median: 688,
    subject: ['Science Fiction', 'Space Opera', 'Adventure'],
    overview: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who will become the mysterious man known as Muad’Dib.',
  },
  {
    key: 'works/OL17860773W',
    title: 'A Court of Thorns and Roses',
    author_name: ['Sarah J. Maas'],
    first_publish_year: 2015,
    cover_i: 12513470,
    number_of_pages_median: 432,
    subject: ['Fantasy', 'Romance', 'Fae', 'Adventure'],
    overview: 'When nineteen-year-old huntress Feyre kills a wolf in the woods, a beast-like creature arrives to demand retribution.',
  },
  {
    key: 'works/OL17930358W',
    title: 'Dark Matter',
    author_name: ['Blake Crouch'],
    first_publish_year: 2016,
    cover_i: 8326084,
    number_of_pages_median: 352,
    subject: ['Sci-Fi', 'Thriller', 'Multiverse', 'Mystery'],
    overview: 'A mind-bending, relentlessly paced psychological thriller about choices, paths not taken, and how far we’ll go to reclaim the lives we dream of.',
  },
  {
    key: 'works/OL20864386W',
    title: 'Fourth Wing',
    author_name: ['Rebecca Yarros'],
    first_publish_year: 2023,
    cover_i: 13404768,
    number_of_pages_median: 512,
    subject: ['Fantasy', 'Dragons', 'Romance', 'War'],
    overview: 'Twenty-year-old Violet Sorrengail was destined for a quiet life among books, until she was ordered to join the dragon riders.',
  },
  {
    key: 'works/OL8589785W',
    title: 'Twilight',
    author_name: ['Stephenie Meyer'],
    first_publish_year: 2005,
    cover_i: 8235431,
    number_of_pages_median: 498,
    subject: ['Vampires', 'Young Adult', 'Romance', 'Fantasy'],
    overview: 'Isabella Swan moves to gloomy Forks, Washington and finds herself drawn to the brooding, mysterious Edward Cullen.',
  },
  {
    key: 'works/OL15858079W',
    title: 'The Song of Achilles',
    author_name: ['Madeline Miller'],
    first_publish_year: 2011,
    cover_i: 8302061,
    number_of_pages_median: 416,
    subject: ['Mythology', 'Historical Fiction', 'Romance'],
    overview: 'A gorgeous, lyrical reimagining of the Iliad with deep emotional resonance and breathtaking prose.',
  },
  {
    key: 'works/OL21177W',
    title: 'Harry Potter and the Sorcerer’s Stone',
    author_name: ['J.K. Rowling'],
    first_publish_year: 1997,
    cover_i: 10521270,
    number_of_pages_median: 309,
    subject: ['Fantasy', 'Magic', 'Wizards', 'Young Adult'],
    overview: 'Harry Potter discovers he is a wizard on his eleventh birthday and enters the magical world of Hogwarts.',
  },
  {
    key: 'works/OL20014022W',
    title: 'Project Hail Mary',
    author_name: ['Andy Weir'],
    first_publish_year: 2021,
    cover_i: 10609344,
    number_of_pages_median: 496,
    subject: ['Sci-Fi', 'Space', 'Survival', 'Aliens'],
    overview: 'Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity from extinction.',
  },
  {
    key: 'works/OL19683685W',
    title: 'The Midnight Library',
    author_name: ['Matt Haig'],
    first_publish_year: 2020,
    cover_i: 10389304,
    number_of_pages_median: 304,
    subject: ['Fiction', 'Fantasy', 'Parallel Worlds', 'Mental Health'],
    overview: 'Between life and death there is a library where every book provides a chance to try another life you could have lived.',
  }
];

export async function searchBooksOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return FALLBACK_BOOKS;

  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=15`);
    if (!res.ok) throw new Error('Open Library request failed');

    const data = await res.json();
    const docs = data.docs || [];

    if (docs.length === 0) {
      const ranked = FALLBACK_BOOKS.map((b) => {
        const score = Math.max(
          fuzzySimilarity(trimmed, b.title),
          ...(b.author_name || []).map((auth) => fuzzySimilarity(trimmed, auth) * 0.8)
        );
        return { b, score };
      })
        .filter((r) => r.score >= 0.45)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.b);

      return ranked.length > 0 ? ranked : FALLBACK_BOOKS.slice(0, 3);
    }

    // Filter to prioritize editions with real covers and sort by title match then edition count
    const withCovers = docs.filter((d: any) => d.cover_i || (d.isbn && d.isbn.length > 0));
    const candidateList = withCovers.length > 0 ? withCovers : docs;

    const qLower = trimmed.toLowerCase();
    candidateList.sort((a: any, b: any) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      const aScore = fuzzySimilarity(qLower, aTitle);
      const bScore = fuzzySimilarity(qLower, bTitle);
      
      if (Math.abs(aScore - bScore) > 0.15) {
        return bScore - aScore;
      }
      return (b.edition_count || 0) - (a.edition_count || 0);
    });

    return candidateList.map((doc: any) => {
      const isbn = doc.isbn?.[0];
      return {
        key: doc.key,
        title: doc.title,
        author_name: doc.author_name || ['Unknown Author'],
        first_publish_year: doc.first_publish_year,
        cover_i: doc.cover_i,
        posterUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : isbn
          ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
          : undefined,
        number_of_pages_median: doc.number_of_pages_median,
        subject: (doc.subject || []).slice(0, 4),
        overview: doc.first_sentence?.[0] || doc.subtitle || '',
      };
    });
  } catch (err) {
    console.error('Open Library search failed:', err);
    const ranked = FALLBACK_BOOKS.map((b) => {
      const score = Math.max(
        fuzzySimilarity(trimmed, b.title),
        ...(b.author_name || []).map((auth) => fuzzySimilarity(trimmed, auth) * 0.8)
      );
      return { b, score };
    })
      .filter((r) => r.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.b);

    return ranked.length > 0 ? ranked : FALLBACK_BOOKS.slice(0, 3);
  }
}

export function fetchTrendingBooks(): BookSearchResult[] {
  return FALLBACK_BOOKS;
}
