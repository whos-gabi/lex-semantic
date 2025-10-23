/**
 * API Routes - Express routes for text and PDF processing
 */

import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeTextWithNLP } from '../modules/nlp';
import { extractTextFromPDF, formatText, parseMultipartData } from '../modules/pdf';
import { dictionaryService } from '../services/dictionary';

const router = Router();

/**
 * Process text input
 */
router.post('/process-text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const formattedText = formatText(text);
    return res.json({ formattedText });
  } catch (error) {
    console.error('❌ Text processing error:', error);
    return res.status(500).json({ error: 'Failed to process text' });
  }
});

/**
 * Process PDF upload
 */
router.post('/process-pdf', async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await parseMultipartData(req);
    const pdfData = await extractTextFromPDF(pdfBuffer);
    const formattedText = formatText(pdfData.text);
    
    return res.json({ formattedText });
  } catch (error) {
    console.error('❌ PDF processing error:', error);
    return res.status(500).json({ error: 'Failed to process PDF: ' + (error as Error).message });
  }
});

/**
 * Analyze text with NLP
 */
router.post('/analyze-nlp', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const analysis = await analyzeTextWithNLP(text);
    return res.json(analysis);
  } catch (error) {
    console.error('❌ NLP analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze text: ' + (error as Error).message });
  }
});

/**
 * Search dictionary
 */
router.get('/dictionary/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '10', source = 'both', flexsearch = 'true' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const searchLimit = parseInt(limit as string) || 10;
    const useFlexSearch = flexsearch === 'true';
    const searchSource = source as 'usc' | 'bld' | 'both';
    
    let results;
    if (searchSource === 'both') {
      results = await dictionaryService.search(q, searchLimit, useFlexSearch);
    } else {
      results = await dictionaryService.searchDictionary(searchSource, q, searchLimit);
    }
    
    return res.json({ 
      results, 
      query: q, 
      source: searchSource,
      flexsearch: useFlexSearch,
      count: results.length 
    });
  } catch (error) {
    console.error('❌ Dictionary search error:', error);
    return res.status(500).json({ error: 'Failed to search dictionary: ' + (error as Error).message });
  }
});

/**
 * Rendered HTML search results (server-side EJS include)
 */
router.get('/dictionary/search-view', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20', source = 'both', flexsearch = 'true' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).send('');
    }

    const searchLimit = parseInt(limit as string) || 20;
    const useFlexSearch = flexsearch === 'true';
    const searchSource = source as 'usc' | 'bld' | 'both';

    let results;
    if (searchSource === 'both') {
      results = await dictionaryService.search(q, searchLimit, useFlexSearch);
    } else {
      results = await dictionaryService.searchDictionary(searchSource, q, searchLimit);
    }

    // Render the results using the EJS component
    const viewsDir = path.join(__dirname, '..', '..', 'views');
    const template = fs.readFileSync(path.join(viewsDir, 'components', 'dictionary-results.ejs'), 'utf-8');
    // Use EJS renderFile via res.render with absolute path-like include root
    return res.render(path.join('components', 'dictionary-results'), { results });
  } catch (error) {
    console.error('❌ Dictionary search-view error:', error);
    return res.status(500).send('');
  }
});

/**
 * Get exact dictionary match
 */
router.get('/dictionary/exact/:word', async (req: Request, res: Response) => {
  try {
    const { word } = req.params;
    
    if (!word) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }
    
    const exactMatch = dictionaryService.getExactMatch(word);
    return res.json({ word, match: exactMatch });
  } catch (error) {
    console.error('❌ Dictionary exact match error:', error);
    return res.status(500).json({ error: 'Failed to get exact match: ' + (error as Error).message });
  }
});

/**
 * Get dictionary statistics
 */
router.get('/dictionary/stats', async (req: Request, res: Response) => {
  try {
    const stats = dictionaryService.getStats();
    return res.json(stats);
  } catch (error) {
    console.error('❌ Dictionary stats error:', error);
    return res.status(500).json({ error: 'Failed to get dictionary stats: ' + (error as Error).message });
  }
});

export default router;
