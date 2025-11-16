import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { VectorStore } from './vectorStore';
import { MemoryService } from './memoryService';

dotenv.config();

export class RAGService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;
  private vectorStore: VectorStore;
  private memoryService: MemoryService;

  constructor() {
    // Support Gemini and OpenAI
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!geminiKey && !openaiKey) {
      throw new Error('At least one API key must be set: GEMINI_API_KEY or OPENAI_API_KEY');
    }
    
    // Initialize Gemini client if available (preferred for chat)
    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
    }
    
    // Initialize OpenAI client if available (for fallback)
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
    
    this.vectorStore = VectorStore.getInstance();
    this.memoryService = MemoryService.getInstance();
  }

  async search(query: string, documentId: string, topK: number = 5): Promise<Array<{ text: string; score: number }>> {
    return await this.vectorStore.search(query, documentId, topK);
  }

  async generateResponse(
    query: string,
    context?: Array<{ text: string; score: number }>,
    documentId?: string,
    workflowId?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      // If documentId is provided but no context, perform search first
      let finalContext = context;
      if (documentId && !context) {
        const searchResults = await this.search(query, documentId, 5);
        finalContext = searchResults;
      }

      // Get conversation history if workflowId is provided
      let history = conversationHistory;
      if (workflowId && !history) {
        const maxHistory = parseInt(process.env.MAX_HISTORY_MESSAGES || '5', 10);
        const historyMessages = this.memoryService.getConversationHistory(workflowId, maxHistory);
        history = historyMessages
          .filter((msg) => msg.role !== 'system') // Filter out system messages
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content.substring(0, 500), // Increased from 200 to 500 chars per message
          }));
      } else if (history) {
        // Truncate provided history
        history = history.map((msg) => ({
          role: msg.role,
          content: msg.content.substring(0, 500), // Increased from 200 to 500 chars per message
        }));
      }

      // Smart prompt design with chain-of-thought reasoning
      const systemPrompt = this.buildSystemPrompt(finalContext, history);
      const userPrompt = this.buildUserPrompt(query, finalContext, history);

      // Build messages array with conversation history
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history
      if (history && history.length > 0) {
        history.forEach((msg) => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          });
        });
      }

      // Add current query
      messages.push({ role: 'user', content: userPrompt });

      // Try Gemini first if available (preferred)
      if (this.geminiClient) {
        try {
          // Use valid Gemini model names
          const modelName = process.env.CHAT_MODEL || 'gemini-2.5-flash';
          // Remove 'models/' prefix if present (Gemini SDK handles it)
          const cleanModelName = modelName.replace(/^models\//, '');
          
          // Get max output tokens
          let maxOutputTokens = 4096;
          if (process.env.MAX_TOKENS) {
            maxOutputTokens = parseInt(process.env.MAX_TOKENS, 10);
          }
          if (maxOutputTokens < 50) maxOutputTokens = 50;
          if (maxOutputTokens > 8192) maxOutputTokens = 8192; // Gemini limit
          
          // Configure model with generation settings
          const model = this.geminiClient.getGenerativeModel({ 
            model: cleanModelName,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: maxOutputTokens,
            },
          });
          
          // Convert messages to Gemini format
          // Gemini doesn't support system messages directly, so we'll prepend it to the first user message
          let geminiPrompt = '';
          const systemMessage = messages.find(m => m.role === 'system');
          const conversationMessages = messages.filter(m => m.role !== 'system');
          
          if (systemMessage) {
            geminiPrompt += `${systemMessage.content}\n\n`;
          }
          
          // Build conversation history for Gemini
          conversationMessages.forEach((msg) => {
            if (msg.role === 'user') {
              geminiPrompt += `User: ${msg.content}\n\n`;
            } else if (msg.role === 'assistant') {
              geminiPrompt += `Assistant: ${msg.content}\n\n`;
            }
          });
          
          const result = await model.generateContent(geminiPrompt);
          
          const responseText = result.response.text() || 'No response generated';

          // Store in memory if workflowId is provided
          if (workflowId) {
            this.memoryService.addMessage(workflowId, 'user', query);
            this.memoryService.addMessage(workflowId, 'assistant', responseText);
          }

          return responseText;
        } catch (error: any) {
          const errorMsg = error.message || 'Unknown error';
          console.log(`Gemini chat failed (${errorMsg}), trying fallback...`);
          
          // Fallback to OpenAI if available
          if (this.openaiClient) {
            // Continue to fallback logic below
          } else {
            throw new Error(`Gemini API failed: ${errorMsg}`);
          }
        }
      }

      // Fallback to OpenAI if Gemini not available or failed
      // If CHAT_MODEL is a Gemini model, use OpenAI default instead
      let chatModel = process.env.CHAT_MODEL || 'gpt-3.5-turbo';
      const isGeminiModel = chatModel.includes('gemini') || chatModel.startsWith('models/gemini');
      let model = isGeminiModel ? 'gpt-3.5-turbo' : chatModel;
      
      if (!this.openaiClient) {
        throw new Error('No API client available for chat generation');
      }

      // Get max_tokens from env or use safe default
      let maxTokens = 4096;
      if (process.env.MAX_TOKENS) {
        maxTokens = parseInt(process.env.MAX_TOKENS, 10);
      }
      
      if (maxTokens > 4096) {
        console.warn(`MAX_TOKENS (${maxTokens}) exceeds gpt-3.5-turbo limit (4096). Using 4096.`);
        maxTokens = 4096;
      }
      if (maxTokens < 50) maxTokens = 50;

      // Use OpenAI as fallback
      const response = await this.openaiClient.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      });
      
      const responseText = response.choices[0]?.message?.content || 'No response generated';

      // Store in memory if workflowId is provided
      if (workflowId) {
        this.memoryService.addMessage(workflowId, 'user', query);
        this.memoryService.addMessage(workflowId, 'assistant', responseText);
      }

      return responseText;
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      throw new Error(`Failed to generate response: ${errorMsg}`);
    }
  }

  /**
   * Build enhanced system prompt with smart design
   */
  private buildSystemPrompt(
    context?: Array<{ text: string; score: number }>,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    // System prompt encourages detailed, comprehensive responses
    return `You are a helpful assistant that provides detailed, comprehensive answers based on the provided document context. 
    
When answering questions:
- Provide thorough, detailed explanations
- Include relevant examples and details from the context
- Explain concepts fully and clearly
- Use the document context extensively to support your answers
- If information isn't in the context, clearly state that and provide what you can based on general knowledge

Aim for comprehensive, well-explained responses that fully address the user's question.`;
  }

  /**
   * Build enhanced user prompt with context and reasoning structure
   */
  private buildUserPrompt(
    query: string,
    context?: Array<{ text: string; score: number }>,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    let prompt = '';

    // Add context if available - truncate each chunk to save tokens
    if (context && context.length > 0) {
      prompt += `## Document Context\n\n`;
      const maxChunkLength = parseInt(process.env.MAX_CHUNK_LENGTH || '600', 10);
      context.forEach((item, index) => {
        const truncatedText = item.text.length > maxChunkLength 
          ? item.text.substring(0, maxChunkLength) + '...' 
          : item.text;
        prompt += `[Excerpt ${index + 1}]:\n${truncatedText}\n\n`;
      });
    }

    // Add conversation history summary if available - keep it minimal
    if (history && history.length > 0) {
      prompt += `## Previous Context\n\n`;
      history.forEach((msg) => {
        const role = msg.role === 'user' ? 'Q' : 'A';
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add the current question - simplified prompt
    prompt += `## Question\n${query}\n\n`;
    prompt += `## Answer\n`;
    
    if (context && context.length > 0) {
      prompt += `Use the document context above. `;
    }

    return prompt;
  }
}

