/**
 * Main entry point for the lex-semantic application
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
// Import pdf-parse with proper handling
const pdfParse = require('pdf-parse');
// Import Google Cloud Language
const { LanguageServiceClient } = require('@google-cloud/language');

console.log('pdf-parse imported successfully');

// Set up Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '..', 'terminospectro-service-key.json');

// Initialize Google Cloud Language client
const languageClient = new LanguageServiceClient();

console.log('Google Cloud Language client initialized');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// MIME types for different file extensions
const mimeTypes: { [key: string]: string } = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Helper function to send JSON response
const sendJSON = (res: http.ServerResponse, statusCode: number, data: any) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Helper function to format text
const formatText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
};

// Helper function to analyze text with Google Cloud NLP
const analyzeTextWithNLP = async (text: string) => {
  try {
    console.log('🔍 Starting NLP analysis...');
    
    const document = {
      content: text,
      type: 'PLAIN_TEXT' as const,
    };

    // Analyze syntax
    const [syntaxAnalysis] = await languageClient.analyzeSyntax({ document });
    const tokens = syntaxAnalysis.tokens || [];

    console.log(`📊 Analyzed ${tokens.length} tokens`);

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

    console.log(`✨ Found ${highlights.filter(h => h.type === 'noun').length} nouns and ${highlights.filter(h => h.type === 'verb').length} verbs`);

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
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/process-text' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body);
        if (!text || typeof text !== 'string') {
          sendJSON(res, 400, { error: 'Text is required' });
          return;
        }
        
        const formattedText = formatText(text);
        sendJSON(res, 200, { formattedText });
      } catch (error) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  if (pathname === '/api/analyze-nlp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        if (!text || typeof text !== 'string') {
          sendJSON(res, 400, { error: 'Text is required' });
          return;
        }
        
        console.log('📝 NLP analysis request received');
        const analysis = await analyzeTextWithNLP(text);
        sendJSON(res, 200, analysis);
      } catch (error) {
        console.error('❌ NLP API error:', error);
        sendJSON(res, 500, { error: 'Failed to analyze text: ' + (error as Error).message });
      }
    });
    return;
  }

  if (pathname === '/api/process-pdf' && req.method === 'POST') {
    console.log('📄 PDF processing request received');
    console.log('📋 Headers:', req.headers);
    
    // Parse multipart form data manually
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      console.log('❌ No boundary found in content-type');
      sendJSON(res, 400, { error: 'Invalid content type' });
      return;
    }
    
    console.log(`🔍 Boundary: ${boundary}`);
    
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      console.log(`📦 Received chunk: ${chunk.length} bytes`);
      chunks.push(chunk);
    });
    
    req.on('end', async () => {
      try {
        const fullBuffer = Buffer.concat(chunks);
        console.log(`📊 Total buffer size: ${fullBuffer.length} bytes`);
        
        // Find the PDF content between boundaries
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
        
        console.log(`🔍 Looking for boundary: ${boundaryBuffer.toString()}`);
        
        // Find start of PDF content
        const startIndex = fullBuffer.indexOf(boundaryBuffer);
        if (startIndex === -1) {
          console.log('❌ Start boundary not found');
          sendJSON(res, 400, { error: 'Invalid form data' });
          return;
        }
        
        // Find the actual PDF content (after headers)
        const pdfStart = fullBuffer.indexOf(Buffer.from('\r\n\r\n'), startIndex);
        if (pdfStart === -1) {
          console.log('❌ PDF content start not found');
          sendJSON(res, 400, { error: 'Invalid form data' });
          return;
        }
        
        // Find end of PDF content
        const pdfEnd = fullBuffer.indexOf(boundaryBuffer, pdfStart);
        if (pdfEnd === -1) {
          console.log('❌ End boundary not found');
          sendJSON(res, 400, { error: 'Invalid form data' });
          return;
        }
        
        // Extract PDF content
        const pdfBuffer = fullBuffer.slice(pdfStart + 4, pdfEnd);
        console.log(`📄 Extracted PDF size: ${pdfBuffer.length} bytes`);
        console.log(`🔍 PDF first 20 bytes:`, pdfBuffer.slice(0, 20));
        console.log(`🔍 PDF first 20 chars:`, pdfBuffer.toString('ascii', 0, 20));
        
        // Validate PDF header
        const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
        console.log(`📋 PDF header check: "${pdfHeader}"`);
        
        if (pdfHeader !== '%PDF') {
          console.log('❌ Not a PDF file');
          sendJSON(res, 400, { error: 'Invalid PDF file - not a PDF' });
          return;
        }
        
        console.log('✅ PDF validation passed, processing...');
        
        // Parse the PDF using pdf-parse
        const pdfData = await pdfParse(pdfBuffer);
        
        console.log(`📄 PDF parsed successfully, text length: ${pdfData.text.length}`);
        console.log(`📄 First 100 chars of text:`, pdfData.text.substring(0, 100));
        
        const formattedText = formatText(pdfData.text);
        console.log(`✨ Formatted text length: ${formattedText.length}`);
        
        sendJSON(res, 200, { formattedText });
      } catch (error) {
        console.error('❌ PDF processing error:', error);
        console.error('❌ Error stack:', (error as Error).stack);
        sendJSON(res, 500, { error: 'Failed to process PDF: ' + (error as Error).message });
      }
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      sendJSON(res, 500, { error: 'Request error' });
    });
    
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/pages/index.html' : pathname || '/pages/index.html';
  
  // Remove leading slash and construct full path
  filePath = path.join(__dirname, '..', filePath);
  
  // Security: prevent directory traversal
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(path.join(__dirname, '..'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Get file extension for MIME type
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📄 Serving index page at http://${HOST}:${PORT}/`);
  console.log(`📋 API endpoints:`);
  console.log(`   POST /api/process-text - Process text input`);
  console.log(`   POST /api/process-pdf - Process PDF upload`);
  console.log(`   POST /api/analyze-nlp - Analyze text with Google Cloud NLP`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
