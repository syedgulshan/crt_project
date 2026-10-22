import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { 
  getRequirementsByUserId, 
  createConflictsBatch, 
  getConflictsByUserId, 
  getConflictById, 
  clearConflictsForUser,
  createAnalysisJob,
  updateAnalysisJob,
  getAnalysisJobById,
  getLatestAnalysisJob,
  getDashboardStats
} from '../config/database.js';
import { analyzeRequirementPairs } from '../services/semanticAnalyzer.js';
import { ConflictRecord, AnalysisJobRecord } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const stats = getDashboardStats(req.user!.userId);
  res.json({ stats });
});

// Run semantic analysis across requirements
router.post('/run', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { documentIds, provider = 'auto', geminiApiKey, openaiApiKey } = req.body;

  // Retrieve requirements to analyze
  let allReqs = getRequirementsByUserId(userId);
  if (Array.isArray(documentIds) && documentIds.length > 0) {
    allReqs = allReqs.filter(r => documentIds.includes(r.document_id));
  }

  if (allReqs.length === 0) {
    return res.status(400).json({
      error: 'No requirements found to analyze. Please upload documents or load demo data first.'
    });
  }

  // Create an analysis job record
  const jobId = `job-${Date.now()}`;
  const job: AnalysisJobRecord = {
    job_id: jobId,
    user_id: userId,
    status: 'processing',
    progress: 15,
    current_step: 'Extracting semantic profiles & intent vectors',
    document_ids: JSON.stringify(documentIds || []),
    requirements_analyzed: allReqs.length,
    conflicts_found: 0,
    created_at: new Date().toISOString()
  };
  createAnalysisJob(job);

  try {
    updateAnalysisJob(jobId, {
      progress: 35,
      current_step: 'Comparing semantic intents and logical constraints'
    });

    // Run semantic analyzer
    const rawFindings = await analyzeRequirementPairs(allReqs, {
      provider,
      geminiApiKey,
      openaiApiKey
    });

    updateAnalysisJob(jobId, {
      progress: 75,
      current_step: 'Structuring explanations and assigning severity'
    });

    // Map reference codes back to requirement IDs
    const refMap = new Map<string, string>();
    for (const r of allReqs) {
      refMap.set(r.reference_code, r.requirement_id);
    }

    const now = new Date().toISOString();
    const conflictsToInsert: ConflictRecord[] = [];

    // Clear prior conflicts to avoid duplicates if re-analyzing
    clearConflictsForUser(userId);

    for (const f of rawFindings) {
      const req1Id = refMap.get(f.req1_ref) || allReqs.find(r => r.requirement_text === f.req1_text)?.requirement_id;
      const req2Id = refMap.get(f.req2_ref) || allReqs.find(r => r.requirement_text === f.req2_text)?.requirement_id;

      if (req1Id && req2Id) {
        conflictsToInsert.push({
          conflict_id: `cnf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          user_id: userId,
          requirement_1_id: req1Id,
          requirement_2_id: req2Id,
          conflict_type: f.conflict_type,
          severity: f.severity,
          similarity_score: f.similarity_score,
          explanation: f.explanation,
          conflicting_elements: f.conflicting_elements,
          suggested_clarification: f.suggested_clarification,
          job_id: jobId,
          created_at: now
        });
      }
    }

    if (conflictsToInsert.length > 0) {
      createConflictsBatch(conflictsToInsert);
    }

    // Mark job completed
    updateAnalysisJob(jobId, {
      status: 'completed',
      progress: 100,
      current_step: 'Completed',
      conflicts_found: conflictsToInsert.length,
      completed_at: new Date().toISOString()
    });

    res.json({
      success: true,
      jobId,
      status: 'completed',
      requirements_analyzed: allReqs.length,
      conflicts_found: conflictsToInsert.length
    });
  } catch (err: any) {
    console.error('Analysis error:', err);
    updateAnalysisJob(jobId, {
      status: 'failed',
      error_message: err.message,
      completed_at: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Analysis failed',
      message: err.message
    });
  }
});

// Check status of an analysis job
router.get('/status/:jobId', (req: AuthenticatedRequest, res: Response) => {
  const job = getAnalysisJobById(req.params.jobId as string, req.user!.userId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({ job });
});

// Get latest job
router.get('/latest-job', (req: AuthenticatedRequest, res: Response) => {
  const job = getLatestAnalysisJob(req.user!.userId);
  res.json({ job: job || null });
});

// Get conflicts list with search & filters
router.get('/conflicts', (req: AuthenticatedRequest, res: Response) => {
  const { severity, conflict_type, document_id, search } = req.query as {
    severity?: string;
    conflict_type?: string;
    document_id?: string;
    search?: string;
  };

  const conflicts = getConflictsByUserId(req.user!.userId, {
    severity,
    conflict_type,
    document_id,
    search
  });

  res.json({
    conflicts,
    count: conflicts.length
  });
});

// Get single conflict with side-by-side comparison data
router.get('/conflicts/:id', (req: AuthenticatedRequest, res: Response) => {
  const conflict = getConflictById(req.params.id as string, req.user!.userId);
  if (!conflict) {
    return res.status(404).json({ error: 'Conflict not found' });
  }

  res.json({ conflict });
});

export default router;
