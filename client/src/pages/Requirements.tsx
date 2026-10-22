import React, { useState } from 'react';
import { RequirementRecord, DocumentRecord } from '../types/index.js';
import { 
  ListChecks, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink,
  Tag
} from 'lucide-react';

interface RequirementsProps {
  requirements: RequirementRecord[];
  documents: DocumentRecord[];
  onSelectRequirement: (req: RequirementRecord) => void;
  selectedDocFilter: string;
  setSelectedDocFilter: (docId: string) => void;
}

export const Requirements: React.FC<RequirementsProps> = ({
  requirements,
  documents,
  onSelectRequirement,
  selectedDocFilter,
  setSelectedDocFilter
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = requirements.filter(r => {
    const matchesDoc = selectedDocFilter === 'all' || r.document_id === selectedDocFilter;
    const matchesType = typeFilter === 'all' || r.requirement_type.toLowerCase() === typeFilter.toLowerCase();
    const s = search.toLowerCase();
    const matchesSearch = 
      r.reference_code.toLowerCase().includes(s) ||
      r.requirement_text.toLowerCase().includes(s) ||
      (r.section && r.section.toLowerCase().includes(s)) ||
      (r.document_name && r.document_name.toLowerCase().includes(s));

    return matchesDoc && matchesType && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Security': return '#f87171';
      case 'Performance': return '#fbbf24';
      case 'Compliance': return '#34d399';
      case 'UI/UX': return '#c084fc';
      case 'Business Rule': return '#38bdf8';
      default: return '#818cf8';
    }
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
            Extracted Requirements Repository
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
            Structured requirement inventory with traceability back to source documents, sections, and pages.
          </p>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Total Requirements: <strong style={{ color: '#ffffff' }}>{requirements.length}</strong>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by ID, keyword, section, or statement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Filter by Document */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={15} color="var(--text-dim)" />
          <select
            value={selectedDocFilter}
            onChange={e => setSelectedDocFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Documents ({documents.length})</option>
            {documents.map(d => (
              <option key={d.document_id} value={d.document_id}>
                {d.original_name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Requirement Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-dim)" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Types</option>
            <option value="Functional">Functional</option>
            <option value="Security">Security</option>
            <option value="Performance">Performance</option>
            <option value="Compliance">Compliance</option>
            <option value="Business Rule">Business Rule</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Non-Functional">Non-Functional</option>
          </select>
        </div>

        {(search || selectedDocFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedDocFilter('all');
              setTypeFilter('all');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Requirements Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <ListChecks size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
              No requirements match your query
            </h3>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Try adjusting your search keywords or document filters.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Reference</th>
                  <th>Original Requirement Statement</th>
                  <th>Category</th>
                  <th>Source Document</th>
                  <th>Section</th>
                  <th>Page</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => {
                  const typeColor = getTypeColor(req.requirement_type);
                  return (
                    <tr
                      key={req.requirement_id}
                      onClick={() => onSelectRequirement(req)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="ref-tag">{req.reference_code}</span>
                      </td>
                      <td style={{ maxWidth: '480px' }}>
                        <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.5' }}>
                          "{req.requirement_text}"
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: `${typeColor}22`,
                          color: typeColor,
                          border: `1px solid ${typeColor}44`,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {req.requirement_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#38bdf8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={13} />
                          <span>{req.document_name || 'Doc'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.section || 'General'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {req.page_number !== null && req.page_number !== undefined ? `P.${req.page_number}` : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequirement(req);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <ExternalLink size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
