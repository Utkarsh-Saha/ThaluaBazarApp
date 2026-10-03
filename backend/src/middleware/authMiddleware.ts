import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role?: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid session' });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.user_metadata?.role || 'buyer',
    };

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Authentication failed', details: err.message });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.user_metadata?.role || 'buyer',
        };
      }
    } catch {
      // ignore
    }
  }
  next();
}
