/**
 * Dictionary Service with O(1) lookups and FlexSearch
 */

import * as fs from 'fs';
import * as path from 'path';
import * as FlexSearch from 'flexsearch';
import { DictionaryEntry, Dictionary, SearchResult, DictionarySource } from '../types/dictionary';

class DictionaryService {
  private uscDictionary: Dictionary = {};
  private bldDictionary: Dictionary = {};
  private uscEntries: DictionaryEntry[] = [];
  private bldEntries: DictionaryEntry[] = [];
  private isLoaded = false;
  
  // FlexSearch instances for advanced searching
  private uscSearch: FlexSearch.Index;
  private bldSearch: FlexSearch.Index;
  private combinedSearch: FlexSearch.Index;

  constructor() {
    // Initialize FlexSearch with basic settings
    this.uscSearch = new FlexSearch.Index();
    this.bldSearch = new FlexSearch.Index();
    this.combinedSearch = new FlexSearch.Index();
  }

  /**
   * Load dictionaries from JSON files
   */
  async loadDictionaries(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load USC dictionary
      const uscPath = path.join(__dirname, '..', '..', 'assets', 'dex', 'usc.json');
      const uscData: DictionaryEntry[] = JSON.parse(fs.readFileSync(uscPath, 'utf-8'));
      
      for (const entry of uscData) {
        const key = entry.title.toLowerCase();
        this.uscDictionary[key] = entry;
        this.uscEntries.push(entry);
        
        // Add to FlexSearch index
        this.uscSearch.add(entry.permalink, entry.title + ' ' + entry.body);
        this.combinedSearch.add(entry.permalink, entry.title + ' ' + entry.body);
      }

      // Load BLD dictionary
      const bldPath = path.join(__dirname, '..', '..', 'assets', 'dex', 'bld.json');
      const bldData: DictionaryEntry[] = JSON.parse(fs.readFileSync(bldPath, 'utf-8'));
      
      for (const entry of bldData) {
        const key = entry.title.toLowerCase();
        this.bldDictionary[key] = entry;
        this.bldEntries.push(entry);
        
        // Add to FlexSearch index
        this.bldSearch.add(entry.permalink, entry.title + ' ' + entry.body);
        this.combinedSearch.add(entry.permalink, entry.title + ' ' + entry.body);
      }

      this.isLoaded = true;
      console.log('✅ Dictionaries loaded successfully');
      console.log(`📚 USC entries: ${Object.keys(this.uscDictionary).length}`);
      console.log(`📚 BLD entries: ${Object.keys(this.bldDictionary).length}`);
    } catch (error) {
      console.error('❌ Error loading dictionaries:', error);
      throw error;
    }
  }

  /**
   * Get exact word lookup (O(1))
   */
  getExactMatch(word: string): { usc?: DictionaryEntry; bld?: DictionaryEntry } {
    const normalizedWord = word.toLowerCase();
    const result: { usc?: DictionaryEntry; bld?: DictionaryEntry } = {};

    if (this.uscDictionary[normalizedWord]) {
      result.usc = this.uscDictionary[normalizedWord];
    }

    if (this.bldDictionary[normalizedWord]) {
      result.bld = this.bldDictionary[normalizedWord];
    }

    return result;
  }

  /**
   * Search using FlexSearch for advanced matching
   */
  async search(query: string, limit: number = 10, useFlexSearch: boolean = true): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      if (useFlexSearch) {
        return await this.flexSearch(query, limit);
      } else {
        return await this.simpleSearch(query, limit);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      return [];
    }
  }

  /**
   * Advanced search using FlexSearch
   */
  private async flexSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const seenWords = new Set<string>();

    try {
      // Search combined index
      const searchResults = this.combinedSearch.search(query, limit * 2);
      
      for (const permalink of searchResults) {
        // Find the entry by permalink
        const entry = [...this.uscEntries, ...this.bldEntries].find(e => e.permalink === permalink);
        if (entry) {
          const key = entry.title.toLowerCase();
          
          if (!seenWords.has(key)) {
            seenWords.add(key);
            results.push({
              word: entry.title,
              definition: entry.body,
              source: entry.source,
              permalink: entry.permalink,
              letter: entry.letter,
              published_at: entry.published_at
            });
          }
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('❌ FlexSearch error:', error);
      // Fallback to simple search
      return await this.simpleSearch(query, limit);
    }
  }

  /**
   * Simple search using text matching (fallback)
   */
  private async simpleSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const seenWords = new Set<string>();
    const queryLower = query.toLowerCase();

    // Search USC dictionary
    for (const entry of this.uscEntries) {
      if (this.matchesQuery(entry, queryLower) && !seenWords.has(entry.title.toLowerCase())) {
        seenWords.add(entry.title.toLowerCase());
        results.push({
          word: entry.title,
          definition: entry.body,
          source: entry.source,
          permalink: entry.permalink,
          letter: entry.letter,
          published_at: entry.published_at
        });
      }
    }

    // Search BLD dictionary
    for (const entry of this.bldEntries) {
      if (this.matchesQuery(entry, queryLower) && !seenWords.has(entry.title.toLowerCase())) {
        seenWords.add(entry.title.toLowerCase());
        results.push({
          word: entry.title,
          definition: entry.body,
          source: entry.source,
          permalink: entry.permalink,
          letter: entry.letter,
          published_at: entry.published_at
        });
      }
    }

    // Sort by relevance (exact matches first, then alphabetical)
    return results.sort((a, b) => {
      const aExact = a.word.toLowerCase() === queryLower;
      const bExact = b.word.toLowerCase() === queryLower;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.word.localeCompare(b.word);
    }).slice(0, limit);
  }

  /**
   * Check if entry matches search query
   */
  private matchesQuery(entry: DictionaryEntry, query: string): boolean {
    const titleMatch = entry.title && typeof entry.title === 'string' 
      ? entry.title.toLowerCase().includes(query) 
      : false;
    
    const bodyMatch = entry.body && typeof entry.body === 'string' 
      ? entry.body.toLowerCase().includes(query) 
      : false;
    
    return titleMatch || bodyMatch;
  }

  /**
   * Search specific dictionary using FlexSearch
   */
  async searchDictionary(source: DictionarySource, query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const results: SearchResult[] = [];
      const seenWords = new Set<string>();
      let searchResults: any[] = [];

      if (source === 'usc' || source === 'both') {
        const uscResults = this.uscSearch.search(query, limit);
        searchResults = searchResults.concat(uscResults);
      }

      if (source === 'bld' || source === 'both') {
        const bldResults = this.bldSearch.search(query, limit);
        searchResults = searchResults.concat(bldResults);
      }

      for (const permalink of searchResults) {
        // Find the entry by permalink
        const entry = [...this.uscEntries, ...this.bldEntries].find(e => e.permalink === permalink);
        if (entry) {
          const key = entry.title.toLowerCase();
          
          if (!seenWords.has(key)) {
            seenWords.add(key);
            results.push({
              word: entry.title,
              definition: entry.body,
              source: entry.source,
              permalink: entry.permalink,
              letter: entry.letter,
              published_at: entry.published_at
            });
          }
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('❌ Dictionary search error:', error);
      return [];
    }
  }

  /**
   * Get dictionary statistics
   */
  getStats() {
    return {
      uscEntries: Object.keys(this.uscDictionary).length,
      bldEntries: Object.keys(this.bldDictionary).length,
      totalEntries: Object.keys(this.uscDictionary).length + Object.keys(this.bldDictionary).length,
      isLoaded: this.isLoaded
    };
  }
}

// Export singleton instance
export const dictionaryService = new DictionaryService();
