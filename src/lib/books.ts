import { BookSearchResult } from '../types';

export function getBookCoverUrl(coverId?: number | null): string {
  if (!coverId) {
    return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60';
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
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
    cover_i: 13576759,
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
  }
];

export async function searchBooksOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return FALLBACK_BOOKS;

  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=12`);
    if (!res.ok) throw new Error('Open Library request failed');

    const data = await res.json();
    const docs = data.docs || [];

    if (docs.length === 0) {
      return FALLBACK_BOOKS.filter((b) =>
        b.title.toLowerCase().includes(trimmed.toLowerCase()) ||
        (b.author_name?.[0] || '').toLowerCase().includes(trimmed.toLowerCase())
      );
    }

    return docs.map((doc: any) => ({
      key: doc.key,
      title: doc.title,
      author_name: doc.author_name || ['Unknown Author'],
      first_publish_year: doc.first_publish_year,
      cover_i: doc.cover_i,
      number_of_pages_median: doc.number_of_pages_median,
      subject: (doc.subject || []).slice(0, 4),
      overview: doc.first_sentence?.[0] || doc.subtitle || '',
    }));
  } catch (err) {
    console.error('Open Library search failed:', err);
    return FALLBACK_BOOKS.filter((b) =>
      b.title.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}

export function fetchTrendingBooks(): BookSearchResult[] {
  return FALLBACK_BOOKS;
}
