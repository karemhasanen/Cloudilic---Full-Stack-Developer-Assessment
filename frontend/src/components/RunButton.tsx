import React from 'react';
import './RunButton.css';

interface RunButtonProps {
  onRun: () => void;
  isExecuting: boolean;
}

export const RunButton: React.FC<RunButtonProps> = ({ onRun, isExecuting }) => {
  return (
    <div className="run-button-container">
      <button
        className="run-button"
        onClick={onRun}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <span className="spinner"></span>
            Running...
          </>
        ) : (
          <>
            ▶️ Run Workflow
          </>
        )}
      </button>
    </div>
  );
};

