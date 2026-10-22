export type ConflictType = 
  | 'Direct Contradiction'
  | 'Partial Conflict'
  | 'Semantic Overlap'
  | 'Duplicate'
  | 'Ambiguity'
  | 'Potential Conflict';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type RequirementType = 
  | 'Functional'
  | 'Non-Functional'
  | 'Security'
  | 'Performance'
  | 'Business Rule'
  | 'UI/UX'
  | 'Compliance';

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  provider: 'google' | 'apple' | 'demo';
  created_at: string;
}

export interface DocumentRecord {
  document_id: string;
  user_id: string;
  filename: string;
  original_name: string;
  document_type: string; // 'srs' | 'brd' | 'frd' | 'prd' | 'pdf' | 'docx' | 'txt'
  file_path: string;
  file_size: number;
  upload_date: string;
  status: 'uploaded' | 'extracting' | 'analyzing' | 'completed' | 'failed';
  requirement_count: number;
  error_message?: string | null;
}

export interface RequirementRecord {
  requirement_id: string;
  document_id: string;
  user_id: string;
  reference_code: string;
  requirement_text: string;
  requirement_type: RequirementType;
  section: string;
  page_number: number | null;
  priority: string;
  metadata: string; // JSON string with extra attributes (actors, conditions, tags)
  created_at: string;
  // Joined fields
  document_name?: string;
  document_type?: string;
}

export interface ConflictRecord {
  conflict_id: string;
  user_id: string;
  requirement_1_id: string;
  requirement_2_id: string;
  conflict_type: ConflictType;
  severity: SeverityLevel;
  similarity_score: number;
  explanation: string;
  conflicting_elements: string;
  suggested_clarification: string;
  job_id?: string | null;
  created_at: string;
  // Hydrated requirement info
  req1?: RequirementRecord;
  req2?: RequirementRecord;
}

export interface AnalysisJobRecord {
  job_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  document_ids: string; // JSON array of document_ids
  requirements_analyzed: number;
  conflicts_found: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ParsedRequirement {
  reference_code: string;
  requirement_text: string;
  requirement_type: RequirementType;
  section: string;
  page_number: number | null;
  priority: string;
  metadata?: Record<string, any>;
}

export interface DetectedConflict {
  req1_ref: string;
  req2_ref: string;
  req1_text: string;
  req2_text: string;
  conflict_type: ConflictType;
  severity: SeverityLevel;
  similarity_score: number;
  conflicting_elements: string;
  explanation: string;
  suggested_clarification: string;
}
