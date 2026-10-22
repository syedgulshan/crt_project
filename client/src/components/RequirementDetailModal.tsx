import React from 'react';
import { RequirementRecord } from '../types/index.js';
import { X, FileText, Layers, Tag, ShieldAlert } from 'lucide-react';

interface RequirementDetailModalProps {
  requirement: RequirementRecord | null;
  onClose: () => void;
}

export const RequirementDetailModal: React.FC<RequirementDetailModalProps> = ({
  requirement,
  onClose
}) => {
  if (!requirement) return null;

  let parsedMetadata: any = {};
  try {
    parsedMetadata = typeof requirement.metadata === 'string' 
      ? JSON.parse(requirement.metadata) 
      : requirement.metadata || {};
  } catch (e) {
    parsedMetadata = {};
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', padding: '0' }}
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
            <span className="ref-tag" style={{ fontSize: '14px', padding: '4px 10px' }}>
              {requirement.reference_code}
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              Requirement Traceability Record
            </h3>
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

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Original Unmodified Requirement Text */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Original Unmodified Requirement Statement
            </div>
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '14.5px',
              color: '#f8fafc',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              "{requirement.requirement_text}"
            </div>
          </div>

          {/* Traceability Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
                Source Document
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} />
                <span>{requirement.document_name || 'N/A'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
                Document Section
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} />
                <span>{requirement.section || 'General'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
                Page Reference
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginTop: '4px' }}>
                {requirement.page_number !== null && requirement.page_number !== undefined 
                  ? `Page ${requirement.page_number}` 
                  : 'N/A (Derived from text stream)'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
                Classification & Priority
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  {requirement.requirement_type}
                </span>
                {requirement.priority && (
                  <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                    {requirement.priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Extracted Metadata & RFC 2119 terms */}
          {Object.keys(parsedMetadata).length > 0 && (
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={13} />
                <span>Extracted Semantic Attributes</span>
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: '#94a3b8',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(parsedMetadata, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(17, 24, 39, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
