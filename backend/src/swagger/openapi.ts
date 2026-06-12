/**
 * OpenAPI 3.0 specification — generated programmatically from the shared Zod schemas.
 *
 * All schema definitions live in @ub-task/shared-types/schemas.ts.
 * This file only does two things:
 *   1. Registers those schemas + route paths in an OpenAPIRegistry
 *   2. Exports generateSpec() which app.ts passes to Scalar
 *
 * No schema is defined here. If you need to change a type, change it in
 * packages/shared-types/schemas.ts — types, validation, and docs all update.
 */

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  // Domain schemas
  ProductSchema,
  CartSchema,
  OrderSchema,
  DiscountCodeSchema,
  StoreStatsSchema,
  DiscountStatusSchema,
  ErrorResponseSchema,
  CheckoutResponseSchema,
  GenerateCodeResponseSchema,
  // Request schemas
  addItemSchema,
  updateItemSchema,
  checkoutSchema,
} from '@ub-task/shared-types';

export const registry = new OpenAPIRegistry();

// ── Register domain schemas ───────────────────────────────────────────────────
// Registering here makes them available as $ref targets in the route definitions below.

registry.register('Product',        ProductSchema);
registry.register('Cart',           CartSchema);
registry.register('Order',          OrderSchema);
registry.register('DiscountCode',   DiscountCodeSchema);
registry.register('StoreStats',     StoreStatsSchema);
registry.register('DiscountStatus', DiscountStatusSchema);
registry.register('ErrorResponse',  ErrorResponseSchema);

registry.register('AddItemRequest',    addItemSchema);
registry.register('UpdateItemRequest', updateItemSchema);
registry.register('CheckoutRequest',   checkoutSchema);

// ── Route definitions ─────────────────────────────────────────────────────────

// Products
registry.registerPath({
  method: 'get', path: '/api/products', tags: ['Products'],
  summary: 'List all products',
  responses: {
    200: { description: 'Array of all products.', content: { 'application/json': { schema: z.array(ProductSchema) } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/products/{id}', tags: ['Products'],
  summary: 'Get a product by ID',
  request: { params: z.object({ id: z.string().openapi({ example: 'prod-1' }) }) },
  responses: {
    200: { description: 'Product found.', content: { 'application/json': { schema: ProductSchema } } },
    404: { description: 'Product not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// Cart
registry.registerPath({
  method: 'get', path: '/api/cart/{cartId}', tags: ['Cart'],
  summary: 'Get cart contents',
  request: { params: z.object({ cartId: z.string().openapi({ example: 'cart-abc123' }) }) },
  responses: {
    200: { description: 'Cart found.', content: { 'application/json': { schema: CartSchema } } },
    404: { description: 'Cart not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/cart/{cartId}/items', tags: ['Cart'],
  summary: 'Add item to cart',
  description: 'If the product is already in the cart, quantities are summed.',
  request: {
    params: z.object({ cartId: z.string().openapi({ example: 'cart-abc123' }) }),
    body: { content: { 'application/json': { schema: addItemSchema } } },
  },
  responses: {
    200: { description: 'Updated cart.', content: { 'application/json': { schema: CartSchema } } },
    400: { description: 'Validation error.', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Product not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch', path: '/api/cart/{cartId}/items/{productId}', tags: ['Cart'],
  summary: 'Update item quantity',
  description: 'Setting quantity to 0 removes the item.',
  request: {
    params: z.object({
      cartId:    z.string().openapi({ example: 'cart-abc123' }),
      productId: z.string().openapi({ example: 'prod-2' }),
    }),
    body: { content: { 'application/json': { schema: updateItemSchema } } },
  },
  responses: {
    200: { description: 'Updated cart.', content: { 'application/json': { schema: CartSchema } } },
    400: { description: 'Validation error.', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Cart or item not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/cart/{cartId}/items/{productId}', tags: ['Cart'],
  summary: 'Remove item from cart',
  request: {
    params: z.object({
      cartId:    z.string().openapi({ example: 'cart-abc123' }),
      productId: z.string().openapi({ example: 'prod-2' }),
    }),
  },
  responses: {
    200: { description: 'Updated cart.', content: { 'application/json': { schema: CartSchema } } },
    404: { description: 'Cart or item not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// Checkout
registry.registerPath({
  method: 'post', path: '/api/checkout', tags: ['Checkout'],
  summary: 'Place an order',
  description: [
    'Places an order from the cart, applies an optional discount code, and clears the cart.',
    '',
    'Discount codes are **single-use** and must be generated by the admin via',
    '`POST /api/admin/discount/generate` before the Nth order is placed.',
  ].join('\n'),
  request: { body: { content: { 'application/json': { schema: checkoutSchema } } } },
  responses: {
    201: { description: 'Order placed.', content: { 'application/json': { schema: CheckoutResponseSchema } } },
    400: { description: 'Empty cart, invalid code, or already-used code.', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Cart not found.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// Admin
registry.registerPath({
  method: 'get', path: '/api/admin/stats', tags: ['Admin'],
  summary: 'Get store analytics',
  description: 'Revenue, order counts, items purchased, and full discount code history.',
  responses: {
    200: { description: 'Store statistics snapshot.', content: { 'application/json': { schema: StoreStatsSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/admin/discount/generate', tags: ['Admin'],
  summary: 'Generate a discount code',
  description: [
    'Generates a code when `orderCounter ∈ [c*N − 1, c*N)` for the next ungenerated milestone.',
    '',
    'Returns 400 with a descriptive message if the window is not currently open.',
  ].join('\n'),
  responses: {
    201: { description: 'Code generated.', content: { 'application/json': { schema: GenerateCodeResponseSchema } } },
    400: { description: 'Window not open or misconfigured N/X.', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/admin/discount/status', tags: ['Admin'],
  summary: 'Check discount generation eligibility',
  description: 'Returns the current window state so the admin knows when to generate a code.',
  responses: {
    200: { description: 'Current window status.', content: { 'application/json': { schema: DiscountStatusSchema } } },
  },
});

// Seed
registry.registerPath({
  method: 'post', path: '/api/seed', tags: ['Utility'],
  summary: 'Reset and re-seed the store',
  description: 'Clears all orders, carts, discount codes, and counters. Re-seeds the fixed product catalog. Idempotent.',
  responses: {
    200: {
      description: 'Store reset.',
      content: {
        'application/json': {
          schema: z.object({
            message:  z.string().openapi({ example: 'Store has been reset and seeded successfully' }),
            products: z.array(ProductSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get', path: '/health', tags: ['Utility'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service is healthy.',
      content: { 'application/json': { schema: z.object({ status: z.literal('ok') }) } },
    },
  },
});

registry.registerPath({
  method: 'get', path: '/', tags: ['Utility'],
  summary: 'Hello world',
  responses: {
    200: {
      description: 'API is reachable.',
      content: { 'application/json': { schema: z.object({ message: z.string().openapi({ example: 'Hello from Uniblox Store API' }) }) } },
    },
  },
});

// ── Spec generator ────────────────────────────────────────────────────────────

export function generateSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Uniblox Store API',
      version: '1.0.0',
      description: 'RESTful e-commerce API — cart management, checkout, and nth-order discount system.',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Local development' }],
  });
}
