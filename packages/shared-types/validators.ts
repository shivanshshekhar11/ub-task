/**
 * Shared Zod validation schemas — single source of truth for request validation
 * and OpenAPI documentation across the entire stack.
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 * `extendZodWithOpenApi` patches the Zod prototype once, enabling `.openapi()`
 * on every schema. The backend's openapi.ts uses an OpenAPIRegistry to collect
 * these schemas and generate a full OpenAPI 3.0 document — no YAML, no JSDoc
 * comments, no separate schema file. The frontend's api.ts uses the same
 * schemas for pre-flight validation before every mutating fetch().
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Must be called once before any schema is defined.
extendZodWithOpenApi(z);

// ── Cart ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/cart/:cartId/items
 * Adds a product to the cart. Stacks if the product is already present.
 */
export const addItemSchema = z
  .object({
    productId: z.string().min(1, 'productId is required').openapi({ example: 'prod-2' }),
    quantity: z
      .number({ invalid_type_error: 'quantity must be a number' })
      .int('quantity must be a whole number')
      .positive('quantity must be at least 1')
      .openapi({ example: 1 }),
  })
  .openapi('AddItemRequest');

export type AddItemInput = z.infer<typeof addItemSchema>;

/**
 * PATCH /api/cart/:cartId/items/:productId
 * Updates the quantity of an item. Setting quantity to 0 removes the item.
 */
export const updateItemSchema = z
  .object({
    quantity: z
      .number({ invalid_type_error: 'quantity must be a number' })
      .int('quantity must be a whole number')
      .min(0, 'quantity must be 0 or more')
      .openapi({ example: 3, description: 'New absolute quantity. Set to 0 to remove the item.' }),
  })
  .openapi('UpdateItemRequest');

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// ── Checkout ──────────────────────────────────────────────────────────────────

/**
 * POST /api/checkout
 * Places an order from the cart with an optional discount code.
 */
export const checkoutSchema = z
  .object({
    cartId: z.string().min(1, 'cartId is required').openapi({ example: 'cart-abc123' }),
    discountCode: z
      .string()
      .trim()
      .min(1, 'Discount code cannot be blank — leave it empty to skip')
      .openapi({ example: 'SAVE10-A3F7B2C1' })
      .optional()
      .or(z.literal('')),
  })
  .openapi('CheckoutRequest');

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Formats a ZodError into a human-readable single-line message.
 * Used by both the backend (middleware) and frontend (api.ts pre-flight guard).
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((e) => (e.path.length > 0 ? `${e.path.join('.')}: ${e.message}` : e.message))
    .join('; ');
}
