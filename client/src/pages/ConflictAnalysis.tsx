import React, { useState } from 'react';
import { ConflictRecord, DocumentRecord, AnalysisJobRecord } from '../types/index.js';
import { 
  GitCompare, 
  Play, 
  Filter, 
  Search, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface ConflictAnalysisProps {
  conflicts: ConflictRecord[];
  documents: DocumentRecord[];
  onOpenConflict: (conflict: ConflictRecord) => void;
  onRunAnalysis: (payload: { documentIds?: string[]; provider?: any }) => void;
  isAnalyzing: boolean;
  activeJob: AnalysisJobRecord | null;
}

export const ConflictAnalysis: React.FC<ConflictAnalysisProps> = ({
  conflicts,
  documents,
  onOpenConflict,
  onRunAnalysis,
  isAnalyzing,
  activeJob
}) => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'auto' | 'gemini' | 'openai' | 'local'>('auto');

  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(prev => prev.filter(id => id !== docId));
    } else {
      setSelectedDocs(prev => [...prev, docId]);
    }
  };

  const selectAllDocs = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d.document_id));
    }
  };

  const handleStartAnalysis = () => {
    onRunAnalysis({
      documentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
      provider: selectedProvider
    });
  };

  const filtered = conflicts.filter(c => {
    const matchesSev = severityFilter === 'all' || c.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || c.conflict_type.toLowerCase() === typeFilter.toLowerCase();
    const s = search.toLowerCase();
    const matchesSearch = 
      (c.req1?.reference_code && c.req1.reference_code.toLowerCase().includes(s)) ||
      (c.req2?.reference_code && c.req2.reference_code.toLowerCase().includes(s)) ||
      (c.req1?.requirement_text && c.req1.requirement_text.toLowerCase().includes(s)) ||
      (c.req2?.requirement_text && c.req2.requirement_text.toLowerCase().includes(s)) ||
      (c.explanation && c.explanation.toLowerCase().includes(s)) ||
      (c.conflicting_elements && c.conflicting_elements.toLowerCase().includes(s));

    return matchesSev && matchesType && matchesSearch;
  });

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header & Execution Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={16} color="#818cf8" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Semantic Cross-Document Engine
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
              Requirement Conflict & Overlap Analysis Workbench
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px', maxWidth: '680px' }}>
              Select target documents and execute deep semantic evaluation to identify direct contradictions, partial conflicts, overlapping scopes, duplicates, and ambiguities.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as any)}
              className="select"
              style={{ fontSize: '12.5px' }}
            >
              <option value="auto">AI Engine: Auto-Detect (Optimized)</option>
              <option value="local">AI Engine: High-Accuracy Local Logic Engine</option>
              <option value="gemini">AI Engine: Google Gemini 1.5</option>
              <option value="openai">AI Engine: OpenAI GPT-4o</option>
            </select>

            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || documents.length === 0}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="pulse-indicator" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Analyzing Semantics...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Selection Multi-Pill Bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
              Scope: Target Documents ({selectedDocs.length === 0 ? 'All Documents' : `${selectedDocs.length} selected`})
            </span>
            <button
              onClick={selectAllDocs}
              style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
            >
              {selectedDocs.length === documents.length ? 'Deselect All' : 'Select All Documents'}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {documents.map(d => {
              const isSelected = selectedDocs.length === 0 || selectedDocs.includes(d.document_id);
              return (
                <button
                  key={d.document_id}
                  onClick={() => toggleDocSelection(d.document_id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#818cf8' : 'var(--text-dim)' }} />
                  <span>{d.original_name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({d.requirement_count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Job Progress Bar */}
        {isAnalyzing && (
          <div style={{
            marginTop: '20px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>
                  {activeJob?.current_step || 'Processing semantic relationships...'}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                {activeJob?.progress || 45}%
              </span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${activeJob?.progress || 45}%`,
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                borderRadius: '3px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}

      </div>

      {/* Filter & Search Controls */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search findings by requirement ID, condition, or text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-dim)" />
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Conflict Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={15} color="var(--text-dim)" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Types</option>
            <option value="Direct Contradiction">Direct Contradiction</option>
            <option value="Partial Conflict">Partial Conflict</option>
            <option value="Semantic Overlap">Semantic Overlap</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Ambiguity">Ambiguity</option>
            <option value="Potential Conflict">Potential Conflict</option>
          </select>
        </div>

        {(search || severityFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setSeverityFilter('all');
              setTypeFilter('all');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Findings Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <GitCompare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
              No conflict findings match your criteria
            </h3>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Try adjusting your search criteria or execute an analysis across more documents.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Conflict ID</th>
                  <th>Requirement 1</th>
                  <th>Requirement 2</th>
                  <th>Classification</th>
                  <th>Severity</th>
                  <th>Conflicting Condition / Rationale</th>
                  <th>Similarity</th>
                  <th style={{ textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.conflict_id}
                    onClick={() => onOpenConflict(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {c.conflict_id.substring(0, 14)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="ref-tag">{c.req1?.reference_code || 'REQ-1'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.req1?.document_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="ref-tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                          {c.req2?.reference_code || 'REQ-2'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.req2?.document_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '12.5px' }}>
                        {c.conflict_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadgeClass(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.conflicting_elements}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {c.explanation}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#38bdf8' }}>
                        {(c.similarity_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConflict(c);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <ArrowRightLeft size={13} />
                        <span>Compare</span>
                      </button>
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
