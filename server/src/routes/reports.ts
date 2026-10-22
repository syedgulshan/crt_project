import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { getConflictsByUserId, getDashboardStats } from '../config/database.js';
import { 
  generateMarkdownReport, 
  generateCsvReport, 
  generatePrintableHtmlReport 
} from '../services/reportGenerator.js';

const router = Router();
router.use(authMiddleware);

// Export as Markdown
router.get('/markdown', (req: AuthenticatedRequest, res: Response) => {
  const conflicts = getConflictsByUserId(req.user!.userId);
  const stats = getDashboardStats(req.user!.userId);
  const md = generateMarkdownReport(conflicts, stats, req.user!.displayName);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="requirement-conflict-report.md"');
  res.send(md);
});

// Export as CSV
router.get('/csv', (req: AuthenticatedRequest, res: Response) => {
  const conflicts = getConflictsByUserId(req.user!.userId);
  const csv = generateCsvReport(conflicts);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="requirement-conflicts.csv"');
  res.send(csv);
});

// View / Print as HTML (suitable for browser Print-to-PDF)
router.get('/html', (req: AuthenticatedRequest, res: Response) => {
  const conflicts = getConflictsByUserId(req.user!.userId);
  const stats = getDashboardStats(req.user!.userId);
  const html = generatePrintableHtmlReport(conflicts, stats, req.user!.displayName);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Export full structured JSON
router.get('/json', (req: AuthenticatedRequest, res: Response) => {
  const conflicts = getConflictsByUserId(req.user!.userId);
  const stats = getDashboardStats(req.user!.userId);

  res.json({
    generated_at: new Date().toISOString(),
    user: req.user,
    stats,
    conflicts
  });
});

export default router;
