import { describe, it, expect } from 'vitest';
import { toTitleCase, levenshteinDistance, fuzzySimilarity, findBestFuzzyMatch, normalizeForSearch } from '../lib/fuzzy';

describe('Fuzzy Matching & String Utilities', () => {
  describe('toTitleCase', () => {
    it('properly capitalizes lowercase titles', () => {
      expect(toTitleCase('inception')).toBe('Inception');
      expect(toTitleCase('the dark knight')).toBe('The Dark Knight');
      expect(toTitleCase('everything everywhere all at once')).toBe('Everything Everywhere All at Once');
    });

    it('handles subtitles and punctuation properly', () => {
      expect(toTitleCase('dune: part two')).toBe('Dune: Part Two');
      expect(toTitleCase('hades ii')).toBe('Hades II');
      expect(toTitleCase('baldur’s gate 3')).toBe('Baldur’s Gate 3');
      expect(toTitleCase('sci-fi adventure')).toBe('Sci-Fi Adventure');
    });
  });

  describe('levenshteinDistance', () => {
    it('calculates edit distances accurately', () => {
      expect(levenshteinDistance('severance', 'severence')).toBe(1);
      expect(levenshteinDistance('oppenheimer', 'oppenhiemer')).toBe(2);
      expect(levenshteinDistance('dune', 'dune')).toBe(0);
    });
  });

  describe('fuzzySimilarity', () => {
    it('detects high similarity for typos and variations', () => {
      expect(fuzzySimilarity('oppenhiemer', 'Oppenheimer')).toBeGreaterThan(0.8);
      expect(fuzzySimilarity('severence', 'Severance')).toBeGreaterThan(0.85);
      expect(fuzzySimilarity('it takes 2', 'It Takes Two')).toBeGreaterThan(0.5);
      expect(fuzzySimilarity('harry poter', 'Harry Potter')).toBeGreaterThan(0.8);
    });

    it('normalizes case and punctuation before comparing', () => {
      expect(fuzzySimilarity('dune part two', 'Dune: Part Two')).toBeGreaterThan(0.8);
      expect(fuzzySimilarity('shutter island', 'SHUTTER ISLAND')).toBe(1.0);
    });
  });

  describe('findBestFuzzyMatch', () => {
    const candidates = [
      { id: 1, name: 'Dune: Part Two' },
      { id: 2, name: 'Severance' },
      { id: 3, name: 'Oppenheimer' },
      { id: 4, name: 'It Takes Two' },
    ];

    it('matches typos to the correct candidate item', () => {
      const match1 = findBestFuzzyMatch('oppenhiemer', candidates, (c) => c.name);
      expect(match1?.item.name).toBe('Oppenheimer');

      const match2 = findBestFuzzyMatch('dune 2', candidates, (c) => c.name);
      expect(match2?.item.name).toBe('Dune: Part Two');

      const match3 = findBestFuzzyMatch('severence', candidates, (c) => c.name);
      expect(match3?.item.name).toBe('Severance');
    });
  });

  describe('normalizeForSearch', () => {
    it('strips punctuation and standardizes spacing and number words', () => {
      expect(normalizeForSearch('Dune: Part Two')).toBe('dune part 2');
      expect(normalizeForSearch("Baldur's Gate 3!")).toBe('baldurs gate 3');
      expect(normalizeForSearch('It Takes Two')).toBe('it takes 2');
    });
  });
});
