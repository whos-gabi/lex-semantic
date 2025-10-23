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
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// API routes
app.use('/api', apiRoutes);

// Route handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'home.html'));
});

app.get('/semantix', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'semantix.html'));
});

app.get('/blacklaw', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'blacklaw.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
