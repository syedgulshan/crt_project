import React from 'react';

interface SeverityChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const SeverityChart: React.FC<SeverityChartProps> = ({ critical, high, medium, low }) => {
  const total = critical + high + medium + low || 1;
  const items = [
    { label: 'Critical Contradictions', count: critical, color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)' },
    { label: 'High Severity Conflicts', count: high, color: '#fb923c', bg: 'rgba(249, 115, 22, 0.2)' },
    { label: 'Medium Ambiguities/Conflicts', count: medium, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)' },
    { label: 'Low / Overlaps / Duplicates', count: low, color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.map((item, idx) => {
        const percent = Math.round((item.count / total) * 100);
        return (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: '700' }}>
                {item.count} ({percent}%)
              </span>
            </div>
            <div style={{
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                background: item.color,
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface TypeChartProps {
  byType: Record<string, number>;
}

export const TypeDistributionChart: React.FC<TypeChartProps> = ({ byType }) => {
  const entries = Object.entries(byType || {});
  const total = entries.reduce((acc, [_, v]) => acc + v, 0) || 1;

  const colorMap: Record<string, string> = {
    'Direct Contradiction': '#f87171',
    'Partial Conflict': '#fb923c',
    'Semantic Overlap': '#818cf8',
    'Duplicate': '#34d399',
    'Ambiguity': '#fbbf24',
    'Potential Conflict': '#38bdf8'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {entries.map(([type, count]) => {
        const percent = Math.round((count / total) * 100);
        const color = colorMap[type] || '#a855f7';
        return (
          <div key={type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{type}</span>
              <span style={{ color: color, fontWeight: '700' }}>{count}</span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                background: color,
                borderRadius: '3px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
