/**
 * Express Application - Main application setup
 */

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'pages')));
app.use(express.static(path.join(__dirname, '..', 'assets')));

// API routes
app.use('/api', apiRoutes);

// Serve index page for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📄 Serving index page at http://localhost:${PORT}/`);
  console.log(`📋 API endpoints:`);
  console.log(`   POST /api/process-text - Process text input`);
  console.log(`   POST /api/process-pdf - Process PDF upload`);
  console.log(`   POST /api/analyze-nlp - Analyze text with Google Cloud NLP`);
});

export default app;
