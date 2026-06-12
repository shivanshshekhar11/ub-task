/**
 * Zod schemas for all domain types — with .openapi() annotations.
 *
 * These schemas are the single source of truth for:
 *   1. TypeScript types (inferred via z.infer<>) — replacing the hand-written interfaces
 *   2. Runtime validation in the backend (where needed)
 *   3. OpenAPI 3.0 spec generation (via zod-to-openapi in the backend's openapi.ts)
 *
 * The frontend and backend both import from here. The backend's openapi.ts
 * passes these directly to the OpenAPIRegistry — no schema re-definition anywhere.
 */

import { z } from 'zod';

// extendZodWithOpenApi is already called in validators.ts which is imported
// first via index.ts. This file relies on that call having happened.

// ── Primitive ─────────────────────────────────────────────────────────────────

export const ISODateStringSchema = z
  .string()
  .openapi({ format: 'date-time', example: '2024-06-11T17:00:00.000Z' });

// ── Product ───────────────────────────────────────────────────────────────────

export const ProductSchema = z
  .object({
    id: z.string().openapi({ example: 'prod-1' }),
    name: z.string().openapi({ example: 'Term Life Insurance' }),
    description: z.string().openapi({ example: 'Comprehensive life coverage for 20 years.' }),
    price: z.number().openapi({ example: 299.99, description: 'Annual premium in USD.' }),
    category: z.string().openapi({ example: 'Life' }),
  })
  .openapi('Product');

// ── Cart ──────────────────────────────────────────────────────────────────────

export const CartItemSchema = z
  .object({
    productId: z.string().openapi({ example: 'prod-1' }),
    productName: z.string().openapi({ example: 'Term Life Insurance' }),
    unitPrice: z.number().openapi({ example: 299.99 }),
    quantity: z.number().int().openapi({ example: 2 }),
  })
  .openapi('CartItem');

export const CartSchema = z
  .object({
    id: z.string().openapi({ example: 'cart-abc123' }),
    items: z.array(CartItemSchema),
    createdAt: ISODateStringSchema,
    updatedAt: ISODateStringSchema,
  })
  .openapi('Cart');

// ── Order ─────────────────────────────────────────────────────────────────────

export const OrderItemSchema = z
  .object({
    productId: z.string().openapi({ example: 'prod-1' }),
    productName: z.string().openapi({ example: 'Term Life Insurance' }),
    unitPrice: z.number().openapi({ example: 299.99 }),
    quantity: z.number().int().openapi({ example: 2 }),
  })
  .openapi('OrderItem');

export const OrderSchema = z
  .object({
    id: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000', format: 'uuid' }),
    orderNumber: z
      .number()
      .int()
      .openapi({ example: 5, description: 'Sequential counter across all orders.' }),
    items: z.array(OrderItemSchema),
    subtotal: z.number().openapi({ example: 599.98 }),
    discountCode: z
      .string()
      .optional()
      .openapi({ example: 'SAVE10-A3F7B2C1', description: 'Applied code, if any.' }),
    discountPercent: z.number().openapi({ example: 10 }),
    discountAmount: z.number().openapi({ example: 60.0 }),
    total: z.number().openapi({ example: 539.98 }),
    createdAt: ISODateStringSchema,
  })
  .openapi('Order');

// ── Discount ──────────────────────────────────────────────────────────────────

export const DiscountCodeSchema = z
  .object({
    code: z.string().openapi({
      example: 'SAVE10-A3F7B2C1',
      description:
        'Format: SAVE{X}-{8-char suffix}. The prefix encodes the discount percent.',
    }),
    discountPercent: z.number().min(1).max(100).openapi({ example: 10 }),
    isUsed: z.boolean().openapi({ example: false }),
    createdAt: ISODateStringSchema,
    generatedForMilestone: z
      .number()
      .int()
      .openapi({ example: 1, description: 'Which c*N-th order milestone this code targets.' }),
    usedByOrderId: z
      .string()
      .optional()
      .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    usedAt: ISODateStringSchema.optional(),
  })
  .openapi('DiscountCode');

// ── Store Stats ───────────────────────────────────────────────────────────────

export const StoreStatsSchema = z
  .object({
    totalOrders: z.number().int().openapi({ example: 12 }),
    totalItemsPurchased: z.number().int().openapi({ example: 28 }),
    totalRevenue: z.number().openapi({ example: 3599.76 }),
    totalDiscountCodes: z.number().int().openapi({ example: 2 }),
    usedDiscountCodes: z.number().int().openapi({ example: 1 }),
    totalDiscountAmount: z.number().openapi({ example: 60.0 }),
    discountCodes: z.array(DiscountCodeSchema),
  })
  .openapi('StoreStats');

// ── Discount Status ───────────────────────────────────────────────────────────

export const DiscountStatusSchema = z
  .object({
    eligible: z
      .boolean()
      .openapi({ example: true, description: 'Whether the admin can generate a code right now.' }),
    totalOrders: z.number().int().openapi({ example: 4 }),
    milestonesGenerated: z.number().int().openapi({ example: 0 }),
    windowOpensAfterOrder: z
      .number()
      .int()
      .openapi({ example: 4, description: 'Inclusive lower bound of the current window.' }),
    windowClosesAfterOrder: z
      .number()
      .int()
      .openapi({ example: 5, description: 'Placing this order closes the window.' }),
    discountInterval: z.number().int().openapi({ example: 5 }),
    discountPercent: z.number().openapi({ example: 10 }),
  })
  .openapi('DiscountStatus');

// ── Common responses ──────────────────────────────────────────────────────────

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Discount code 'FAKE' is invalid" }),
    statusCode: z.number().int().openapi({ example: 400 }),
  })
  .openapi('ErrorResponse');

export const CheckoutResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Order placed successfully' }),
    order: OrderSchema,
  })
  .openapi('CheckoutResponse');

export const GenerateCodeResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Discount code generated successfully' }),
    code: DiscountCodeSchema,
  })
  .openapi('GenerateCodeResponse');
