/**
 * Backend domain types.
 *
 * DESIGN NOTE — two-layer type system
 * ─────────────────────────────────────────────────────────────────────────────
 * @ub-task/shared-types defines the WIRE FORMAT types (dates as ISO strings).
 * These are re-exported here for types that have no Date fields.
 *
 * Types that contain dates are re-declared here with JS `Date` objects because:
 *  - The service layer works with real Date objects (comparison, formatting)
 *  - `JSON.stringify` / `res.json()` transparently serialises Date → ISO string
 *    at the HTTP boundary, so the frontend always receives strings
 *  - There is NO mismatch: the backend stores Date, the wire carries string,
 *    the frontend (and @ub-task/shared-types) types dates as ISODateString
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { CartItem, OrderItem } from '@ub-task/shared-types';

// Re-export types that have no date fields — truly shared, no override needed
export type {
  Product,
  CartItem,
  OrderItem,
  StoreStats,
  CheckoutResponse,
  DiscountStatus,
  ISODateString,
} from '@ub-task/shared-types';

// ─── Internal types (Date fields for service-layer richness) ──────────────────

export interface Cart {
  id: string;
  items: CartItem[];
  /** JS Date stored internally; serialised to ISO string at HTTP boundary */
  createdAt: Date;
  /** JS Date stored internally; serialised to ISO string at HTTP boundary */
  updatedAt: Date;
}

export interface Order {
  id: string;
  /** Sequential counter across all orders — used to evaluate discount milestones */
  orderNumber: number;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountPercent: number;
  discountAmount: number;
  total: number;
  createdAt: Date;
}

export interface DiscountCode {
  code: string;
  discountPercent: number;
  isUsed: boolean;
  createdAt: Date;
  /** Which c*N-th order milestone this code was generated for (1 = first milestone) */
  generatedForMilestone: number;
  usedByOrderId?: string;
  usedAt?: Date;
}
