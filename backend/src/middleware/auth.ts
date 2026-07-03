import type { Request, Response, NextFunction } from 'express';
import { hasAccess } from '../google/oauth.js';

export function requireAccess(req: Request, res: Response, next: NextFunction) {
	const email = (req.session as any)?.email;
	if (!hasAccess(email)) return res.status(401).json({ error: 'NO_ACCESS' });
	next();
}
