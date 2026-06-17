import { StoreStats } from '@ub-task/shared-types';
import { store } from '../store/InMemoryStore.ts';

/**
 * StatsService — aggregates analytics from the in-memory store.
 * Pure read-only — no mutations.
 *
 * Note: discount window status (nextDiscountAtOrder etc.) is intentionally NOT
 * included here. It lives in GET /api/admin/discount/status, which has richer
 * semantics (windowOpensAfterOrder, windowClosesAfterOrder, eligible flag).
 * Keeping these concerns separate prevents StoreStats from becoming a kitchen-sink.
 *
 * DATE SERIALISATION
 * The internal DiscountCode type stores dates as JS Date objects. StoreStats
 * (the wire type) expects ISODateString. We map explicitly here so the return
 * type is honest — no silent reliance on JSON.stringify doing the conversion.
 */
export class StatsService {
  getStats(): StoreStats {
    const internalCodes = Array.from(store.discountCodes.values());

    const totalItemsPurchased = store.orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    const totalRevenue = parseFloat(
      store.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2),
    );

    const usedDiscountCodes = internalCodes.filter((c) => c.isUsed).length;

    const totalDiscountAmount = parseFloat(
      store.orders.reduce((sum, order) => sum + order.discountAmount, 0).toFixed(2),
    );

    // Map internal DiscountCode (Date fields) → wire DiscountCode (ISODateString fields)
    const discountCodes: StoreStats['discountCodes'] = internalCodes.map((c) => ({
      code: c.code,
      discountPercent: c.discountPercent,
      isUsed: c.isUsed,
      createdAt: c.createdAt.toISOString(),
      generatedForMilestone: c.generatedForMilestone,
      ...(c.usedByOrderId !== undefined && { usedByOrderId: c.usedByOrderId }),
      ...(c.usedAt !== undefined && { usedAt: c.usedAt.toISOString() }),
    }));

    return {
      totalOrders: store.orderCounter,
      totalItemsPurchased,
      totalRevenue,
      totalDiscountCodes: internalCodes.length,
      usedDiscountCodes,
      totalDiscountAmount,
      discountCodes,
    };
  }
}

export const statsService = new StatsService();
