import { DocumentRecord, RequirementRecord } from '../types/index.js';
import { 
  createDocument, 
  createRequirementsBatch, 
  deleteDocument,
  getDocumentsByUserId,
  clearConflictsForUser
} from '../config/database.js';

export async function seedDemoData(userId: string) {
  // Clear any previous demo data for this user
  const existingDocs = getDocumentsByUserId(userId);
  for (const doc of existingDocs) {
    if (doc.filename.includes('Demo') || doc.original_name.includes('[DEMO]')) {
      deleteDocument(doc.document_id, userId);
    }
  }
  clearConflictsForUser(userId);

  const now = new Date().toISOString();

  // Document 1: SRS (Software Requirements Specification - E-Commerce Platform)
  const srsDocId = `doc-demo-srs-${Date.now()}`;
  const srsDoc: DocumentRecord = {
    document_id: srsDocId,
    user_id: userId,
    filename: 'SRS_Ecommerce_Platform_v2.4.docx',
    original_name: '[DEMO] SRS_Ecommerce_Platform_v2.4.docx',
    document_type: 'srs',
    file_path: 'demo/SRS_Ecommerce_Platform_v2.4.docx',
    file_size: 48250,
    upload_date: now,
    status: 'completed',
    requirement_count: 8,
    error_message: null
  };
  createDocument(srsDoc);

  // Document 2: BRD (Business Requirements Document - Enterprise Governance)
  const brdDocId = `doc-demo-brd-${Date.now()}`;
  const brdDoc: DocumentRecord = {
    document_id: brdDocId,
    user_id: userId,
    filename: 'BRD_Enterprise_Governance_v1.8.pdf',
    original_name: '[DEMO] BRD_Enterprise_Governance_v1.8.pdf',
    document_type: 'brd',
    file_path: 'demo/BRD_Enterprise_Governance_v1.8.pdf',
    file_size: 61400,
    upload_date: now,
    status: 'completed',
    requirement_count: 8,
    error_message: null
  };
  createDocument(brdDoc);

  // Document 3: FRD (Functional Requirements Document - Identity & Order Flow)
  const frdDocId = `doc-demo-frd-${Date.now()}`;
  const frdDoc: DocumentRecord = {
    document_id: frdDocId,
    user_id: userId,
    filename: 'FRD_Identity_Order_Workflow.txt',
    original_name: '[DEMO] FRD_Identity_Order_Workflow.txt',
    document_type: 'frd',
    file_path: 'demo/FRD_Identity_Order_Workflow.txt',
    file_size: 15300,
    upload_date: now,
    status: 'completed',
    requirement_count: 6,
    error_message: null
  };
  createDocument(frdDoc);

  const reqs: RequirementRecord[] = [
    // --- SRS REQUIREMENTS ---
    {
      requirement_id: `req-srs-001-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-001',
      requirement_text: 'Users must be automatically logged out after 15 minutes of inactivity to protect session integrity.',
      requirement_type: 'Security',
      section: 'Section 4.1 Session Lifecycle',
      page_number: 14,
      priority: 'Critical',
      metadata: JSON.stringify({ actor: 'user', action: 'logout', trigger: 'inactivity', duration: '15 minutes' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-002-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-002',
      requirement_text: 'Users must be able to reset their password using their registered email through an automated one-time link.',
      requirement_type: 'Security',
      section: 'Section 4.3 Credential Management',
      page_number: 17,
      priority: 'High',
      metadata: JSON.stringify({ actor: 'user', flow: 'self-service', channel: 'email' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-003-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-003',
      requirement_text: 'Customer can cancel an order before shipment directly from their account order history dashboard.',
      requirement_type: 'Functional',
      section: 'Section 6.2 Order Lifecycle',
      page_number: 28,
      priority: 'High',
      metadata: JSON.stringify({ actor: 'customer', action: 'cancel order', cutoff: 'before shipment' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-004-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-004',
      requirement_text: 'Users can update their email address in their personal profile settings page.',
      requirement_type: 'Functional',
      section: 'Section 3.4 User Profile Management',
      page_number: 9,
      priority: 'Medium',
      metadata: JSON.stringify({ actor: 'user', action: 'update', target: 'email address' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-005-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-005',
      requirement_text: 'All user data stored in persistent relational databases must be encrypted at rest using AES-256 standards.',
      requirement_type: 'Security',
      section: 'Section 8.1 Data At Rest Protection',
      page_number: 42,
      priority: 'Critical',
      metadata: JSON.stringify({ target: 'data at rest', algorithm: 'AES-256' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-006-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-006',
      requirement_text: 'The search response time should be fast and seamless under high user concurrency load.',
      requirement_type: 'Performance',
      section: 'Section 9.2 Search SLA',
      page_number: 49,
      priority: 'Medium',
      metadata: JSON.stringify({ metric: 'unquantified', terms: ['fast', 'seamless', 'high user concurrency'] }),
      created_at: now
    },
    {
      requirement_id: `req-srs-007-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-007',
      requirement_text: 'The checkout system shall process credit card payments via PCI-DSS compliant third-party gateways.',
      requirement_type: 'Compliance',
      section: 'Section 6.5 Payment Processing',
      page_number: 33,
      priority: 'Critical',
      metadata: JSON.stringify({ gateway: 'PCI-DSS' }),
      created_at: now
    },
    {
      requirement_id: `req-srs-008-${Date.now()}`,
      document_id: srsDocId,
      user_id: userId,
      reference_code: 'SRS-008',
      requirement_text: 'The application UI should adopt a responsive layout optimized for mobile, tablet, and desktop viewports.',
      requirement_type: 'UI/UX',
      section: 'Section 2.2 Visual Presentation',
      page_number: 5,
      priority: 'Medium',
      metadata: JSON.stringify({ channels: ['mobile', 'tablet', 'desktop'] }),
      created_at: now
    },

    // --- BRD REQUIREMENTS ---
    {
      requirement_id: `req-brd-014-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-014',
      requirement_text: 'Password recovery must only be performed through administrator verification and manual approval ticket.',
      requirement_type: 'Security',
      section: 'Section 3.5 Identity Governance',
      page_number: 12,
      priority: 'Critical',
      metadata: JSON.stringify({ actor: 'administrator', action: 'manual verification', flow: 'admin-only' }),
      created_at: now
    },
    {
      requirement_id: `req-brd-021-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-021',
      requirement_text: 'Users must remain logged in for at least 30 minutes without activity before any forced session termination.',
      requirement_type: 'Business Rule',
      section: 'Section 4.2 Corporate UX Standards',
      page_number: 18,
      priority: 'High',
      metadata: JSON.stringify({ trigger: 'inactivity', duration: '30 minutes' }),
      created_at: now
    },
    {
      requirement_id: `req-brd-033-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-033',
      requirement_text: 'Orders may be cancelled by customers until dispatch notification is emitted from warehouse facilities.',
      requirement_type: 'Business Rule',
      section: 'Section 5.1 Fulfillment & Logistics',
      page_number: 22,
      priority: 'High',
      metadata: JSON.stringify({ actor: 'customer', action: 'cancelled', cutoff: 'until dispatch' }),
      created_at: now
    },
    {
      requirement_id: `req-brd-045-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-045',
      requirement_text: 'Users can change their profile information including contact preferences, bio, and associated details.',
      requirement_type: 'Functional',
      section: 'Section 2.8 Customer Profile Management',
      page_number: 7,
      priority: 'Low',
      metadata: JSON.stringify({ actor: 'user', target: 'profile information' }),
      created_at: now
    },
    {
      requirement_id: `req-brd-052-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-052',
      requirement_text: 'All corporate storage volumes and relational database records must be encrypted at rest utilizing AES-256.',
      requirement_type: 'Security',
      section: 'Section 7.4 Information Security Mandate',
      page_number: 31,
      priority: 'Critical',
      metadata: JSON.stringify({ algorithm: 'AES-256', target: 'storage' }),
      created_at: now
    },
    {
      requirement_id: `req-brd-060-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-060',
      requirement_text: 'Customer invoice reports must be generated and downloadable in standard PDF and CSV formats within 5 seconds.',
      requirement_type: 'Functional',
      section: 'Section 6.3 Financial Reporting',
      page_number: 26,
      priority: 'Medium',
      metadata: JSON.stringify({ formats: ['PDF', 'CSV'] }),
      created_at: now
    },
    {
      requirement_id: `req-brd-071-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-071',
      requirement_text: 'System response latency shall be adequate and comfortable for enterprise branch office operators.',
      requirement_type: 'Non-Functional',
      section: 'Section 9.1 Branch Infrastructure SLA',
      page_number: 40,
      priority: 'Low',
      metadata: JSON.stringify({ terms: ['adequate', 'comfortable'] }),
      created_at: now
    },
    {
      requirement_id: `req-brd-080-${Date.now()}`,
      document_id: brdDocId,
      user_id: userId,
      reference_code: 'BRD-080',
      requirement_text: 'Audit logs must capture every authorization attempt and be immutable for a minimum retention of 7 years.',
      requirement_type: 'Compliance',
      section: 'Section 8.2 Regulatory Audit Retention',
      page_number: 37,
      priority: 'Critical',
      metadata: JSON.stringify({ retention: '7 years' }),
      created_at: now
    },

    // --- FRD REQUIREMENTS ---
    {
      requirement_id: `req-frd-101-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-101',
      requirement_text: 'Customers can only cancel placed orders within 2 hours of checkout submission.',
      requirement_type: 'Functional',
      section: 'Section 5.3 Order Modification Window',
      page_number: 11,
      priority: 'High',
      metadata: JSON.stringify({ cutoff: 'within 2 hours' }),
      created_at: now
    },
    {
      requirement_id: `req-frd-102-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-102',
      requirement_text: 'Administrative accounts must strictly require Multi-Factor Authentication (MFA) via TOTP hardware token.',
      requirement_type: 'Security',
      section: 'Section 2.4 Privileged Access MFA',
      page_number: 4,
      priority: 'Critical',
      metadata: JSON.stringify({ actor: 'admin', auth: 'MFA TOTP' }),
      created_at: now
    },
    {
      requirement_id: `req-frd-103-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-103',
      requirement_text: 'The search query pipeline must return catalog search results within 200 milliseconds under 95th percentile load.',
      requirement_type: 'Performance',
      section: 'Section 8.1 Search Microservice SLA',
      page_number: 25,
      priority: 'High',
      metadata: JSON.stringify({ latency: '200ms', sla: 'p95' }),
      created_at: now
    },
    {
      requirement_id: `req-frd-104-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-104',
      requirement_text: 'System shall generate automated daily inventory synchronization events at 00:00 UTC.',
      requirement_type: 'Functional',
      section: 'Section 7.1 Scheduled Jobs',
      page_number: 21,
      priority: 'Medium',
      metadata: JSON.stringify({ schedule: '00:00 UTC' }),
      created_at: now
    },
    {
      requirement_id: `req-frd-105-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-105',
      requirement_text: 'Users must acknowledge terms of service and GDPR privacy notice prior to first account activation.',
      requirement_type: 'Compliance',
      section: 'Section 1.2 Onboarding Legal Consent',
      page_number: 2,
      priority: 'Critical',
      metadata: JSON.stringify({ consent: 'GDPR' }),
      created_at: now
    },
    {
      requirement_id: `req-frd-106-${Date.now()}`,
      document_id: frdDocId,
      user_id: userId,
      reference_code: 'FRD-106',
      requirement_text: 'The frontend dashboard shall render all order statuses with visual status badges and color codes.',
      requirement_type: 'UI/UX',
      section: 'Section 4.1 Order Summary View',
      page_number: 9,
      priority: 'Low',
      metadata: JSON.stringify({ badges: true }),
      created_at: now
    }
  ];

  createRequirementsBatch(reqs);

  return {
    documentCount: 3,
    requirementCount: reqs.length
  };
}
