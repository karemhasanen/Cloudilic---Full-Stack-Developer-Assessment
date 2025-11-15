import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  onAddNode: (type: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Workflow Nodes</h2>
      <p className="sidebar-subtitle">Drag nodes to canvas</p>
      
      <div className="node-list">
        <div
          className="node-item"
          draggable
          onDragStart={(e) => handleDragStart(e, 'input')}
          onClick={() => onAddNode('input')}
        >
          <div className="node-icon input-icon">📝</div>
          <div className="node-info">
            <div className="node-name">Input Node</div>
            <div className="node-description">Enter questions or prompts</div>
          </div>
        </div>

        <div
          className="node-item"
          draggable
          onDragStart={(e) => handleDragStart(e, 'rag')}
          onClick={() => onAddNode('rag')}
        >
          <div className="node-icon rag-icon">📄</div>
          <div className="node-info">
            <div className="node-name">RAG Node</div>
            <div className="node-description">Upload PDF for RAG</div>
          </div>
        </div>

        <div
          className="node-item"
          draggable
          onDragStart={(e) => handleDragStart(e, 'output')}
          onClick={() => onAddNode('output')}
        >
          <div className="node-icon output-icon">💬</div>
          <div className="node-info">
            <div className="node-name">Output Node</div>
            <div className="node-description">View AI responses</div>
          </div>
        </div>
      </div>
    </div>
  );
};

