import React, { useState, useRef } from 'react';
import { api } from '../services/api.js';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      validateAndSetFiles(filesArr);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files);
      validateAndSetFiles(filesArr);
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const validFiles: File[] = [];

    for (const f of files) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError(`File "${f.name}" has an unsupported format. Supported: PDF, DOCX, TXT.`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 25MB limit.`);
        return;
      }
      validFiles.push(f);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one requirement document.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadStep('Validating and uploading files...');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      setUploadStep('Extracting structured requirements...');
      const response = await api.documents.upload(formData);
      setSuccessMsg(`Successfully extracted requirements from ${response.documents.length} document(s)!`);
      setSelectedFiles([]);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        setSuccessMsg(null);
        setIsUploading(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and process documents.');
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '600px', padding: '0' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(23, 32, 51, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                Upload Requirement Documents
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Supported: PDF, DOCX, TXT, MD (Max 25MB each)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f87171',
              fontSize: '13px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#34d399',
              fontSize: '13px'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-indigo)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Upload size={22} color="#818cf8" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
              Drag & drop requirement files here, or <span style={{ color: '#818cf8' }}>browse</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Upload SRS, BRD, FRD, PRD specifications to extract requirements
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Files Queued for Extraction ({selectedFiles.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#38bdf8" />
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{file.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Loader2 size={18} color="#818cf8" className="pulse-indicator" style={{ animation: 'spin 1s linear infinite' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>
                  {uploadStep}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  State: Uploaded &rarr; Extracting &rarr; Indexing
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(17, 24, 39, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button onClick={onClose} disabled={isUploading} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={isUploading || selectedFiles.length === 0}
            className="btn btn-primary"
          >
            {isUploading ? 'Extracting...' : `Process & Extract (${selectedFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
