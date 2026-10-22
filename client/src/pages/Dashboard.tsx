import React from 'react';
import { MetricCard } from '../components/MetricCard.js';
import { SeverityChart, TypeDistributionChart } from '../components/Charts.js';
import { ConflictRecord, DashboardStats } from '../types/index.js';
import { 
  FileText, 
  ListChecks, 
  AlertTriangle, 
  GitCompare, 
  Layers,
  ArrowRight,
  Database,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats | null;
  recentConflicts: ConflictRecord[];
  onOpenConflict: (conflict: ConflictRecord) => void;
  onNavigateTab: (tab: string) => void;
  onSeedDemo: () => void;
  onOpenUpload: () => void;
  isSeeding: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentConflicts,
  onOpenConflict,
  onNavigateTab,
  onSeedDemo,
  onOpenUpload,
  isSeeding
}) => {
  const hasData = (stats?.total_requirements || 0) > 0;

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Welcome & Quick Action Hero */}
      {!hasData ? (
        <div className="glass-panel" style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#c7d2fe', marginBottom: '12px' }}>
              <Sparkles size={14} />
              <span>AI-Powered Semantic Analysis Ready</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Detect Contradictions & Overlaps Across Requirements
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '640px', lineHeight: '1.6' }}>
              Upload your SRS, BRD, and FRD documents (PDF, DOCX, TXT) or load our pre-configured sample dataset to immediately test direct contradictions, partial conflicts, semantic overlaps, and duplicate detections.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              <Database size={16} />
              <span>{isSeeding ? 'Loading Demo Data...' : '⚡ Load Sample SRS & BRD Data'}</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <FileText size={15} />
              <span>Upload Custom Documents</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 5 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <MetricCard
          title="Documents Uploaded"
          value={stats?.total_documents || 0}
          icon={FileText}
          colorScheme="cyan"
          subtitle="SRS, BRD & FRD specifications"
          onClick={() => onNavigateTab('documents')}
        />
        <MetricCard
          title="Requirements Extracted"
          value={stats?.total_requirements || 0}
          icon={ListChecks}
          colorScheme="indigo"
          subtitle="Structured requirement IDs"
          onClick={() => onNavigateTab('requirements')}
        />
        <MetricCard
          title="Conflicts Detected"
          value={stats?.total_conflicts || 0}
          icon={AlertTriangle}
          colorScheme="orange"
          subtitle="Identified semantic relationships"
          onClick={() => onNavigateTab('analysis')}
        />
        <MetricCard
          title="Critical Contradictions"
          value={stats?.critical_conflicts || 0}
          icon={AlertTriangle}
          colorScheme="red"
          subtitle="Mutually incompatible conditions"
          onClick={() => onNavigateTab('analysis')}
        />
        <MetricCard
          title="Semantic Overlaps"
          value={stats?.by_type?.['Semantic Overlap'] || 0}
          icon={Layers}
          colorScheme="emerald"
          subtitle="Synonymous / overlapping scope"
          onClick={() => onNavigateTab('analysis')}
        />
      </div>

      {/* Visual Analytics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Severity Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
              Findings by Severity Level
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
              Distribution
            </span>
          </div>
          <SeverityChart
            critical={stats?.critical_conflicts || 0}
            high={stats?.high_conflicts || 0}
            medium={stats?.medium_conflicts || 0}
            low={stats?.low_conflicts || 0}
          />
        </div>

        {/* Category Breakdown */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
              Semantic Relationship Taxonomy
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
              Classification
            </span>
          </div>
          <TypeDistributionChart byType={stats?.by_type || {}} />
        </div>
      </div>

      {/* Recent Findings Table Preview */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              Highest Priority Findings & Contradictions
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Click any finding to inspect the side-by-side semantic comparison and traceability.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('analysis')}
            className="btn btn-secondary btn-sm"
          >
            <span>View All ({stats?.total_conflicts || 0})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentConflicts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
            <GitCompare size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '14px', fontWeight: '500' }}>No conflicts or overlaps detected yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Run analysis across your requirement documents to surface findings.
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Requirement Pair</th>
                  <th>Conflicting Elements</th>
                  <th>Similarity</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentConflicts.slice(0, 5).map(c => {
                  const getSeverityClass = (sev: string) => {
                    switch (sev) {
                      case 'Critical': return 'badge-critical';
                      case 'High': return 'badge-high';
                      case 'Medium': return 'badge-medium';
                      default: return 'badge-low';
                    }
                  };

                  return (
                    <tr 
                      key={c.conflict_id}
                      onClick={() => onOpenConflict(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{c.conflict_type}</span>
                      </td>
                      <td>
                        <span className={`badge ${getSeverityClass(c.severity)}`}>
                          {c.severity}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="ref-tag">{c.req1?.reference_code || 'REQ-1'}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>⟷</span>
                          <span className="ref-tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                            {c.req2?.reference_code || 'REQ-2'}
                          </span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '380px' }}>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.conflicting_elements}
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
                          <ExternalLink size={13} />
                          <span>Inspect</span>
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
