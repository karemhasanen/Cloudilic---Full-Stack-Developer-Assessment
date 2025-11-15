import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFService } from '../services/pdfService';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload PDF endpoint
router.post('/upload', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfService = new PDFService();
    const result = await pdfService.processPDF(req.file.path);

    // Clean up uploaded file after processing
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      documentId: result.documentId,
      text: result.text,
      chunks: result.chunks.length,
      message: 'PDF processed successfully',
    });
  } catch (error: any) {
    console.error('PDF upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  }
});

export { router as pdfRouter };

