import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFService } from '../services/pdfService';

const router = express.Router();

// Configure multer for file uploads
// Use /tmp for Vercel serverless functions, otherwise use uploads/
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const uploadDest = isVercel ? '/tmp' : path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists (only for local development)
if (!isVercel) {
  if (!fs.existsSync(uploadDest)) {
    fs.mkdirSync(uploadDest, { recursive: true });
  }
}

const upload = multer({
  dest: uploadDest,
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

// Multer error handling middleware
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// Upload PDF endpoint
router.post('/upload', upload.single('pdf'), handleMulterError, async (req: Request, res: Response) => {
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
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    // Ensure error message is always a string
    const errorMessage = error?.message || error?.toString() || 'Failed to process PDF';
    res.status(500).json({ error: errorMessage });
  }
});

export { router as pdfRouter };

