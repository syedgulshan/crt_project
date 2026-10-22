import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { User, DocumentRecord, RequirementRecord, ConflictRecord, AnalysisJobRecord } from '../types/index.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'analyzer.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      provider TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      document_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      upload_date TEXT NOT NULL,
      status TEXT NOT NULL,
      requirement_count INTEGER DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requirements (
      requirement_id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reference_code TEXT NOT NULL,
      requirement_text TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      section TEXT,
      page_number INTEGER,
      priority TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conflicts (
      conflict_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      requirement_1_id TEXT NOT NULL,
      requirement_2_id TEXT NOT NULL,
      conflict_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      similarity_score REAL NOT NULL,
      explanation TEXT NOT NULL,
      conflicting_elements TEXT NOT NULL,
      suggested_clarification TEXT NOT NULL,
      job_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_1_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_2_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analysis_jobs (
      job_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL,
      current_step TEXT NOT NULL,
      document_ids TEXT NOT NULL,
      requirements_analyzed INTEGER DEFAULT 0,
      conflicts_found INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_requirements_user ON requirements(user_id);
    CREATE INDEX IF NOT EXISTS idx_requirements_doc ON requirements(document_id);
    CREATE INDEX IF NOT EXISTS idx_conflicts_user ON conflicts(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON analysis_jobs(user_id);
  `);
}

// User operations
export function upsertUser(user: User): User {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, email, display_name, provider, created_at)
    VALUES (@user_id, @email, @display_name, @provider, @created_at)
    ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name,
      provider = excluded.provider
  `);
  stmt.run(user);
  return user;
}

export function getUserById(userId: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  return stmt.get(userId) as User | undefined;
}

// Document operations
export function createDocument(doc: DocumentRecord): DocumentRecord {
  const stmt = db.prepare(`
    INSERT INTO documents (
      document_id, user_id, filename, original_name, document_type,
      file_path, file_size, upload_date, status, requirement_count, error_message
    ) VALUES (
      @document_id, @user_id, @filename, @original_name, @document_type,
      @file_path, @file_size, @upload_date, @status, @requirement_count, @error_message
    )
  `);
  stmt.run(doc);
  return doc;
}

export function getDocumentsByUserId(userId: string): DocumentRecord[] {
  const stmt = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY upload_date DESC');
  return stmt.all(userId) as DocumentRecord[];
}

export function getDocumentById(documentId: string, userId: string): DocumentRecord | undefined {
  const stmt = db.prepare('SELECT * FROM documents WHERE document_id = ? AND user_id = ?');
  return stmt.get(documentId, userId) as DocumentRecord | undefined;
}

export function updateDocumentStatus(
  documentId: string,
  userId: string,
  status: DocumentRecord['status'],
  requirementCount?: number,
  errorMessage?: string | null
) {
  if (requirementCount !== undefined) {
    const stmt = db.prepare(`
      UPDATE documents 
      SET status = ?, requirement_count = ?, error_message = ? 
      WHERE document_id = ? AND user_id = ?
    `);
    stmt.run(status, requirementCount, errorMessage || null, documentId, userId);
  } else {
    const stmt = db.prepare(`
      UPDATE documents 
      SET status = ?, error_message = ? 
      WHERE document_id = ? AND user_id = ?
    `);
    stmt.run(status, errorMessage || null, documentId, userId);
  }
}

export function deleteDocument(documentId: string, userId: string): boolean {
  const stmt = db.prepare('DELETE FROM documents WHERE document_id = ? AND user_id = ?');
  const result = stmt.run(documentId, userId);
  return result.changes > 0;
}

// Requirement operations
export function createRequirement(req: RequirementRecord): RequirementRecord {
  const stmt = db.prepare(`
    INSERT INTO requirements (
      requirement_id, document_id, user_id, reference_code, requirement_text,
      requirement_type, section, page_number, priority, metadata, created_at
    ) VALUES (
      @requirement_id, @document_id, @user_id, @reference_code, @requirement_text,
      @requirement_type, @section, @page_number, @priority, @metadata, @created_at
    )
  `);
  stmt.run(req);
  return req;
}

export function createRequirementsBatch(reqs: RequirementRecord[]) {
  const insertMany = db.transaction((items: RequirementRecord[]) => {
    const stmt = db.prepare(`
      INSERT INTO requirements (
        requirement_id, document_id, user_id, reference_code, requirement_text,
        requirement_type, section, page_number, priority, metadata, created_at
      ) VALUES (
        @requirement_id, @document_id, @user_id, @reference_code, @requirement_text,
        @requirement_type, @section, @page_number, @priority, @metadata, @created_at
      )
    `);
    for (const item of items) {
      stmt.run(item);
    }
  });
  insertMany(reqs);
}

export function getRequirementsByUserId(userId: string, documentId?: string): RequirementRecord[] {
  if (documentId) {
    const stmt = db.prepare(`
      SELECT r.*, d.original_name as document_name, d.document_type
      FROM requirements r
      JOIN documents d ON r.document_id = d.document_id
      WHERE r.user_id = ? AND r.document_id = ?
      ORDER BY r.reference_code ASC
    `);
    return stmt.all(userId, documentId) as RequirementRecord[];
  }
  const stmt = db.prepare(`
    SELECT r.*, d.original_name as document_name, d.document_type
    FROM requirements r
    JOIN documents d ON r.document_id = d.document_id
    WHERE r.user_id = ?
    ORDER BY d.original_name ASC, r.reference_code ASC
  `);
  return stmt.all(userId) as RequirementRecord[];
}

export function getRequirementsByDocumentId(documentId: string, userId: string): RequirementRecord[] {
  return getRequirementsByUserId(userId, documentId);
}

export function getRequirementById(requirementId: string, userId: string): RequirementRecord | undefined {
  const stmt = db.prepare(`
    SELECT r.*, d.original_name as document_name, d.document_type
    FROM requirements r
    JOIN documents d ON r.document_id = d.document_id
    WHERE r.requirement_id = ? AND r.user_id = ?
  `);
  return stmt.get(requirementId, userId) as RequirementRecord | undefined;
}

export function deleteRequirementsByDocumentId(documentId: string, userId: string) {
  const stmt = db.prepare('DELETE FROM requirements WHERE document_id = ? AND user_id = ?');
  stmt.run(documentId, userId);
}

// Conflict operations
export function createConflict(conflict: ConflictRecord): ConflictRecord {
  const stmt = db.prepare(`
    INSERT INTO conflicts (
      conflict_id, user_id, requirement_1_id, requirement_2_id,
      conflict_type, severity, similarity_score, explanation,
      conflicting_elements, suggested_clarification, job_id, created_at
    ) VALUES (
      @conflict_id, @user_id, @requirement_1_id, @requirement_2_id,
      @conflict_type, @severity, @similarity_score, @explanation,
      @conflicting_elements, @suggested_clarification, @job_id, @created_at
    )
  `);
  stmt.run(conflict);
  return conflict;
}

export function createConflictsBatch(conflicts: ConflictRecord[]) {
  const insertMany = db.transaction((items: ConflictRecord[]) => {
    const stmt = db.prepare(`
      INSERT INTO conflicts (
        conflict_id, user_id, requirement_1_id, requirement_2_id,
        conflict_type, severity, similarity_score, explanation,
        conflicting_elements, suggested_clarification, job_id, created_at
      ) VALUES (
        @conflict_id, @user_id, @requirement_1_id, @requirement_2_id,
        @conflict_type, @severity, @similarity_score, @explanation,
        @conflicting_elements, @suggested_clarification, @job_id, @created_at
      )
    `);
    for (const item of items) {
      stmt.run(item);
    }
  });
  insertMany(conflicts);
}

export function getConflictsByUserId(
  userId: string,
  filters?: {
    severity?: string;
    conflict_type?: string;
    document_id?: string;
    search?: string;
  }
): ConflictRecord[] {
  let query = `
    SELECT 
      c.*,
      r1.reference_code as r1_ref, r1.requirement_text as r1_text, r1.section as r1_section, r1.page_number as r1_page, r1.requirement_type as r1_type,
      d1.original_name as r1_doc_name, d1.document_id as r1_doc_id,
      r2.reference_code as r2_ref, r2.requirement_text as r2_text, r2.section as r2_section, r2.page_number as r2_page, r2.requirement_type as r2_type,
      d2.original_name as r2_doc_name, d2.document_id as r2_doc_id
    FROM conflicts c
    JOIN requirements r1 ON c.requirement_1_id = r1.requirement_id
    JOIN documents d1 ON r1.document_id = d1.document_id
    JOIN requirements r2 ON c.requirement_2_id = r2.requirement_id
    JOIN documents d2 ON r2.document_id = d2.document_id
    WHERE c.user_id = ?
  `;

  const params: any[] = [userId];

  if (filters?.severity && filters.severity !== 'all') {
    query += ' AND c.severity = ?';
    params.push(filters.severity);
  }

  if (filters?.conflict_type && filters.conflict_type !== 'all') {
    query += ' AND c.conflict_type = ?';
    params.push(filters.conflict_type);
  }

  if (filters?.document_id && filters.document_id !== 'all') {
    query += ' AND (r1.document_id = ? OR r2.document_id = ?)';
    params.push(filters.document_id, filters.document_id);
  }

  if (filters?.search) {
    const s = `%${filters.search}%`;
    query += ` AND (
      r1.reference_code LIKE ? OR r2.reference_code LIKE ? OR
      r1.requirement_text LIKE ? OR r2.requirement_text LIKE ? OR
      c.explanation LIKE ? OR c.conflicting_elements LIKE ?
    )`;
    params.push(s, s, s, s, s, s);
  }

  query += " ORDER BY CASE c.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, c.created_at DESC";

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => ({
    conflict_id: row.conflict_id,
    user_id: row.user_id,
    requirement_1_id: row.requirement_1_id,
    requirement_2_id: row.requirement_2_id,
    conflict_type: row.conflict_type,
    severity: row.severity,
    similarity_score: row.similarity_score,
    explanation: row.explanation,
    conflicting_elements: row.conflicting_elements,
    suggested_clarification: row.suggested_clarification,
    job_id: row.job_id,
    created_at: row.created_at,
    req1: {
      requirement_id: row.requirement_1_id,
      document_id: row.r1_doc_id,
      user_id: row.user_id,
      reference_code: row.r1_ref,
      requirement_text: row.r1_text,
      requirement_type: row.r1_type,
      section: row.r1_section,
      page_number: row.r1_page,
      priority: '',
      metadata: '{}',
      created_at: '',
      document_name: row.r1_doc_name
    },
    req2: {
      requirement_id: row.requirement_2_id,
      document_id: row.r2_doc_id,
      user_id: row.user_id,
      reference_code: row.r2_ref,
      requirement_text: row.r2_text,
      requirement_type: row.r2_type,
      section: row.r2_section,
      page_number: row.r2_page,
      priority: '',
      metadata: '{}',
      created_at: '',
      document_name: row.r2_doc_name
    }
  }));
}

export function getConflictById(conflictId: string, userId: string): ConflictRecord | undefined {
  const query = `
    SELECT 
      c.*,
      r1.reference_code as r1_ref, r1.requirement_text as r1_text, r1.section as r1_section, r1.page_number as r1_page, r1.requirement_type as r1_type,
      d1.original_name as r1_doc_name, d1.document_id as r1_doc_id,
      r2.reference_code as r2_ref, r2.requirement_text as r2_text, r2.section as r2_section, r2.page_number as r2_page, r2.requirement_type as r2_type,
      d2.original_name as r2_doc_name, d2.document_id as r2_doc_id
    FROM conflicts c
    JOIN requirements r1 ON c.requirement_1_id = r1.requirement_id
    JOIN documents d1 ON r1.document_id = d1.document_id
    JOIN requirements r2 ON c.requirement_2_id = r2.requirement_id
    JOIN documents d2 ON r2.document_id = d2.document_id
    WHERE c.conflict_id = ? AND c.user_id = ?
  `;

  const row = db.prepare(query).get(conflictId, userId) as any;
  if (!row) return undefined;

  return {
    conflict_id: row.conflict_id,
    user_id: row.user_id,
    requirement_1_id: row.requirement_1_id,
    requirement_2_id: row.requirement_2_id,
    conflict_type: row.conflict_type,
    severity: row.severity,
    similarity_score: row.similarity_score,
    explanation: row.explanation,
    conflicting_elements: row.conflicting_elements,
    suggested_clarification: row.suggested_clarification,
    job_id: row.job_id,
    created_at: row.created_at,
    req1: {
      requirement_id: row.requirement_1_id,
      document_id: row.r1_doc_id,
      user_id: row.user_id,
      reference_code: row.r1_ref,
      requirement_text: row.r1_text,
      requirement_type: row.r1_type,
      section: row.r1_section,
      page_number: row.r1_page,
      priority: '',
      metadata: '{}',
      created_at: '',
      document_name: row.r1_doc_name
    },
    req2: {
      requirement_id: row.requirement_2_id,
      document_id: row.r2_doc_id,
      user_id: row.user_id,
      reference_code: row.r2_ref,
      requirement_text: row.r2_text,
      requirement_type: row.r2_type,
      section: row.r2_section,
      page_number: row.r2_page,
      priority: '',
      metadata: '{}',
      created_at: '',
      document_name: row.r2_doc_name
    }
  };
}

export function clearConflictsForUser(userId: string) {
  const stmt = db.prepare('DELETE FROM conflicts WHERE user_id = ?');
  stmt.run(userId);
}

// Job operations
export function createAnalysisJob(job: AnalysisJobRecord): AnalysisJobRecord {
  const stmt = db.prepare(`
    INSERT INTO analysis_jobs (
      job_id, user_id, status, progress, current_step,
      document_ids, requirements_analyzed, conflicts_found, error_message, created_at, completed_at
    ) VALUES (
      @job_id, @user_id, @status, @progress, @current_step,
      @document_ids, @requirements_analyzed, @conflicts_found, @error_message, @created_at, @completed_at
    )
  `);
  stmt.run({
    error_message: null,
    completed_at: null,
    ...job
  });
  return job;
}

export function updateAnalysisJob(jobId: string, updates: Partial<AnalysisJobRecord>) {
  const fields = Object.keys(updates)
    .filter(k => k !== 'job_id')
    .map(k => `${k} = ?`)
    .join(', ');
  const values = Object.keys(updates)
    .filter(k => k !== 'job_id')
    .map(k => (updates as any)[k]);
  
  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE analysis_jobs SET ${fields} WHERE job_id = ?`);
    stmt.run(...values, jobId);
  }
}

export function getAnalysisJobById(jobId: string, userId: string): AnalysisJobRecord | undefined {
  const stmt = db.prepare('SELECT * FROM analysis_jobs WHERE job_id = ? AND user_id = ?');
  return stmt.get(jobId, userId) as AnalysisJobRecord | undefined;
}

export function getLatestAnalysisJob(userId: string): AnalysisJobRecord | undefined {
  const stmt = db.prepare('SELECT * FROM analysis_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
  return stmt.get(userId) as AnalysisJobRecord | undefined;
}

// Dashboard statistics
export function getDashboardStats(userId: string) {
  const docCount = (db.prepare('SELECT COUNT(*) as count FROM documents WHERE user_id = ?').get(userId) as any)?.count || 0;
  const reqCount = (db.prepare('SELECT COUNT(*) as count FROM requirements WHERE user_id = ?').get(userId) as any)?.count || 0;
  
  const conflictStats = db.prepare(`
    SELECT 
      COUNT(*) as total_conflicts,
      SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_count,
      SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_count,
      SUM(CASE WHEN conflict_type = 'Direct Contradiction' THEN 1 ELSE 0 END) as direct_contradictions,
      SUM(CASE WHEN conflict_type = 'Partial Conflict' THEN 1 ELSE 0 END) as partial_conflicts,
      SUM(CASE WHEN conflict_type = 'Semantic Overlap' THEN 1 ELSE 0 END) as semantic_overlaps,
      SUM(CASE WHEN conflict_type = 'Duplicate' THEN 1 ELSE 0 END) as duplicates,
      SUM(CASE WHEN conflict_type = 'Ambiguity' THEN 1 ELSE 0 END) as ambiguities,
      SUM(CASE WHEN conflict_type = 'Potential Conflict' THEN 1 ELSE 0 END) as potential_conflicts
    FROM conflicts
    WHERE user_id = ?
  `).get(userId) as any;

  // Conflicts grouped by document pair
  const conflictsByDoc = db.prepare(`
    SELECT 
      d1.original_name as doc_name,
      COUNT(c.conflict_id) as count
    FROM conflicts c
    JOIN requirements r1 ON c.requirement_1_id = r1.requirement_id
    JOIN documents d1 ON r1.document_id = d1.document_id
    WHERE c.user_id = ?
    GROUP BY d1.document_id
    ORDER BY count DESC
    LIMIT 5
  `).all(userId) as any[];

  return {
    total_documents: docCount,
    total_requirements: reqCount,
    total_conflicts: conflictStats?.total_conflicts || 0,
    critical_conflicts: conflictStats?.critical_count || 0,
    high_conflicts: conflictStats?.high_count || 0,
    medium_conflicts: conflictStats?.medium_count || 0,
    low_conflicts: conflictStats?.low_count || 0,
    by_type: {
      'Direct Contradiction': conflictStats?.direct_contradictions || 0,
      'Partial Conflict': conflictStats?.partial_conflicts || 0,
      'Semantic Overlap': conflictStats?.semantic_overlaps || 0,
      'Duplicate': conflictStats?.duplicates || 0,
      'Ambiguity': conflictStats?.ambiguities || 0,
      'Potential Conflict': conflictStats?.potential_conflicts || 0
    },
    by_document: conflictsByDoc
  };
}

export default db;
