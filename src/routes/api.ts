/**
 * API Routes - Express routes for text and PDF processing
 */

import { Router, Request, Response } from 'express';
import { analyzeTextWithNLP } from '../modules/nlp';
import { extractTextFromPDF, formatText, parseMultipartData } from '../modules/pdf';

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

export default router;
