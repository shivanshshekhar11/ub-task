/**
 * @ub-task/shared-types
 *
 * Single source of truth for all TypeScript types, Zod validators, and OpenAPI
 * schemas shared between the backend and frontend. Both packages import from here —
 * no duplicate declarations, no silent drift.
 *
 * Exports:
 *   - Domain Zod schemas (schemas.ts)  — with .openapi() annotations
 *   - Inferred TS types                — derived from Zod schemas via z.infer<>
 *   - Request validators (validators.ts) — AddItemInput, UpdateItemInput, CheckoutInput
 *   - formatZodError helper            — consistent error formatting in both layers
 *
 * DATE FIELDS
 * ─────────────────────────────────────────────────────────────────────────────
 * JSON has no native Date type. When the backend serialises a JS `Date` via
 * `res.json()`, it becomes an ISO 8601 string. The frontend receives strings.
 * Types here use `ISODateString` (= `string`) to match the actual wire format.
 * The backend's internal service layer keeps `Date` objects for richer semantics
 * and relies on JSON.stringify to convert them transparently at the HTTP boundary.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// validators.ts calls extendZodWithOpenApi — must be imported before schemas.ts
export * from './validators.ts';

// Domain Zod schemas (with .openapi annotations) + inferred TypeScript types
export * from './schemas.ts';

// ── Inferred domain types ─────────────────────────────────────────────────────
// These replace the hand-written interfaces. They are derived from the Zod schemas
// so there is exactly one definition per type across the entire monorepo.

import type { z } from 'zod';
import type {
  ProductSchema,
  CartItemSchema,
  CartSchema,
  OrderItemSchema,
  OrderSchema,
  DiscountCodeSchema,
  StoreStatsSchema,
  DiscountStatusSchema,
  CheckoutResponseSchema,
} from './schemas';

export type ISODateString = string;

export type Product       = z.infer<typeof ProductSchema>;
export type CartItem      = z.infer<typeof CartItemSchema>;
export type Cart          = z.infer<typeof CartSchema>;
export type OrderItem     = z.infer<typeof OrderItemSchema>;
export type Order         = z.infer<typeof OrderSchema>;
export type DiscountCode  = z.infer<typeof DiscountCodeSchema>;
export type StoreStats    = z.infer<typeof StoreStatsSchema>;
export type DiscountStatus = z.infer<typeof DiscountStatusSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
