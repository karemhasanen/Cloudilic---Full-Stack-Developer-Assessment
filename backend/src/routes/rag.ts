import express, { Request, Response } from 'express';
import { RAGService } from '../services/ragService';

const router = express.Router();

// Search endpoint
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, documentId, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const ragService = new RAGService();
    const results = await ragService.search(query, documentId, topK);

    res.json({
      success: true,
      results,
      query,
    });
  } catch (error: any) {
    console.error('RAG search error:', error);
    res.status(500).json({ error: error.message || 'Failed to perform search' });
  }
});

// Generate response endpoint
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { query, context, documentId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const ragService = new RAGService();
    const response = await ragService.generateResponse(query, context, documentId);

    res.json({
      success: true,
      response,
      query,
    });
  } catch (error: any) {
    console.error('RAG generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

export { router as ragRouter };

