/**
 * 🔍 Fuzzy matching and string normalization utilities
 * Handles autocorrecting spelling, typos, and upper/lower case.
 */

// Minor words that shouldn't be capitalized in title case unless first/last word
const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with', 'as', 'vs'
]);

// Roman numerals and special acronyms
const UPPERCASE_TOKENS = new Set([
  'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'tv', 'rpg', 'pc', 'ps4', 'ps5', 'ai', '3d', 'hd', '4k', 'ui', 'tmdb', 'rawg'
]);

// Words to number mappings for normalizing sequels and subtitles
const WORD_TO_NUMBER: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  first: '1',
  second: '2',
  third: '3',
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
};

/**
 * Convert any string into clean, beautiful Title Case
 * e.g. "everything everywhere all at once" -> "Everything Everywhere All at Once"
 * e.g. "dune: part two" -> "Dune: Part Two"
 * e.g. "hades ii" -> "Hades II"
 */
export function toTitleCase(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const words = trimmed.split(' ');

  return words
    .map((word, index) => {
      // Check for hyphenated words e.g. "sci-fi" -> "Sci-Fi"
      if (word.includes('-')) {
        return word
          .split('-')
          .map((sub, subIdx) => formatSingleWord(sub, index === 0 && subIdx === 0, index === words.length - 1))
          .join('-');
      }

      const isFirst = index === 0;
      const isLast = index === words.length - 1;
      const prevWord = index > 0 ? words[index - 1] : '';
      const followsColon = prevWord.endsWith(':') || prevWord.endsWith('-');

      return formatSingleWord(word, isFirst || followsColon, isLast);
    })
    .join(' ');
}

function formatSingleWord(word: string, isFirst: boolean, isLast: boolean): string {
  if (!word) return '';

  const match = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
  if (!match) return word;

  const [, leading, core, trailing] = match;
  if (!core) return word;

  const coreLower = core.toLowerCase();

  // Check roman numerals / acronyms
  if (UPPERCASE_TOKENS.has(coreLower)) {
    return `${leading}${coreLower.toUpperCase()}${trailing}`;
  }

  // Check minor words (articles/prepositions)
  if (!isFirst && !isLast && MINOR_WORDS.has(coreLower)) {
    return `${leading}${coreLower}${trailing}`;
  }

  // Standard Title Case
  const capitalized = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
  return `${leading}${capitalized}${trailing}`;
}

/**
 * Calculate Levenshtein Distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();

  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Clean & normalize a string for fuzzy comparisons (removes punctuation, lowercases, standardizes numbers)
 */
export function normalizeForSearch(text: string): string {
  const raw = (text || '')
    .toLowerCase()
    .replace(/['"’“”]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Standardize number words & roman numerals
  return raw
    .split(' ')
    .map((w) => WORD_TO_NUMBER[w] || w)
    .join(' ');
}

/**
 * Calculate similarity between two strings from 0.0 (no match) to 1.0 (exact match)
 * Uses a blend of Levenshtein edit distance, Token similarity, and substring match.
 */
export function fuzzySimilarity(str1: string, str2: string): number {
  const a = normalizeForSearch(str1);
  const b = normalizeForSearch(str2);

  if (!a || !b) return 0;
  if (a === b) return 1.0;

  // Substring match
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    return 0.75 + (0.25 * (minLen / maxLen));
  }

  // Levenshtein ratio
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  const levRatio = Math.max(0, (maxLen - dist) / maxLen);

  // Multi-token similarity
  const tokensA = a.split(/\s+/).filter(Boolean);
  const tokensB = b.split(/\s+/).filter(Boolean);

  if (tokensA.length > 1 || tokensB.length > 1) {
    let tokenMatches = 0;
    for (const tA of tokensA) {
      for (const tB of tokensB) {
        if (tA === tB || (tA.length >= 3 && tB.length >= 3 && levenshteinDistance(tA, tB) <= 1)) {
          tokenMatches++;
          break;
        }
      }
    }
    const tokenScore = tokenMatches / Math.max(tokensA.length, tokensB.length);

    // Number / sequel mismatch check
    const digitsA = (a.match(/\d+/g) || []).join('');
    const digitsB = (b.match(/\d+/g) || []).join('');
    let numberPenalty = 0;
    if (digitsA && digitsB && digitsA !== digitsB) {
      numberPenalty = 0.35;
    }

    return Math.max(0, Math.min(1.0, Math.max(levRatio, tokenScore) - numberPenalty));
  }

  return Math.max(0, Math.min(1.0, levRatio));
}

/**
 * Find the best matching candidate from a list using fuzzy similarity
 */
export function findBestFuzzyMatch<T>(
  query: string,
  candidates: T[],
  getTitle: (item: T) => string,
  minThreshold = 0.45
): { item: T; score: number } | null {
  if (!query.trim() || candidates.length === 0) return null;

  let bestMatch: T | null = null;
  let highestScore = 0;

  for (const candidate of candidates) {
    const candTitle = getTitle(candidate);
    const score = fuzzySimilarity(query, candTitle);

    if (score > highestScore && score >= minThreshold) {
      highestScore = score;
      bestMatch = candidate;
    }
  }

  if (!bestMatch) return null;
  return { item: bestMatch, score: highestScore };
}

/**
 * Validate and sanitize image URLs to guarantee safe protocols (https://, http://, data:image/, blob:)
 * Prevents javascript: or other malicious scheme injections.
 */
export function sanitizeImageUrl(
  url?: string | null,
  fallback = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'
): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return fallback;
}

