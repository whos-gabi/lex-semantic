/**
 * Main entry point for the lex-semantic application
 */

import * as path from 'path';

// Set up Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '..', 'terminospectro-service-key.json');

console.log('🚀 Starting Lex Semantic application...');

// Import and start the app
import app from './app';