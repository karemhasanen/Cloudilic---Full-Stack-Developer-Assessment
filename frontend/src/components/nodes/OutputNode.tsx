import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

export const OutputNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <div className="node output-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">💬</span>
        <span className="node-title">Output</span>
        {data.contextSources > 1 && (
          <span className="multi-source-badge" title="Multi-document processing">
            📚 {data.contextSources}
          </span>
        )}
      </div>
      <div className="node-content">
        {data.query && (
          <div className="output-query">
            <strong>Query:</strong> {data.query}
          </div>
        )}
        {data.steps && data.steps.length > 1 && (
          <div className="execution-steps">
            <strong>Execution Steps:</strong> {data.steps.length} steps processed
          </div>
        )}
        <div className="output-response">
          {data.response ? (
            <div className="response-text">{data.response}</div>
          ) : (
            <div className="response-placeholder">
              Run the workflow to see AI response here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

