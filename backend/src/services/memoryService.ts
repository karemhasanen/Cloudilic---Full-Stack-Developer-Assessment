interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ConversationSession {
  sessionId: string;
  documentId?: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastAccessed: number;
}

export class MemoryService {
  private static instance: MemoryService;
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly MAX_SESSIONS = 100;
  private readonly MAX_MESSAGES_PER_SESSION = 20;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Get or create a session for a workflow
   */
  getSession(workflowId: string, documentId?: string): ConversationSession {
    let session = this.sessions.get(workflowId);

    if (!session) {
      session = {
        sessionId: workflowId,
        documentId,
        messages: [],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
      };
      this.sessions.set(workflowId, session);
      this.cleanupOldSessions();
    } else {
      session.lastAccessed = Date.now();
      if (documentId && !session.documentId) {
        session.documentId = documentId;
      }
    }

    return session;
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(
    workflowId: string,
    role: 'user' | 'assistant',
    content: string
  ): void {
    const session = this.getSession(workflowId);
    
    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Keep only the last N messages
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
    }

    session.lastAccessed = Date.now();
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(workflowId: string, maxMessages: number = 5): ConversationMessage[] {
    const session = this.sessions.get(workflowId);
    if (!session || session.messages.length === 0) {
      return [];
    }

    // Return last N messages (excluding the current one)
    return session.messages.slice(-maxMessages - 1, -1);
  }

  /**
   * Get all messages for a session
   */
  getAllMessages(workflowId: string): ConversationMessage[] {
    const session = this.sessions.get(workflowId);
    return session ? session.messages : [];
  }

  /**
   * Clear session history
   */
  clearSession(workflowId: string): void {
    this.sessions.delete(workflowId);
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions(): void {
    if (this.sessions.size <= this.MAX_SESSIONS) {
      return;
    }

    const now = Date.now();
    const sessionsToDelete: string[] = [];

    // Remove expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > this.SESSION_TIMEOUT) {
        sessionsToDelete.push(sessionId);
      }
    }

    // If still too many, remove oldest
    if (this.sessions.size - sessionsToDelete.length > this.MAX_SESSIONS) {
      const sortedSessions = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = sortedSessions
        .slice(0, this.sessions.size - this.MAX_SESSIONS)
        .map(([id]) => id);
      
      sessionsToDelete.push(...toRemove);
    }

    sessionsToDelete.forEach((id) => this.sessions.delete(id));
  }

  /**
   * Get session summary for context
   */
  getSessionSummary(workflowId: string): string {
    const session = this.sessions.get(workflowId);
    if (!session || session.messages.length === 0) {
      return '';
    }

    const recentMessages = session.messages.slice(-3);
    return recentMessages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 100)}...`)
      .join('\n');
  }
}

