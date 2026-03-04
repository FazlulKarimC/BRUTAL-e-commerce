import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found error handler
 */
export function notFound(req: Request, res: Response, next: NextFunction): void {
    const error = new ApiError(404, `Not found: ${req.originalUrl}`);
    next(error);
}

/**
 * Global error handler middleware
 */
export function errorHandler(
    error: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Log error in development
    if (env.isDevelopment) {
        console.error('Error:', error);
    }

    // Handle API errors
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            error: error.message,
            ...(env.isDevelopment && { stack: error.stack }),
        });
        return;
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;

        if (prismaError.code === 'P2002') {
            res.status(409).json({
                error: 'A record with this value already exists',
                field: prismaError.meta?.target?.[0],
            });
            return;
        }

        if (prismaError.code === 'P2025') {
            res.status(404).json({
                error: 'Record not found',
            });
            return;
        }
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
        res.status(400).json({
            error: 'Validation failed',
            details: (error as any).errors,
        });
        return;
    }


    // Default error response
    res.status(500).json({
        error: env.isDevelopment ? error.message : 'Internal server error',
        ...(env.isDevelopment && { stack: error.stack }),
    });
}
