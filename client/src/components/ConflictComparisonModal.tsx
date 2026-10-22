import React from 'react';
import { ConflictRecord } from '../types/index.js';
import { X, AlertTriangle, ArrowRightLeft, FileText, CheckCircle2, Lightbulb } from 'lucide-react';

interface ConflictComparisonModalProps {
  conflict: ConflictRecord | null;
  onClose: () => void;
  onSelectRequirement?: (reqId: string) => void;
}

export const ConflictComparisonModal: React.FC<ConflictComparisonModalProps> = ({
  conflict,
  onClose,
  onSelectRequirement
}) => {
  if (!conflict) return null;

  const r1 = conflict.req1;
  const r2 = conflict.req2;

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '920px', padding: '0', overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(23, 32, 51, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                  Semantic Conflict Inspection
                </h3>
                <span className={`badge ${getSeverityBadgeClass(conflict.severity)}`}>
                  {conflict.severity} Severity
                </span>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  {conflict.conflict_type}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Conflict ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{conflict.conflict_id}</span> &bull; 
                Semantic Relatedness: {(conflict.similarity_score * 100).toFixed(0)}%
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
              padding: '6px',
              borderRadius: '6px'
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Conflicting Conditions Alert */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fca5a5' }}>
                Conflicting Elements & Diverging Conditions:
              </div>
              <div style={{ fontSize: '13.5px', color: '#f8fafc', marginTop: '2px', fontWeight: '500' }}>
                {conflict.conflicting_elements}
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px'
          }}>
            {/* LEFT REQUIREMENT */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="ref-tag">{r1?.reference_code || 'REQ-1'}</span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
                    {r1?.requirement_type || 'Functional'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px', lineHeight: '1.4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <FileText size={13} color="#94a3b8" />
                    <strong>{r1?.document_name || 'Document 1'}</strong>
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    Section: <span style={{ color: '#cbd5e1' }}>{r1?.section || 'General'}</span>
                    {r1?.page_number !== null && r1?.page_number !== undefined && (
                      <span> &bull; Page {r1.page_number}</span>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '13.5px',
                  color: '#e2e8f0',
                  lineHeight: '1.6',
                  fontStyle: 'normal'
                }}>
                  "{r1?.requirement_text}"
                </div>
              </div>

              {onSelectRequirement && r1 && (
                <button
                  onClick={() => onSelectRequirement(r1.requirement_id)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '14px', alignSelf: 'flex-start', fontSize: '11px' }}
                >
                  View Full Requirement Details
                </button>
              )}
            </div>

            {/* RIGHT REQUIREMENT */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="ref-tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                    {r2?.reference_code || 'REQ-2'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: '600' }}>
                    {r2?.requirement_type || 'Functional'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px', lineHeight: '1.4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <FileText size={13} color="#94a3b8" />
                    <strong>{r2?.document_name || 'Document 2'}</strong>
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    Section: <span style={{ color: '#cbd5e1' }}>{r2?.section || 'General'}</span>
                    {r2?.page_number !== null && r2?.page_number !== undefined && (
                      <span> &bull; Page {r2.page_number}</span>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '13.5px',
                  color: '#e2e8f0',
                  lineHeight: '1.6',
                  fontStyle: 'normal'
                }}>
                  "{r2?.requirement_text}"
                </div>
              </div>

              {onSelectRequirement && r2 && (
                <button
                  onClick={() => onSelectRequirement(r2.requirement_id)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '14px', alignSelf: 'flex-start', fontSize: '11px' }}
                >
                  View Full Requirement Details
                </button>
              )}
            </div>
          </div>

          {/* Why This is a Conflict */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#818cf8" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Why This Is A Conflict / Overlap
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {conflict.explanation}
            </p>
          </div>

          {/* Suggested Neutral Clarification */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lightbulb size={16} color="#34d399" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Suggested Neutral Clarification
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.6' }}>
              {conflict.suggested_clarification}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(17, 24, 39, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
