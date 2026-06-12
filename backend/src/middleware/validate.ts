import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { formatZodError } from '@ub-task/shared-types';

/**
 * Factory function that returns an Express middleware which validates
 * req.body against a Zod schema.
 *
 * On success: replaces req.body with the parsed (and coerced) value.
 * On failure: returns 400 with a human-readable error message.
 *
 * Uses the shared `formatZodError` helper from @ub-task/shared-types so that
 * the backend and frontend produce identical error strings for the same input —
 * both layers share schema + formatter.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: formatZodError(result.error),
        statusCode: 400,
      });
      return;
    }
    req.body = result.data;
    next();
  };
