import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.ts';

/**
 * Global Express error-handling middleware.
 * Must have exactly 4 parameters (err, req, res, next) to be recognised
 * as an error handler by Express.
 *
 * Distinguishes between known AppErrors (operational errors that should
 * surface to the client) and unexpected errors (bugs, which return 500).
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected/programming errors — log for debugging, hide internals from client
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'An unexpected error occurred',
    statusCode: 500,
  });
};
