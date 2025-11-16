import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

interface DocumentChunk {
  text: string;
  embedding: number[];
}

interface Document {
  id: string;
  chunks: DocumentChunk[];
}

export class VectorStore {
  private static instance: VectorStore;
  private documents: Map<string, Document> = new Map();
  private openai!: OpenAI; // Will be initialized in constructor

  private geminiKey: string | undefined;
  private openaiKey: string | undefined;
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  private constructor() {
    // Store keys for potential fallback
    this.geminiKey = process.env.GEMINI_API_KEY?.trim();
    this.openaiKey = process.env.OPENAI_API_KEY?.trim();
    
    // Debug logging (only log key length, not the key itself)
    console.log('[VectorStore] Gemini key length:', this.geminiKey?.length || 0);
    console.log('[VectorStore] OpenAI key length:', this.openaiKey?.length || 0);
    
    // Validate at least one key is provided
    if (!this.geminiKey && !this.openaiKey) {
      throw new Error('At least one API key must be set: GEMINI_API_KEY or OPENAI_API_KEY');
    }
    
    // Initialize Gemini client if available (preferred for embeddings)
    if (this.geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(this.geminiKey);
    }
    
    // Warn if OpenAI key seems too short (OpenAI keys are typically 50-60 chars)
    if (this.openaiKey && this.openaiKey.length < 40) {
      console.warn(`[VectorStore] WARNING: OpenAI key seems too short (${this.openaiKey.length} chars). Expected 50-60 characters.`);
    }
    
    // Initialize OpenAI client if available (fallback for embeddings)
    if (this.openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: this.openaiKey });
      this.openai = this.openaiClient;
    } else if (this.geminiClient) {
      // Use Gemini only if no OpenAI available
      this.openai = null as any; // Will use Gemini for embeddings
    }
  }

  public static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  async addDocument(documentId: string, chunks: string[]): Promise<void> {
    try {
      // Generate embeddings for all chunks
      const embeddings = await this.generateEmbeddings(chunks);

      const documentChunks: DocumentChunk[] = chunks.map((text, index) => ({
        text,
        embedding: embeddings[index],
      }));

      this.documents.set(documentId, {
        id: documentId,
        chunks: documentChunks,
      });
    } catch (error: any) {
      throw new Error(`Failed to add document to vector store: ${error.message}`);
    }
  }

  async search(query: string, documentId: string, topK: number = 5): Promise<Array<{ text: string; score: number }>> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      // Generate embedding for query
      const queryEmbeddings = await this.generateEmbeddings([query]);
      const queryEmbedding = queryEmbeddings[0];

      // Calculate cosine similarity for each chunk
      const results = document.chunks.map((chunk) => {
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          text: chunk.text,
          score,
        };
      });

      // Sort by score and return top K
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (error: any) {
      throw new Error(`Failed to search vector store: ${error.message}`);
    }
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    let model = process.env.EMBEDDING_MODEL || 'text-embedding-004';
    let originalError: any = null;
    
    // Try Gemini first if available (preferred for embeddings)
    if (this.geminiClient) {
      try {
        // Remove 'models/' prefix if present
        const cleanModelName = model.replace(/^models\//, '');
        // Check if it's a Gemini embedding model
        const isGeminiEmbedding = cleanModelName.includes('embedding') || cleanModelName.includes('text-embedding');
        
        if (isGeminiEmbedding) {
          // Use the embedding model directly
          const embeddingModel = this.geminiClient.getGenerativeModel({ model: cleanModelName });
          
          // Generate embeddings for all texts
          const embeddingPromises = texts.map(async (text) => {
            try {
              // Use embedContent method - it accepts a string or content object
              const result = await embeddingModel.embedContent(text);
              
              // Handle different response formats
              if (result && result.embedding) {
                // Check if it has values property
                if (result.embedding.values && Array.isArray(result.embedding.values)) {
                  return result.embedding.values;
                }
                // Check if embedding is directly an array
                if (Array.isArray(result.embedding)) {
                  return result.embedding;
                }
              }
              
              // Try accessing the response directly
              const response = result as any;
              if (response.values && Array.isArray(response.values)) {
                return response.values;
              }
              
              throw new Error('Invalid embedding response format');
            } catch (embedError: any) {
              console.error(`[VectorStore] Gemini embedding error: ${embedError.message}`);
              throw embedError;
            }
          });
          
          const embeddings = await Promise.all(embeddingPromises);
          return embeddings;
        } else {
          // Not a Gemini embedding model, fall through to OpenAI
          console.log(`[VectorStore] Model ${cleanModelName} is not a Gemini embedding model, trying fallback...`);
        }
      } catch (error: any) {
        originalError = error;
        const errorMsg = error.message || 'Unknown error';
        console.log(`[VectorStore] Gemini embedding failed (${errorMsg}), trying fallback...`);
        
        // Fall through to OpenAI fallback
      }
    }
    
    // Try OpenAI if available
    if (this.openaiClient) {
      try {
        const response = await this.openaiClient.embeddings.create({
          model,
          input: texts,
        });
        return response.data.map((item: { embedding: number[] }) => item.embedding);
      } catch (error: any) {
        originalError = error;
        const errorMsg = error.message || 'Unknown error';
        
        // Log detailed error for debugging
        console.error('[VectorStore] OpenAI embedding error:', {
          message: errorMsg,
          status: error.status,
          keyLength: this.openaiKey?.length || 0,
          keyPrefix: this.openaiKey ? `${this.openaiKey.substring(0, 10)}...` : 'not set'
        });
        
        // No fallback available, throw the error
        if (errorMsg.includes('401') || errorMsg.includes('API key') || errorMsg.includes('Incorrect API key')) {
          const keyInfo = this.openaiKey 
            ? `Key length: ${this.openaiKey.length} chars (expected 50-60). Key prefix: ${this.openaiKey.substring(0, 10)}...`
            : 'Key not set';
          throw new Error(
            `OpenAI API authentication failed: ${errorMsg}. ${keyInfo}. ` +
            `Please check your OPENAI_API_KEY in environment variables. ` +
            `Make sure the key is complete (50-60 characters).`
          );
        } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('billing')) {
          throw new Error(
            `OpenAI API quota exceeded. ` +
            `Fix billing at https://platform.openai.com/account/billing. ` +
            `Error: ${errorMsg}`
          );
        }
        throw new Error(`Failed to generate embeddings with OpenAI: ${errorMsg}`);
      }
    }
    
    // If we got here and originalError exists, Gemini failed and no OpenAI fallback
    if (originalError) {
      throw new Error(`Gemini embedding failed and no OpenAI fallback available: ${originalError.message}`);
    }
    
    throw new Error('No API client available for embeddings');
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDocument(documentId: string): Document | undefined {
    return this.documents.get(documentId);
  }
}

