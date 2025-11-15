import { RAGService } from './ragService';
import { MemoryService } from './memoryService';

interface Node {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface NodeData {
  [nodeId: string]: any;
}

interface WorkflowStep {
  nodeId: string;
  nodeType: string;
  documentId?: string;
  query?: string;
  result?: any;
}

export class WorkflowService {
  private ragService: RAGService;
  private memoryService: MemoryService;

  constructor() {
    this.ragService = new RAGService();
    this.memoryService = MemoryService.getInstance();
  }

  /**
   * Execute workflow with multi-step orchestration
   */
  async executeWorkflow(
    nodes: Node[],
    edges: Edge[],
    nodeData: NodeData,
    workflowId?: string
  ): Promise<any> {
    try {
      // Generate workflow ID if not provided
      const sessionId = workflowId || `workflow-${Date.now()}`;

      // Build execution graph
      const executionOrder = this.buildExecutionOrder(nodes, edges);
      
      if (executionOrder.length === 0) {
        throw new Error('No valid execution path found. Ensure nodes are properly connected.');
      }

      // Execute steps sequentially
      const steps: WorkflowStep[] = [];
      let currentQuery = '';
      let aggregatedContext: Array<{ text: string; score: number }> = [];
      let allDocumentIds: string[] = [];

      for (const stepNodes of executionOrder) {
        for (const node of stepNodes) {
          if (node.type === 'input') {
            currentQuery = nodeData[node.id]?.text || node.data?.text || '';
            if (!currentQuery) {
              throw new Error('No query provided in input node');
            }
            steps.push({
              nodeId: node.id,
              nodeType: 'input',
              query: currentQuery,
            });
          } else if (node.type === 'rag') {
            const documentId = nodeData[node.id]?.documentId || node.data?.documentId;
            if (!documentId) {
              throw new Error(`No document ID found in RAG node ${node.id}. Please upload a PDF first.`);
            }

            // Perform semantic search with increased context
            const maxChunks = parseInt(process.env.MAX_CONTEXT_CHUNKS || '5', 10);
            const context = await this.ragService.search(currentQuery, documentId, maxChunks);
            aggregatedContext.push(...context);
            allDocumentIds.push(documentId);

            steps.push({
              nodeId: node.id,
              nodeType: 'rag',
              documentId,
              result: {
                contextCount: context.length,
                topScore: context[0]?.score || 0,
              },
            });
          }
        }
      }

      // Get conversation history for context
      const maxHistoryMessages = parseInt(process.env.MAX_HISTORY_MESSAGES || '5', 10);
      const historyMessages = this.memoryService.getConversationHistory(sessionId, maxHistoryMessages);
      // Convert to format expected by RAG service (filter out system messages)
      const conversationHistory = historyMessages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      // Generate final response using all contexts
      // Use the first document ID for memory, but aggregate all contexts
      const primaryDocumentId = allDocumentIds[0];
      
      // Remove duplicates and sort by score
      const uniqueContext = this.deduplicateContext(aggregatedContext);

      // Limit total context chunks to save input tokens
      const maxTotalChunks = parseInt(process.env.MAX_TOTAL_CONTEXT_CHUNKS || '3', 10);
      const response = await this.ragService.generateResponse(
        currentQuery,
        uniqueContext.slice(0, maxTotalChunks), // Limit total chunks
        primaryDocumentId,
        sessionId,
        conversationHistory
      );

      // Find output node
      const outputNode = nodes.find((n) => n.type === 'output');
      if (!outputNode) {
        throw new Error('Output node not found');
      }

      return {
        query: currentQuery,
        response,
        context: uniqueContext.slice(0, 5).map((c) => c.text),
        contextSources: allDocumentIds.length,
        steps: steps.map((s) => ({
          nodeId: s.nodeId,
          type: s.nodeType,
          hasResult: !!s.result,
        })),
        outputNodeId: outputNode.id,
        sessionId,
      };
    } catch (error: any) {
      throw new Error(`Workflow execution failed: ${error.message}`);
    }
  }

  /**
   * Build execution order based on node connections (multi-step orchestration)
   */
  private buildExecutionOrder(nodes: Node[], edges: Edge[]): Node[][] {
    // Create adjacency map
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, Node>();

    nodes.forEach((node) => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
      nodeMap.set(node.id, node);
    });

    edges.forEach((edge) => {
      const sourceNodes = graph.get(edge.source) || [];
      sourceNodes.push(edge.target);
      graph.set(edge.source, sourceNodes);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Find starting nodes (nodes with no incoming edges)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const executionOrder: Node[][] = [];
    const processed = new Set<string>();

    while (queue.length > 0) {
      const level: Node[] = [];
      const currentLevelSize = queue.length;

      for (let i = 0; i < currentLevelSize; i++) {
        const nodeId = queue.shift()!;
        if (processed.has(nodeId)) continue;

        const node = nodeMap.get(nodeId);
        if (node) {
          level.push(node);
          processed.add(nodeId);

          // Add connected nodes to queue
          const connectedNodes = graph.get(nodeId) || [];
          connectedNodes.forEach((connectedId) => {
            const currentDegree = inDegree.get(connectedId) || 0;
            inDegree.set(connectedId, currentDegree - 1);
            
            if (inDegree.get(connectedId) === 0 && !processed.has(connectedId)) {
              queue.push(connectedId);
            }
          });
        }
      }

      if (level.length > 0) {
        executionOrder.push(level);
      }
    }

    return executionOrder;
  }

  /**
   * Deduplicate and sort context by relevance score
   */
  private deduplicateContext(
    context: Array<{ text: string; score: number }>
  ): Array<{ text: string; score: number }> {
    const seen = new Set<string>();
    const unique: Array<{ text: string; score: number }> = [];

    context
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .forEach((item) => {
        const textHash = item.text.substring(0, 100); // Use first 100 chars as hash
        if (!seen.has(textHash)) {
          seen.add(textHash);
          unique.push(item);
        }
      });

    return unique;
  }

  /**
   * Clear workflow memory
   */
  clearWorkflowMemory(workflowId: string): void {
    this.memoryService.clearSession(workflowId);
  }
}

