import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { upsertUser, getUserById } from '../config/database.js';

const router = Router();

// Endpoint called after client completes Firebase Login
router.post('/session', (req, res) => {
  const { userId, email, displayName, provider } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  const user = {
    user_id: userId,
    email: email,
    display_name: displayName || email.split('@')[0],
    provider: (provider === 'apple' ? 'apple' : 'google') as 'google' | 'apple',
    created_at: new Date().toISOString()
  };

  upsertUser(user);

  // Return a session token for client use
  const sessionToken = Buffer.from(JSON.stringify({
    uid: user.user_id,
    email: user.email,
    name: user.display_name,
    firebase: { sign_in_provider: user.provider }
  })).toString('base64');

  res.json({
    success: true,
    user,
    token: `usr.${sessionToken}`
  });
});

// Demo login endpoint for instant frictionless testing
router.post('/demo-login', (req, res) => {
  const { provider = 'google' } = req.body;
  const demoUserId = 'demo-analyst-enterprise';

  const user = {
    user_id: demoUserId,
    email: provider === 'apple' ? 'apple.analyst@enterprise.io' : 'google.analyst@enterprise.io',
    display_name: provider === 'apple' ? 'Apple Verified Analyst' : 'Lead Requirements Architect',
    provider: (provider === 'apple' ? 'apple' : 'demo') as any,
    created_at: new Date().toISOString()
  };

  upsertUser(user);

  res.json({
    success: true,
    user,
    token: 'demo-token-enterprise-reqs'
  });
});

// Check current user profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = getUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

export default router;
