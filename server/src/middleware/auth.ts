import { Request, Response, NextFunction } from 'express';
import { upsertUser } from '../config/database.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    displayName: string;
    provider: 'google' | 'apple' | 'demo';
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !queryToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required to access this resource.'
    });
  }

  const token = (queryToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : '')).trim();

  try {
    // If the token is a base64 encoded JSON session token (from client auth context)
    // or a Firebase token format
    let decodedUser: any = null;

    if (token.startsWith('demo-token-')) {
      // Demo session token
      decodedUser = {
        userId: 'demo-analyst-enterprise',
        email: 'google.analyst@enterprise.io',
        displayName: 'Lead Requirements Architect',
        provider: 'demo'
      };
    } else if (token.includes('.')) {
      // JWT token (Firebase ID token or simulated JWT)
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);

        decodedUser = {
          userId: payload.user_id || payload.sub || payload.uid || 'user-' + Date.now(),
          email: payload.email || 'user@example.com',
          displayName: payload.name || payload.display_name || 'Enterprise Analyst',
          provider: payload.firebase?.sign_in_provider?.includes('apple') ? 'apple' : 'google'
        };
      } catch (err) {
        // Fallback for custom formatted token
        decodedUser = {
          userId: `usr-${token.substring(0, 16)}`,
          email: 'analyst@enterprise.io',
          displayName: 'Enterprise User',
          provider: 'google'
        };
      }
    } else {
      // Direct user ID token
      decodedUser = {
        userId: token,
        email: `${token}@enterprise.io`,
        displayName: 'Enterprise User',
        provider: 'google'
      };
    }

    if (!decodedUser || !decodedUser.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authentication token.' });
    }

    // Ensure user exists in SQLite database
    upsertUser({
      user_id: decodedUser.userId,
      email: decodedUser.email,
      display_name: decodedUser.displayName,
      provider: decodedUser.provider,
      created_at: new Date().toISOString()
    });

    req.user = decodedUser;
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to authenticate user.'
    });
  }
}
