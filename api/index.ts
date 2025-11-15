import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pdfRouter } from '../backend/src/routes/pdf';
import { ragRouter } from '../backend/src/routes/rag';
import { workflowRouter } from '../backend/src/routes/workflow';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`, {
    originalUrl: req.originalUrl,
    url: req.url,
    baseUrl: req.baseUrl,
  });
  next();
});

// Routes
// Try both with and without /api prefix to handle Vercel routing
// Vercel may strip the /api prefix when routing to api/index.ts
app.use('/pdf', pdfRouter);
app.use('/api/pdf', pdfRouter);
app.use('/rag', ragRouter);
app.use('/api/rag', ragRouter);
app.use('/workflow', workflowRouter);
app.use('/api/workflow', workflowRouter);

// Health check - try both paths
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cloudilic backend is running', path: req.path });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cloudilic backend is running', path: req.path });
});

// Root path handler
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url
  });
});

// Export for Vercel serverless
export default app;
