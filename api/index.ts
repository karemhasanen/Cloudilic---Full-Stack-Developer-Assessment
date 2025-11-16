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

// Debug endpoint to check environment variables (without exposing full keys)
app.get('/api/debug/env', (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  // Check for common issues
  const issues = [];
  if (!geminiKey && !openaiKey) {
    issues.push('No API keys set');
  } else {
    if (geminiKey) {
      if (geminiKey.length < 30) {
        issues.push(`Gemini key too short: ${geminiKey.length} chars (expected 39)`);
      }
      if (!geminiKey.startsWith('AIza')) {
        issues.push('Gemini key does not start with "AIza"');
      }
      if (geminiKey.includes('*') || geminiKey.includes(' ')) {
        issues.push('Gemini key contains invalid characters (asterisks or spaces)');
      }
    }
    if (openaiKey) {
      if (openaiKey.length < 40) {
        issues.push(`OpenAI key too short: ${openaiKey.length} chars (expected 50-60)`);
      }
      if (!openaiKey.startsWith('sk-')) {
        issues.push('OpenAI key does not start with "sk-"');
      }
      if (openaiKey.includes('*') || openaiKey.includes(' ')) {
        issues.push('OpenAI key contains invalid characters (asterisks or spaces)');
      }
    }
    // Warn if no embedding provider (but Gemini supports embeddings now)
    const embeddingModel = process.env.EMBEDDING_MODEL || '';
    const isGeminiEmbedding = embeddingModel.includes('embedding') || embeddingModel.includes('text-embedding');
    if (!openaiKey && !geminiKey) {
      issues.push('Warning: No API keys set. Need GEMINI_API_KEY or OPENAI_API_KEY');
    } else if (!openaiKey && !isGeminiEmbedding && geminiKey) {
      issues.push('Warning: Using OpenAI embedding model but no OPENAI_API_KEY set. Consider using Gemini embedding model (text-embedding-004)');
    }
  }
  
  res.json({
    hasGeminiKey: !!geminiKey,
    geminiKeyLength: geminiKey?.length || 0,
    geminiKeyPrefix: geminiKey ? `${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 4)}` : 'not set',
    hasOpenAIKey: !!openaiKey,
    openAIKeyLength: openaiKey?.length || 0,
    openAIKeyPrefix: openaiKey ? `${openaiKey.substring(0, 10)}...${openaiKey.substring(openaiKey.length - 4)}` : 'not set',
    openAIKeyStartsWith: openaiKey ? openaiKey.substring(0, 7) : 'not set',
    openAIKeyEndsWith: openaiKey ? openaiKey.substring(openaiKey.length - 4) : 'not set',
    embeddingModel: process.env.EMBEDDING_MODEL || 'not set',
    chatModel: process.env.CHAT_MODEL || 'not set',
    issues: issues.length > 0 ? issues : ['No issues detected'],
    vercelEnv: process.env.VERCEL ? 'true' : 'false',
  });
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
