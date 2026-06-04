import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Factory that returns a middleware enforcing that the caller
 * has one of the specified roles.
 *
 * Usage on a route:
 *   router.post('/services', verifyJWT, requireRole('ADMIN', 'OWNER'), create);
 *
 * This eliminates the duplicated role-check blocks that previously
 * lived inside every controller body.
 */
export function requireRole(...roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            return;
        }
        next();
    };
}
