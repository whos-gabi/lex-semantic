/**
 * Express Application - Main application setup
 */

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import apiRoutes from './routes/api';
import { dictionaryService } from './services/dictionary';

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'pages')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Initialize dictionary service
dictionaryService.loadDictionaries().catch(error => {
  console.error('❌ Failed to load dictionaries:', error);
});

// API routes
app.use('/api', apiRoutes);

// Route handlers
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    activePage: 'home',
    content: require('fs').readFileSync(path.join(__dirname, '..', 'views', 'pages', 'home.ejs'), 'utf-8')
  });
});

app.get('/semantix', (req, res) => {
  res.render('index', {
    title: 'Semantix',
    activePage: 'semantix',
    content: require('fs').readFileSync(path.join(__dirname, '..', 'views', 'pages', 'semantix.ejs'), 'utf-8')
  });
});

app.get('/blacklaw', (req, res) => {
  res.render('index', {
    title: 'BlackLawDex2nd',
    activePage: 'blacklaw',
    content: require('fs').readFileSync(path.join(__dirname, '..', 'views', 'pages', 'blacklaw.ejs'), 'utf-8')
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
