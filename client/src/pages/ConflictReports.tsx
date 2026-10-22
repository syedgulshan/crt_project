import React, { useState } from 'react';
import { ConflictRecord, DashboardStats, DocumentRecord } from '../types/index.js';
import { api } from '../services/api.js';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Filter, 
  Search, 
  ExternalLink,
  Layers,
  Code
} from 'lucide-react';

interface ConflictReportsProps {
  conflicts: ConflictRecord[];
  stats: DashboardStats | null;
  documents: DocumentRecord[];
  onOpenConflict: (conflict: ConflictRecord) => void;
}

export const ConflictReports: React.FC<ConflictReportsProps> = ({
  conflicts,
  stats,
  documents,
  onOpenConflict
}) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [docFilter, setDocFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'severity' | 'similarity' | 'type'>('severity');

  const filtered = conflicts.filter(c => {
    const matchesSev = severityFilter === 'all' || c.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || c.conflict_type.toLowerCase() === typeFilter.toLowerCase();
    const matchesDoc = docFilter === 'all' || c.req1?.document_id === docFilter || c.req2?.document_id === docFilter;
    const s = search.toLowerCase();
    const matchesSearch = 
      (c.req1?.reference_code && c.req1.reference_code.toLowerCase().includes(s)) ||
      (c.req2?.reference_code && c.req2.reference_code.toLowerCase().includes(s)) ||
      (c.explanation && c.explanation.toLowerCase().includes(s)) ||
      (c.conflicting_elements && c.conflicting_elements.toLowerCase().includes(s));

    return matchesSev && matchesType && matchesDoc && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'severity') {
      const order: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      return (order[a.severity] || 5) - (order[b.severity] || 5);
    }
    if (sortBy === 'similarity') {
      return b.similarity_score - a.similarity_score;
    }
    return a.conflict_type.localeCompare(b.conflict_type);
  });

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const handleExportJson = async () => {
    try {
      const data = await api.reports.getJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requirement-conflicts-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export JSON report.');
    }
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header with Export Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
            Comprehensive Conflict & Overlap Audit Report
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
            Formal audit log with full cross-document requirement traceability.
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={api.reports.getHtmlUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </a>

          <a
            href={api.reports.getMarkdownUrl()}
            download
            className="btn btn-secondary btn-sm"
            title="Download Markdown Report"
          >
            <FileText size={14} />
            <span>Markdown</span>
          </a>

          <a
            href={api.reports.getCsvUrl()}
            download
            className="btn btn-secondary btn-sm"
            title="Download CSV Spreadsheet"
          >
            <Download size={14} />
            <span>CSV</span>
          </a>

          <button
            onClick={handleExportJson}
            className="btn btn-secondary btn-sm"
            title="Export JSON payload"
          >
            <Code size={14} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px'
      }}>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{stats?.total_documents || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>Total Documents</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{stats?.total_requirements || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>Total Requirements</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f87171' }}>{stats?.critical_conflicts || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>Critical Conflicts</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fb923c' }}>{stats?.high_conflicts || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>High Conflicts</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>{stats?.medium_conflicts || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>Medium Findings</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>{stats?.low_conflicts || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '2px' }}>Low / Duplicates</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search report table..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Severity */}
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

        {/* Type */}
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

        {/* Document */}
        <select
          value={docFilter}
          onChange={e => setDocFilter(e.target.value)}
          className="select"
        >
          <option value="all">All Documents</option>
          {documents.map(d => (
            <option key={d.document_id} value={d.document_id}>
              {d.original_name}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="select"
        >
          <option value="severity">Sort by Severity</option>
          <option value="similarity">Sort by Similarity Score</option>
          <option value="type">Sort by Classification</option>
        </select>
      </div>

      {/* Formal Conflict Report Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <FileSpreadsheet size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
              No findings match your criteria
            </h3>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Reset your filters or run an analysis to populate report findings.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Conflict ID</th>
                  <th>Requirement 1</th>
                  <th>Requirement 2</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Explanation & Conflicting Elements</th>
                  <th>Source Traceability</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr
                    key={c.conflict_id}
                    onClick={() => onOpenConflict(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {c.conflict_id.substring(0, 12)}
                      </span>
                    </td>
                    <td>
                      <span className="ref-tag">{c.req1?.reference_code || 'REQ-1'}</span>
                    </td>
                    <td>
                      <span className="ref-tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                        {c.req2?.reference_code || 'REQ-2'}
                      </span>
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
                    <td style={{ maxWidth: '380px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                        {c.conflicting_elements}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', lineHeight: '1.4' }}>
                        {c.explanation}
                      </div>
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#38bdf8', maxWidth: '200px' }}>
                      <div>{c.req1?.reference_code} &rarr; {c.req1?.document_name}</div>
                      <div>{c.req2?.reference_code} &rarr; {c.req2?.document_name}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConflict(c);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <ExternalLink size={13} />
                        <span>Inspect</span>
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
