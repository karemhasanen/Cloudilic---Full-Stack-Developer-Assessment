import express, { Request, Response } from 'express';
import { WorkflowService } from '../services/workflowService';

const router = express.Router();

// Execute workflow endpoint
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { nodes, edges, nodeData, workflowId } = req.body;

    if (!nodes || !edges || !nodeData) {
      return res.status(400).json({ error: 'Invalid workflow data' });
    }

    const workflowService = new WorkflowService();
    const result = await workflowService.executeWorkflow(nodes, edges, nodeData, workflowId);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute workflow' });
  }
});

// Clear workflow memory endpoint
router.post('/clear-memory', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.body;

    if (!workflowId) {
      return res.status(400).json({ error: 'Workflow ID is required' });
    }

    const workflowService = new WorkflowService();
    workflowService.clearWorkflowMemory(workflowId);

    res.json({
      success: true,
      message: 'Workflow memory cleared',
    });
  } catch (error: any) {
    console.error('Clear memory error:', error);
    res.status(500).json({ error: error.message || 'Failed to clear memory' });
  }
});

export { router as workflowRouter };

