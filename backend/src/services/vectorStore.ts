import { OpenAI } from 'openai';
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

  private openaiKey: string | undefined;
  private openRouterKey: string | undefined;
  private useOpenRouter: boolean = false;
  private openaiClient: OpenAI | null = null;
  private openRouterClient: OpenAI | null = null;

  private constructor() {
    // Store keys for potential fallback
    this.openaiKey = process.env.OPENAI_API_KEY?.trim();
    this.openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    
    // Debug logging (only log key length, not the key itself)
    console.log('[VectorStore] OpenAI key length:', this.openaiKey?.length || 0);
    console.log('[VectorStore] OpenRouter key length:', this.openRouterKey?.length || 0);
    
    // Validate at least one key is provided
    if (!this.openaiKey && !this.openRouterKey) {
      throw new Error('Either OPENAI_API_KEY or OPENROUTER_API_KEY must be set in environment variables');
    }
    
    // Warn if key seems too short (OpenAI keys are typically 50-60 chars)
    if (this.openaiKey && this.openaiKey.length < 40) {
      console.warn(`[VectorStore] WARNING: OpenAI key seems too short (${this.openaiKey.length} chars). Expected 50-60 characters.`);
    }
    
    // Check if we should force OpenRouter
    const forceOpenRouter = process.env.USE_OPENROUTER_FOR_EMBEDDINGS === 'true';
    
    if (forceOpenRouter && this.openRouterKey) {
      // Force OpenRouter for embeddings
      this.useOpenRouter = true;
      this.initializeOpenRouter();
    } else if (this.openaiKey) {
      // Initialize OpenAI client (preferred)
      this.openaiClient = new OpenAI({ apiKey: this.openaiKey });
      this.openai = this.openaiClient;
      
      // Also initialize OpenRouter client if available for fallback
      if (this.openRouterKey) {
        this.initializeOpenRouterClient();
      }
    } else if (this.openRouterKey) {
      // Use OpenRouter if OpenAI key not available
      this.useOpenRouter = true;
      this.initializeOpenRouter();
    }
  }

  private initializeOpenRouter() {
    if (!this.openRouterKey) {
      throw new Error('OpenRouter API key not available');
    }
    this.openRouterClient = new OpenAI({
      apiKey: this.openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/cloudilic/workflow-builder',
        'X-Title': 'Cloudilic Workflow Builder',
      },
    });
    this.openai = this.openRouterClient;
  }

  private initializeOpenRouterClient() {
    if (!this.openRouterKey) {
      return;
    }
    this.openRouterClient = new OpenAI({
      apiKey: this.openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/cloudilic/workflow-builder',
        'X-Title': 'Cloudilic Workflow Builder',
      },
    });
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
    let model = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
    let originalError: any = null;
    
    // Try OpenAI first if available and not forced to use OpenRouter
    if (this.openaiClient && !this.useOpenRouter) {
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
        
        // If we have OpenRouter available, try fallback
        if (this.openRouterClient) {
          console.log(`OpenAI embedding failed (${errorMsg}), trying OpenRouter fallback...`);
        } else {
          // No fallback available, throw the error
          if (errorMsg.includes('401') || errorMsg.includes('API key') || errorMsg.includes('Incorrect API key')) {
            const keyInfo = this.openaiKey 
              ? `Key length: ${this.openaiKey.length} chars (expected 50-60). Key prefix: ${this.openaiKey.substring(0, 10)}...`
              : 'Key not set';
            throw new Error(
              `OpenAI API authentication failed: ${errorMsg}. ${keyInfo}. ` +
              `Please check your OPENAI_API_KEY in Vercel environment variables. ` +
              `Make sure the key is complete (50-60 characters) and set for Production environment.`
            );
          } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('billing')) {
            throw new Error(
              `OpenAI API quota exceeded. ` +
              `Add OPENROUTER_API_KEY to your .env for automatic fallback, ` +
              `or fix billing at https://platform.openai.com/account/billing. ` +
              `Error: ${errorMsg}`
            );
          }
          throw new Error(`Failed to generate embeddings with OpenAI: ${errorMsg}`);
        }
      }
    }
    
    // Use OpenRouter (either as primary or fallback)
    if (this.openRouterClient || this.openai) {
      try {
        const client = this.openRouterClient || this.openai;
        if (!client) {
          throw new Error('No API client available');
        }
        
        // Format model name with provider prefix for OpenRouter
        let openRouterModel = model;
        if (!openRouterModel.includes('/')) {
          openRouterModel = `openai/${openRouterModel}`;
        }
        
        const response = await client.embeddings.create({
          model: openRouterModel,
          input: texts,
        });

        if (originalError) {
          console.log('Successfully using OpenRouter for embeddings (OpenAI fallback)');
        }
        return response.data.map((item: { embedding: number[] }) => item.embedding);
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        
        if (originalError) {
          // Both failed
          throw new Error(
            `Both OpenAI and OpenRouter failed.\n` +
            `OpenAI error: ${originalError.message}\n` +
            `OpenRouter error: ${errorMsg}`
          );
        } else {
          // OpenRouter failed (and no OpenAI to fallback to)
          throw new Error(`Failed to generate embeddings with OpenRouter: ${errorMsg}`);
        }
      }
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

