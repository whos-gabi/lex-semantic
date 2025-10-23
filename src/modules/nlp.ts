/**
 * NLP Module - Google Cloud Natural Language Processing
 */

import { LanguageServiceClient } from '@google-cloud/language';
import * as path from 'path';

// Initialize Google Cloud Language client
const languageClient = new LanguageServiceClient();

export interface NLPAnalysis {
  originalText: string;
  highlightedText: string;
  nounCount: number;
  verbCount: number;
}

/**
 * Analyze text with Google Cloud NLP
 */
export async function analyzeTextWithNLP(text: string): Promise<NLPAnalysis> {
  try {
    const document = {
      content: text,
      type: 'PLAIN_TEXT' as const,
    };

    // Analyze syntax
    const [syntaxAnalysis] = await languageClient.analyzeSyntax({ document });
    const tokens = syntaxAnalysis.tokens || [];

    // Create highlighted text by replacing words in the original text
    let highlightedText = text;
    const highlights: Array<{word: string, type: 'noun' | 'verb'}> = [];

    // First, collect all nouns and verbs
    tokens.forEach((token: any) => {
      const textContent = token.text?.content || '';
      const posTag = token.partOfSpeech?.tag || '';

      if (posTag === 'NOUN') {
        highlights.push({ word: textContent, type: 'noun' });
      } else if (posTag === 'VERB') {
        highlights.push({ word: textContent, type: 'verb' });
      }
    });

    // Apply highlights by replacing words in the text
    highlights.forEach(highlight => {
      const className = highlight.type === 'noun' ? 'noun-highlight' : 'verb-highlight';
      const highlightedWord = `<span class="${className}">${highlight.word}</span>`;
      
      // Simple string replacement (case sensitive)
      highlightedText = highlightedText.replace(highlight.word, highlightedWord);
    });

    return {
      originalText: text,
      highlightedText: highlightedText,
      nounCount: highlights.filter(h => h.type === 'noun').length,
      verbCount: highlights.filter(h => h.type === 'verb').length
    };
  } catch (error) {
    console.error('❌ NLP analysis error:', error);
    throw new Error('Failed to analyze text with NLP: ' + (error as Error).message);
  }
}
