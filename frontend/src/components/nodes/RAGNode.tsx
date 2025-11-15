import React, { useCallback, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import axios from 'axios';
import './NodeStyles.css';

export const RAGNode: React.FC<NodeProps> = ({ id, data }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }

      setUploading(true);
      setUploadStatus('Uploading...');

      try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await axios.post('/api/pdf/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setUploadStatus(`✓ PDF processed (${response.data.chunks} chunks)`);
          if (data.onDataChange) {
            data.onDataChange({
              documentId: response.data.documentId,
              fileName: file.name,
            });
          }
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        // Better error handling to avoid "[object Object]"
        let errorMessage = 'Failed to upload PDF';
        if (error.response?.data?.error) {
          errorMessage = typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : JSON.stringify(error.response.data.error);
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString();
        }
        setUploadStatus(`Error: ${errorMessage}`);
      } finally {
        setUploading(false);
      }
    },
    [id, data]
  );

  return (
    <div className="node rag-node">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="node-header">
        <span className="node-icon">📄</span>
        <span className="node-title">RAG</span>
      </div>
      <div className="node-content">
        <div className="upload-area">
          <input
            type="file"
            id={`rag-upload-${id}`}
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label
            htmlFor={`rag-upload-${id}`}
            className={`upload-button ${uploading ? 'uploading' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </label>
          {data.fileName && (
            <div className="file-name">📎 {data.fileName}</div>
          )}
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.startsWith('✓') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

