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

// Routes
// Note: In Vercel, api/index.ts receives full paths including /api
// So routes need to be mounted with /api prefix
app.use('/api/pdf', pdfRouter);
app.use('/api/rag', ragRouter);
app.use('/api/workflow', workflowRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cloudilic backend is running' });
});

// Root path handler
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Export for Vercel serverless
export default app;
