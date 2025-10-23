/**
 * Dictionary entry type based on the JSON structure
 */
export interface DictionaryEntry {
  title: string;
  letter: string;
  permalink: string;
  body: string;
  published_at: string;
  source: string;
}

/**
 * Dictionary type for O(1) lookups
 */
export type Dictionary = Record<string, DictionaryEntry>;

/**
 * Search result type
 */
export interface SearchResult {
  word: string;
  definition: string;
  source: string;
  permalink: string;
  letter: string;
  published_at: string;
}

/**
 * Dictionary source type
 */
export type DictionarySource = 'usc' | 'bld' | 'both';
