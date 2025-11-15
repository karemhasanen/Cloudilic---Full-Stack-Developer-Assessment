import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useWorkflowExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const workflowIdRef = useRef<string | null>(null);

  const executeWorkflow = useCallback(
    async (nodes: any[], edges: any[], nodeData: Record<string, any>) => {
      setIsExecuting(true);
      try {
        const response = await axios.post('/api/workflow/execute', {
          nodes,
          edges,
          nodeData,
          workflowId: workflowIdRef.current, // Include workflow ID for memory
        });

        // Store workflow ID for future requests (enables conversation memory)
        if (response.data.result?.sessionId) {
          workflowIdRef.current = response.data.result.sessionId;
        }

        return response.data.result;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || error.message || 'Failed to execute workflow'
        );
      } finally {
        setIsExecuting(false);
      }
    },
    []
  );

  const clearMemory = useCallback(async () => {
    if (!workflowIdRef.current) return;
    
    try {
      await axios.post('/api/workflow/clear-memory', {
        workflowId: workflowIdRef.current,
      });
      workflowIdRef.current = null;
    } catch (error: any) {
      console.error('Failed to clear memory:', error);
    }
  }, []);

  return { executeWorkflow, isExecuting, clearMemory, workflowId: workflowIdRef.current };
};

