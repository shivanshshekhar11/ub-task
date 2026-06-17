/**
 * Typed API client for the Uniblox Store backend.
 *
 * All functions throw an Error with a user-friendly message on failure.
 *
 * PRE-FLIGHT VALIDATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Mutating functions validate their inputs against the shared Zod schemas from
 * @ub-task/shared-types BEFORE making any network request. This ensures:
 *
 * 1. The frontend and backend can never silently disagree on what is valid
 *    (same schema, same rules, single source of truth).
 * 2. Bad inputs produce instant, readable error messages without a round-trip.
 * 3. UI components stay Zod-free — they just catch `Error.message` as usual.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Cart,
  CheckoutResponse,
  DiscountCode,
  DiscountStatus,
  Product,
  StoreStats,
  // Validators & helpers
  addItemSchema,
  updateItemSchema,
  checkoutSchema,
  formatZodError,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Something went wrong');
  }

  return res.json() as Promise<T>;
}

// ── Products ──────────────────────────────────────────────────────────────────

export const getProducts = (): Promise<Product[]> => request('/api/products');

// ── Cart ──────────────────────────────────────────────────────────────────────

export const getCart = (cartId: string): Promise<Cart> =>
  request(`/api/cart/${cartId}`);

/**
 * Add a product to the cart.
 * Pre-validates productId (non-empty) and quantity (positive integer).
 */
export const addToCart = (cartId: string, productId: string, quantity: number): Promise<Cart> => {
  const result = addItemSchema.safeParse({ productId, quantity });
  if (!result.success) throw new Error(formatZodError(result.error));

  return request(`/api/cart/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify(result.data),
  });
};

/**
 * Update the quantity of a cart item.
 * Pre-validates quantity (integer >= 0; 0 removes the item).
 */
export const updateCartItem = (
  cartId: string,
  productId: string,
  quantity: number,
): Promise<Cart> => {
  const result = updateItemSchema.safeParse({ quantity });
  if (!result.success) throw new Error(formatZodError(result.error));

  return request(`/api/cart/${cartId}/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(result.data),
  });
};

export const removeCartItem = (cartId: string, productId: string): Promise<Cart> =>
  request(`/api/cart/${cartId}/items/${productId}`, { method: 'DELETE' });

// ── Checkout ──────────────────────────────────────────────────────────────────

/**
 * Place an order from the cart with an optional discount code.
 *
 * Pre-validates:
 * - cartId: non-empty string
 * - discountCode: if provided, must not be blank/whitespace-only
 *   (empty string is treated as "no code" and stripped before sending)
 */
export const checkout = (cartId: string, discountCode?: string): Promise<CheckoutResponse> => {
  // Normalise empty string → undefined so the server doesn't receive a blank code
  const normalised = { cartId, discountCode: discountCode?.trim() || undefined };

  const result = checkoutSchema.safeParse(normalised);
  if (!result.success) throw new Error(formatZodError(result.error));

  return request('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(result.data),
  });
};

// ── Admin ──────────────────────────────────────────────────────────────────────

export const getStats = (): Promise<StoreStats> => request('/api/admin/stats');

export const getDiscountStatus = (): Promise<DiscountStatus> =>
  request('/api/admin/discount/status');

export const generateDiscountCode = (): Promise<{ message: string; code: DiscountCode }> =>
  request('/api/admin/discount/generate', { method: 'POST' });

// ── Seed ──────────────────────────────────────────────────────────────────────

export const seedStore = (): Promise<{ message: string; products: Product[] }> =>
  request('/api/seed', { method: 'POST' });
