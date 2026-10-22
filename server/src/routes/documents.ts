import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { 
  createDocument, 
  getDocumentsByUserId, 
  getDocumentById, 
  deleteDocument,
  updateDocumentStatus,
  createRequirementsBatch,
  getRequirementsByDocumentId
} from '../config/database.js';
import { parseDocument } from '../services/documentParser.js';
import { extractRequirementsFromDocument } from '../services/requirementExtractor.js';
import { seedDemoData } from '../services/demoData.js';
import { RequirementRecord } from '../types/index.js';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authMiddleware);

// Get all documents for current user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const docs = getDocumentsByUserId(req.user!.userId);
  res.json({ documents: docs });
});

// Get single document with requirements
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const doc = getDocumentById(req.params.id as string, req.user!.userId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const requirements = getRequirementsByDocumentId(doc.document_id, req.user!.userId);
  res.json({ document: doc, requirements });
});

// Upload document(s) and extract requirements
router.post('/upload', upload.array('files', 10), async (req: AuthenticatedRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const userId = req.user!.userId;
  const processedDocs: any[] = [];

  for (const file of files) {
    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    // Determine document type from name or extension
    let docType = ext;
    const lowerName = file.originalname.toLowerCase();
    if (lowerName.includes('srs')) docType = 'srs';
    else if (lowerName.includes('brd')) docType = 'brd';
    else if (lowerName.includes('frd')) docType = 'frd';
    else if (lowerName.includes('prd')) docType = 'prd';

    // 1. Initial State: Uploaded
    const docRecord = {
      document_id: docId,
      user_id: userId,
      filename: file.filename,
      original_name: file.originalname,
      document_type: docType,
      file_path: file.path,
      file_size: file.size,
      upload_date: new Date().toISOString(),
      status: 'extracting' as const,
      requirement_count: 0,
      error_message: null
    };

    createDocument(docRecord);

    try {
      // 2. Parse text content
      const content = await parseDocument(file.path, file.originalname);

      // 3. Extract requirements
      const parsedReqs = extractRequirementsFromDocument(content, docType, file.originalname);

      // 4. Save extracted requirements to DB
      const now = new Date().toISOString();
      const recordsToInsert: RequirementRecord[] = parsedReqs.map(p => ({
        requirement_id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        document_id: docId,
        user_id: userId,
        reference_code: p.reference_code,
        requirement_text: p.requirement_text,
        requirement_type: p.requirement_type,
        section: p.section,
        page_number: p.page_number,
        priority: p.priority,
        metadata: JSON.stringify(p.metadata || {}),
        created_at: now
      }));

      createRequirementsBatch(recordsToInsert);

      // 5. Update document status to completed
      updateDocumentStatus(docId, userId, 'completed', recordsToInsert.length);

      processedDocs.push({
        document_id: docId,
        original_name: file.originalname,
        document_type: docType,
        requirement_count: recordsToInsert.length,
        status: 'completed'
      });
    } catch (err: any) {
      console.error(`Failed to process uploaded file ${file.originalname}:`, err);
      updateDocumentStatus(docId, userId, 'failed', 0, err.message);
      processedDocs.push({
        document_id: docId,
        original_name: file.originalname,
        document_type: docType,
        requirement_count: 0,
        status: 'failed',
        error_message: err.message
      });
    }
  }

  res.json({
    message: `Processed ${processedDocs.length} document(s)`,
    documents: processedDocs
  });
});

// Delete document
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const doc = getDocumentById(req.params.id as string, req.user!.userId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Attempt to delete physical file if it exists and is not demo
  try {
    if (fs.existsSync(doc.file_path) && !doc.file_path.startsWith('demo/')) {
      fs.unlinkSync(doc.file_path);
    }
  } catch (e) {
    // Ignore unlink error
  }

  deleteDocument(doc.document_id, req.user!.userId);
  res.json({ success: true, message: 'Document deleted successfully' });
});

// Seed demo data
router.post('/seed-demo', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await seedDemoData(req.user!.userId);
    res.json({
      success: true,
      message: 'Demo dataset loaded successfully with sample SRS, BRD, and FRD documents!',
      ...result
    });
  } catch (err: any) {
    console.error('Failed to seed demo data:', err);
    res.status(500).json({ error: 'Failed to seed demo data', message: err.message });
  }
});

export default router;
