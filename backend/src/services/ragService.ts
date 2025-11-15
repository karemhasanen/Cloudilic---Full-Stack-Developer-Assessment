import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { VectorStore } from './vectorStore';
import { MemoryService } from './memoryService';

dotenv.config();

export class RAGService {
  private openai: OpenAI;
  private openaiClient: OpenAI | null = null;
  private openRouterClient: OpenAI | null = null;
  private vectorStore: VectorStore;
  private memoryService: MemoryService;

  constructor() {
    // Support both OpenAI and OpenRouter, with OpenAI as preferred
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    
    if (!openaiKey && !openRouterKey) {
      throw new Error('Either OPENAI_API_KEY or OPENROUTER_API_KEY must be set in environment variables');
    }
    
    // Initialize OpenAI client if available
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
      this.openai = this.openaiClient; // Default to OpenAI
    }
    
    // Initialize OpenRouter client if available
    if (openRouterKey) {
      this.openRouterClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/cloudilic/workflow-builder',
          'X-Title': 'Cloudilic Workflow Builder',
        },
      });
      
      // If no OpenAI, use OpenRouter as primary
      if (!this.openaiClient) {
        this.openai = this.openRouterClient;
      }
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

      // Determine model and which client to use
      let model = process.env.CHAT_MODEL || 'gpt-3.5-turbo';
      let client = this.openaiClient || this.openRouterClient;
      let originalError: any = null;
      
      if (!client) {
        throw new Error('No API client available for chat generation');
      }

      // Get max_tokens from env or use safe default
      let maxTokens = 4096; // Maximum for longest responses
      if (process.env.MAX_TOKENS) {
        maxTokens = parseInt(process.env.MAX_TOKENS, 10);
      } else if (this.openaiClient && !this.openRouterClient) {
        maxTokens = 4096; // OpenAI only - gpt-3.5-turbo supports up to 4096
      } else if (this.openRouterClient && !this.openaiClient) {
        maxTokens = 3000; // OpenRouter only - increased for better output
      }
      
      // Ensure we don't exceed model limits (gpt-3.5-turbo max is 4096)
      // But allow higher values for other models
      if (maxTokens > 4096) {
        console.warn(`MAX_TOKENS (${maxTokens}) exceeds gpt-3.5-turbo limit (4096). Using 4096.`);
        maxTokens = 4096;
      }
      if (maxTokens < 50) maxTokens = 50;

      // Try OpenAI first if available
      if (this.openaiClient) {
        try {
          const response = await this.openaiClient.chat.completions.create({
            model,
            messages,
            temperature: 0.7,
            max_tokens: maxTokens,
          });
          return response.choices[0]?.message?.content || 'No response generated';
        } catch (error: any) {
          originalError = error;
          const errorMsg = error.message || 'Unknown error';
          
          // If we have OpenRouter available, try fallback
          if (this.openRouterClient) {
            console.log(`OpenAI chat failed (${errorMsg}), trying OpenRouter fallback...`);
            // Format model for OpenRouter
            if (!model.includes('/')) {
              model = `openai/${model}`;
            }
            client = this.openRouterClient;
          } else {
            // No fallback, throw the error
            throw error;
          }
        }
      } else {
        // Using OpenRouter only, format model name
        if (!model.includes('/')) {
          if (!model.startsWith('openai/') && !model.startsWith('anthropic/') && !model.startsWith('google/')) {
            model = `openai/${model}`;
          }
        }
      }

      // Use OpenRouter (either as primary or fallback)
      if (client) {
        const response = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        });
        
        if (originalError) {
          console.log('Successfully using OpenRouter for chat (OpenAI fallback)');
        }
        
        const responseText = response.choices[0]?.message?.content || 'No response generated';

        // Store in memory if workflowId is provided
        if (workflowId) {
          this.memoryService.addMessage(workflowId, 'user', query);
          this.memoryService.addMessage(workflowId, 'assistant', responseText);
        }

        return responseText;
      }
      
      throw new Error('No API client available for chat generation');
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      
      // Handle OpenRouter credit errors
      if (errorMsg.includes('402') || errorMsg.includes('credits') || errorMsg.includes('afford')) {
        // Extract the affordable token count from error message if available
        const affordMatch = errorMsg.match(/can only afford (\d+)/);
        const affordableTokens = affordMatch ? parseInt(affordMatch[1], 10) : null;
        
        let suggestion = '';
        if (affordableTokens) {
          // Suggest 70% of affordable tokens to account for input tokens
          const suggestedMax = Math.floor(affordableTokens * 0.7);
          suggestion = `You can afford ${affordableTokens} total tokens. ` +
            `Set MAX_TOKENS=${suggestedMax} (or lower like ${suggestedMax - 50}) to account for input tokens. `;
        } else {
          suggestion = `Reduce MAX_TOKENS in .env file (currently set to ${process.env.MAX_TOKENS || '600'}). ` +
            `Try setting MAX_TOKENS=400, 500, or 550. `;
        }
        
        throw new Error(
          `OpenRouter credit limit exceeded. ` +
          suggestion +
          `Or add credits at https://openrouter.ai/settings/credits\n` +
          `Original error: ${errorMsg}`
        );
      }
      
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

