import React, { useState } from 'react';
import { DocumentRecord } from '../types/index.js';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Database,
  ExternalLink,
  Search
} from 'lucide-react';

interface DocumentsProps {
  documents: DocumentRecord[];
  onOpenUpload: () => void;
  onDeleteDocument: (docId: string) => void;
  onViewRequirementsForDoc: (docId: string) => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Documents: React.FC<DocumentsProps> = ({
  documents,
  onOpenUpload,
  onDeleteDocument,
  onViewRequirementsForDoc,
  onSeedDemo,
  isSeeding
}) => {
  const [search, setSearch] = useState('');

  const filtered = documents.filter(d => 
    d.original_name.toLowerCase().includes(search.toLowerCase()) ||
    d.document_type.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} />
            <span>Extracted</span>
          </span>
        );
      case 'extracting':
      case 'analyzing':
        return (
          <span className="badge badge-medium">
            <Clock size={12} />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-critical">
            <AlertCircle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-low">
            <span>Uploaded</span>
          </span>
        );
    }
  };

  const getDocTypeBadge = (type: string) => {
    const t = type.toUpperCase();
    let bg = 'rgba(99, 102, 241, 0.15)';
    let color = '#818cf8';

    if (t.includes('SRS')) {
      bg = 'rgba(56, 189, 248, 0.15)';
      color = '#38bdf8';
    } else if (t.includes('BRD')) {
      bg = 'rgba(168, 85, 247, 0.15)';
      color = '#c084fc';
    } else if (t.includes('FRD')) {
      bg = 'rgba(16, 185, 129, 0.15)';
      color = '#34d399';
    }

    return (
      <span style={{
        background: bg,
        color: color,
        border: `1px solid ${color}33`,
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: 'var(--font-mono)'
      }}>
        {t}
      </span>
    );
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
            Specification & Requirement Documents
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
            Upload, inspect, and manage your SRS, BRD, and FRD documents.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="btn btn-secondary btn-sm"
          >
            <Database size={14} color="#c084fc" />
            <span>{isSeeding ? 'Loading...' : 'Load Sample Documents'}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="btn btn-primary btn-sm"
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search documents by name or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          Showing {filtered.length} of {documents.length} document(s)
        </div>
      </div>

      {/* Document Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>No documents uploaded yet</h3>
            <p style={{ fontSize: '13px', marginTop: '4px', maxWidth: '460px', margin: '4px auto 16px auto' }}>
              Upload your PDF, DOCX, or TXT requirement specifications, or load the pre-configured sample dataset.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={onSeedDemo} className="btn btn-secondary">
                <Database size={15} />
                <span>Load Sample Documents</span>
              </button>
              <button onClick={onOpenUpload} className="btn btn-primary">
                <Upload size={15} />
                <span>Upload New Document</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Extracted Reqs</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.document_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={16} color="#38bdf8" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '13.5px' }}>
                            {doc.original_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            ID: {doc.document_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getDocTypeBadge(doc.document_type)}</td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#38bdf8' }}>
                        {doc.requirement_count}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginLeft: '4px' }}>requirements</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {new Date(doc.upload_date).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => onViewRequirementsForDoc(doc.document_id)}
                          className="btn btn-secondary btn-sm"
                          title="Inspect Extracted Requirements"
                        >
                          <ExternalLink size={13} />
                          <span>View Reqs</span>
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.document_id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
