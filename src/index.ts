/**
 * Main entry point for the lex-semantic application
 */

import * as path from 'path';

// Set up Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '..', 'terminospectro-service-key.json');

console.log('🚀 Starting Lex Semantic application...');

// Import and start the app
import app from './app';

console.log('✅ App imported successfully');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📄 Serving index page at http://localhost:${PORT}/`);
  console.log(`📋 API endpoints:`);
  console.log(`   POST /api/process-text - Process text input`);
  console.log(`   POST /api/process-pdf - Process PDF upload`);
  console.log(`   POST /api/analyze-nlp - Analyze text with Google Cloud NLP`);
});