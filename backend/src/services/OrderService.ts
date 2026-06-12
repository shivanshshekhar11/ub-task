import { v4 as uuidv4 } from 'uuid';
import { Order } from '../domain/types';
import { AppError } from '../errors/AppError';
import { store } from '../store/InMemoryStore';
import { cartService } from './CartService';
import { discountService } from './DiscountService';

/**
 * OrderService — orchestrates the full checkout flow.
 *
 * Checkout sequence:
 * 1. Validate the cart (must exist and be non-empty)
 * 2. Calculate subtotal from cart items
 * 3. Validate & apply discount code if provided
 * 4. Increment global order counter and create the Order record
 * 5. Mark the discount code as used (if applicable)
 * 6. Clear the cart
 *
 * Note: Discount code GENERATION is NOT triggered here.
 * Per spec, the admin generates codes BEFORE the Nth order via
 * POST /admin/discount/generate. This keeps generation and checkout
 * as separate, independent concerns.
 */
export class OrderService {
  checkout(cartId: string, discountCodeStr?: string): Order {
    // ── 1. Validate cart ────────────────────────────────────────────────────
    const cart = cartService.getCart(cartId);
    if (cart.items.length === 0) {
      throw new AppError(400, 'Cannot checkout with an empty cart');
    }

    // ── 2. Calculate subtotal ───────────────────────────────────────────────
    const subtotal = parseFloat(
      cart.items
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        .toFixed(2),
    );

    // ── 3. Apply discount ───────────────────────────────────────────────────
    let discountAmount = 0;
    let discountPercent = 0;
    let appliedCode: string | undefined;

    if (discountCodeStr) {
      const result = discountService.applyCode(discountCodeStr, subtotal);
      discountAmount = result.discountAmount;
      discountPercent = result.discountCode.discountPercent;
      appliedCode = discountCodeStr;
    }

    const total = parseFloat((subtotal - discountAmount).toFixed(2));

    // ── 4. Create order ─────────────────────────────────────────────────────
    store.orderCounter += 1;

    const order: Order = {
      id: uuidv4(),
      orderNumber: store.orderCounter,
      items: cart.items.map((item) => ({ ...item })), // snapshot — not a reference
      subtotal,
      discountCode: appliedCode,
      discountPercent,
      discountAmount,
      total,
      createdAt: new Date(),
    };

    store.orders.push(order);

    // ── 5. Mark discount code used ──────────────────────────────────────────
    if (appliedCode) {
      discountService.markCodeUsed(appliedCode, order.id);
    }

    // ── 6. Clear cart ────────────────────────────────────────────────
    cartService.clearCart(cartId);

    return order;
  }
}

export const orderService = new OrderService();
