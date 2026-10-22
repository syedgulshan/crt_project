import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { getRequirementsByUserId, getRequirementById } from '../config/database.js';

const router = Router();
router.use(authMiddleware);

// Get requirements for current user with optional filtering
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { document_id, type, search } = req.query as {
    document_id?: string;
    type?: string;
    search?: string;
  };

  let reqs = getRequirementsByUserId(req.user!.userId, document_id);

  if (type && type !== 'all') {
    reqs = reqs.filter(r => r.requirement_type.toLowerCase() === type.toLowerCase());
  }

  if (search) {
    const s = search.toLowerCase();
    reqs = reqs.filter(r => 
      r.reference_code.toLowerCase().includes(s) ||
      r.requirement_text.toLowerCase().includes(s) ||
      (r.section && r.section.toLowerCase().includes(s)) ||
      (r.document_name && r.document_name.toLowerCase().includes(s))
    );
  }

  res.json({ requirements: reqs, count: reqs.length });
});

// Get single requirement with full traceability
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const reqItem = getRequirementById(req.params.id as string, req.user!.userId);
  if (!reqItem) {
    return res.status(404).json({ error: 'Requirement not found' });
  }

  res.json({ requirement: reqItem });
});

export default router;
