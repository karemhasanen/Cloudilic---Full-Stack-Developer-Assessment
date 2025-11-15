import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

export const InputNode: React.FC<NodeProps> = ({ id, data }) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (data.onDataChange) {
        data.onDataChange({ text: event.target.value });
      }
    },
    [data]
  );

  return (
    <div className="node input-node">
      <Handle type="source" position={Position.Right} />
      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">Input</span>
      </div>
      <div className="node-content">
        <textarea
          className="node-textarea"
          placeholder="Enter your question or prompt here..."
          value={data.text || ''}
          onChange={handleChange}
          rows={4}
        />
      </div>
    </div>
  );
};

