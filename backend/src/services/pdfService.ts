import pdfParse from 'pdf-parse';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { VectorStore } from './vectorStore';

export interface PDFProcessResult {
  documentId: string;
  text: string;
  chunks: string[];
}

export class PDFService {
  private vectorStore: VectorStore;

  constructor() {
    this.vectorStore = VectorStore.getInstance();
  }

  async processPDF(filePath: string): Promise<PDFProcessResult> {
    try {
      // Read and parse PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        throw new Error('PDF contains no extractable text');
      }

      // Split text into chunks
      const chunks = this.splitIntoChunks(text);

      // Generate document ID
      const documentId = uuidv4();

      // Store chunks in vector store
      await this.vectorStore.addDocument(documentId, chunks);

      return {
        documentId,
        text,
        chunks,
      };
    } catch (error: any) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  private splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+\s+/);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Add overlap by keeping last part of previous chunk
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }
}

