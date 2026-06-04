import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
        branchId: string;
    };
}

/**
 * JWT verification middleware.
 *
 * Attaches the decoded token payload to `req.user`.
 * Rejects requests that:
 *  - Have no Bearer token
 *  - Have an invalid or expired token
 *  - Have a role that is not ADMIN or OWNER
 */
export const verifyJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];

        // Validate that all required payload fields are present.
        // Guards against malformed or old tokens that passed signature
        // verification but are missing fields relied upon downstream.
        if (
            !decoded ||
            typeof decoded.userId !== 'string' || !decoded.userId ||
            typeof decoded.role !== 'string' || !decoded.role ||
            typeof decoded.branchId !== 'string' || !decoded.branchId
        ) {
            res.status(401).json({ error: 'Invalid token payload. Please re-authenticate.' });
            return;
        }

        req.user = decoded;

        if (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER') {
            res.status(403).json({ error: 'Access denied. Admins or owners only.' });
            return;
        }

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
