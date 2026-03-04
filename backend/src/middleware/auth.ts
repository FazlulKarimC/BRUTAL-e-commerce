import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { auth } from '../config/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { UserRole } from '@prisma/client';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: UserRole;
                sessionId?: string;
            };
        }
    }
}

/**
 * Authentication middleware - validates Better Auth session
 * Sets req.user if session is valid
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        req.user = {
            userId: session.user.id,
            email: session.user.email,
            role: (session.user as { role: UserRole }).role,
            sessionId: session.session.id
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Optional authentication - sets user if token present, but doesn't require it
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (session) {
            req.user = {
                userId: session.user.id,
                email: session.user.email,
                role: (session.user as { role: UserRole }).role,
                sessionId: session.session.id
            };
        }

        next();
    } catch {
        // Ignore errors and proceed without auth
        next();
    }
}
