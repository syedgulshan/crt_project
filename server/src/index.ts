import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import { initDatabase } from './config/database.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import requirementsRouter from './routes/requirements.js';
import analysisRouter from './routes/analysis.js';
import reportsRouter from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Requirement Conflict & Overlap Analyzer API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/requirements', requirementsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/reports', reportsRouter);

// Production Static Serving for Single-Port EC2 Deployment
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production static files from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected internal error occurred.';
  res.status(status).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred processing your request.' : message
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  REQUIREMENT CONFLICT & OVERLAP ANALYZER SERVER`);
  console.log(`  Running on: http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

export default app;
