import { ConflictRecord } from '../types/index.js';

export function generateMarkdownReport(
  conflicts: ConflictRecord[],
  stats: any,
  userName: string = 'Enterprise User'
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let md = `# Requirement Conflict & Overlap Analysis Report\n\n`;
  md += `**Generated for:** ${userName}  \n`;
  md += `**Date:** ${dateStr}  \n`;
  md += `**System:** Requirement Conflict & Overlap Analyzer (AI-Powered)  \n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Total Documents Analyzed** | ${stats.total_documents} |\n`;
  md += `| **Total Requirements Extracted** | ${stats.total_requirements} |\n`;
  md += `| **Total Findings Detected** | ${stats.total_conflicts} |\n`;
  md += `| **Critical Severity Contradictions** | ${stats.critical_conflicts} |\n`;
  md += `| **High Severity Conflicts** | ${stats.high_conflicts} |\n`;
  md += `| **Medium Severity Findings** | ${stats.medium_conflicts} |\n`;
  md += `| **Low Severity / Duplicates** | ${stats.low_conflicts} |\n\n`;

  md += `### Findings Distribution by Category\n\n`;
  for (const [type, count] of Object.entries(stats.by_type || {})) {
    md += `- **${type}**: ${count}\n`;
  }
  md += `\n---\n\n`;

  md += `## 2. Detailed Findings & Traceability\n\n`;

  if (conflicts.length === 0) {
    md += `*No conflicts or overlaps detected in the analyzed requirements set.*\n`;
    return md;
  }

  conflicts.forEach((c, idx) => {
    const r1 = c.req1;
    const r2 = c.req2;

    md += `### ${idx + 1}. [${c.conflict_type.toUpperCase()}] ${c.req1?.reference_code || 'REQ-1'} vs ${c.req2?.reference_code || 'REQ-2'} (Severity: ${c.severity})\n\n`;
    md += `**Conflict ID:** \`${c.conflict_id}\`  \n`;
    md += `**Semantic Similarity Score:** ${(c.similarity_score * 100).toFixed(0)}%  \n`;
    md += `**Conflicting Elements:** ${c.conflicting_elements}  \n\n`;

    md += `#### Source Requirement 1 (LEFT)\n`;
    md += `- **Reference:** \`${r1?.reference_code || 'N/A'}\`\n`;
    md += `- **Document:** ${r1?.document_name || 'Document 1'}\n`;
    md += `- **Section:** ${r1?.section || 'N/A'}\n`;
    md += `- **Page:** ${r1?.page_number !== null ? `Page ${r1?.page_number}` : 'N/A'}\n`;
    md += `> "${r1?.requirement_text || ''}"\n\n`;

    md += `#### Source Requirement 2 (RIGHT)\n`;
    md += `- **Reference:** \`${r2?.reference_code || 'N/A'}\`\n`;
    md += `- **Document:** ${r2?.document_name || 'Document 2'}\n`;
    md += `- **Section:** ${r2?.section || 'N/A'}\n`;
    md += `- **Page:** ${r2?.page_number !== null ? `Page ${r2?.page_number}` : 'N/A'}\n`;
    md += `> "${r2?.requirement_text || ''}"\n\n`;

    md += `**Semantic Explanation:**  \n${c.explanation}\n\n`;
    md += `**Suggested Clarification:**  \n💡 *${c.suggested_clarification}*\n\n`;
    md += `---\n\n`;
  });

  return md;
}

export function generateCsvReport(conflicts: ConflictRecord[]): string {
  const headers = [
    'Conflict ID',
    'Conflict Type',
    'Severity',
    'Similarity Score',
    'Req 1 Reference',
    'Req 1 Document',
    'Req 1 Section',
    'Req 1 Page',
    'Req 1 Text',
    'Req 2 Reference',
    'Req 2 Document',
    'Req 2 Section',
    'Req 2 Page',
    'Req 2 Text',
    'Conflicting Elements',
    'Explanation',
    'Suggested Clarification'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = conflicts.map(c => [
    escapeCsv(c.conflict_id),
    escapeCsv(c.conflict_type),
    escapeCsv(c.severity),
    escapeCsv((c.similarity_score * 100).toFixed(0) + '%'),
    escapeCsv(c.req1?.reference_code || ''),
    escapeCsv(c.req1?.document_name || ''),
    escapeCsv(c.req1?.section || ''),
    escapeCsv(c.req1?.page_number ?? 'N/A'),
    escapeCsv(c.req1?.requirement_text || ''),
    escapeCsv(c.req2?.reference_code || ''),
    escapeCsv(c.req2?.document_name || ''),
    escapeCsv(c.req2?.section || ''),
    escapeCsv(c.req2?.page_number ?? 'N/A'),
    escapeCsv(c.req2?.requirement_text || ''),
    escapeCsv(c.conflicting_elements),
    escapeCsv(c.explanation),
    escapeCsv(c.suggested_clarification)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function generatePrintableHtmlReport(
  conflicts: ConflictRecord[],
  stats: any,
  userName: string = 'Enterprise User'
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Requirement Conflict Analysis Report</title>
  <style>
    @media print {
      body { font-size: 11pt; }
      .no-print { display: none; }
      .page-break { page-break-after: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 20px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 6px 0;
      color: #0f172a;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-Critical { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-High { background: #ffedd5; color: #ea580c; border: 1px solid #fed7aa; }
    .badge-Medium { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-Low { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .conflict-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 20px;
      background: #ffffff;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .conflict-header {
      background: #f8fafc;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .conflict-body {
      padding: 16px;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 14px;
    }
    .req-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .req-meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .req-text {
      font-size: 13px;
      font-style: italic;
      color: #334155;
    }
    .explanation-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      font-size: 13px;
      margin-top: 10px;
    }
    .clarification-box {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      font-size: 13px;
      margin-top: 8px;
    }
    .print-btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Requirement Conflict & Overlap Analysis Report</h1>
        <div class="meta">Generated for: ${userName} | Date: ${dateStr}</div>
      </div>
      <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.total_documents}</div>
      <div class="stat-label">Documents</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.total_requirements}</div>
      <div class="stat-label">Requirements</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #dc2626;">${stats.critical_conflicts}</div>
      <div class="stat-label">Critical Conflicts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.total_conflicts}</div>
      <div class="stat-label">Total Findings</div>
    </div>
  </div>

  <h2>Detailed Findings & Cross-Document Traceability</h2>

  ${conflicts.map((c, i) => `
    <div class="conflict-item">
      <div class="conflict-header">
        <div>
          <span style="font-weight: 700; font-size: 14px;">#${i + 1} ${c.conflict_type}</span>
          <span style="color: #64748b; font-size: 12px; margin-left: 8px;">(${c.req1?.reference_code} ⟷ ${c.req2?.reference_code})</span>
        </div>
        <div>
          <span class="badge badge-${c.severity}">${c.severity}</span>
        </div>
      </div>
      <div class="conflict-body">
        <div style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px;">
          Conflicting Conditions: <span style="font-weight: normal; color: #0f172a;">${c.conflicting_elements}</span>
        </div>

        <div class="comparison-grid">
          <div class="req-box">
            <div class="req-meta">
              <strong>${c.req1?.reference_code}</strong> &bull; ${c.req1?.document_name} &bull; ${c.req1?.section || 'General'}
              ${c.req1?.page_number !== null ? ` &bull; Page ${c.req1?.page_number}` : ''}
            </div>
            <div class="req-text">"${c.req1?.requirement_text}"</div>
          </div>
          <div class="req-box">
            <div class="req-meta">
              <strong>${c.req2?.reference_code}</strong> &bull; ${c.req2?.document_name} &bull; ${c.req2?.section || 'General'}
              ${c.req2?.page_number !== null ? ` &bull; Page ${c.req2?.page_number}` : ''}
            </div>
            <div class="req-text">"${c.req2?.requirement_text}"</div>
          </div>
        </div>

        <div class="explanation-box">
          <strong>Semantic Rationale:</strong> ${c.explanation}
        </div>
        <div class="clarification-box">
          <strong>Suggested Clarification:</strong> ${c.suggested_clarification}
        </div>
      </div>
    </div>
  `).join('')}
</body>
</html>`;
}
