import { v4 as uuidv4 } from 'uuid';
import { config, getConfigErrors } from '../config/index.ts';
import { DiscountCode } from '../domain/types.ts';
import { AppError } from '../errors/AppError.ts';
import { store } from '../store/InMemoryStore.ts';

/**
 * DiscountService — manages the nth-order coupon system.
 *
 * Discount system rules (per spec):
 * ─────────────────────────────────────────────────────────────────────────────
 * Every Nth order gets a coupon code for X% discount.
 *
 * The admin generates the code BEFORE that order is placed, so the customer
 * placing the Nth order can actually use the code on their checkout.
 *
 * Generation window for the c-th discount code (c = 1, 2, 3, ...):
 *
 *   orderCounter ∈ [c*N − 1, c*N)
 *
 * i.e., the window opens after the (c*N − 1)-th order is placed and closes
 * the moment the (c*N)-th order is placed. For N=5:
 *
 *   Code #1: window opens after order #4, closes after order #5
 *   Code #2: window opens after order #9, closes after order #10
 *   ...
 *
 * There is NO auto-generation after checkout. The admin endpoint is the
 * only way to generate codes.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class DiscountService {
  private get N(): number {
    return config.DISCOUNT_ORDER_INTERVAL;
  }

  private get X(): number {
    return config.DISCOUNT_PERCENT;
  }

  /**
   * Guards against misconfigured N or X values.
   * Throws AppError(400) with a descriptive message if config is invalid.
   * This is the service-layer defence — the startup validator in server.ts
   * is the first line of defence.
   */
  private assertValidConfig(): void {
    const errors = getConfigErrors();
    if (errors.length > 0) {
      throw new AppError(
        400,
        `Discount system is misconfigured:\n${errors.map((e) => `• ${e}`).join('\n')}`,
      );
    }
  }

  /**
   * Returns true when the current order count falls within the generation
   * window for the next ungenerated discount milestone.
   *
   * Window for milestone c = discountMilestonesGenerated + 1:
   *   orderCounter ∈ [c*N − 1, c*N)
   */
  shouldGenerateDiscount(): boolean {
    if (this.N <= 0) return false; // safety guard for misconfigured values

    const c = store.discountMilestonesGenerated + 1;
    const windowStart = c * this.N - 1; // after the (c*N − 1)-th order
    const windowEnd = c * this.N;       // before the (c*N)-th order is placed

    return store.orderCounter >= windowStart && store.orderCounter < windowEnd;
  }

  /**
   * Generates a discount code for the upcoming Nth order.
   *
   * Throws AppError(400) if:
   * - N or X config values are invalid (≤ 0 or X > 100)
   * - The current order count is outside the valid generation window
   */
  generateCode(): DiscountCode {
    // Layer-2 config validation — returns HTTP 400 instead of crashing
    this.assertValidConfig();

    if (!this.shouldGenerateDiscount()) {
      const c = store.discountMilestonesGenerated + 1;
      const windowStart = c * this.N - 1;
      const windowEnd = c * this.N;

      const tooEarly = store.orderCounter < windowStart;
      const tooLate = store.orderCounter >= windowEnd;

      let reason: string;
      if (tooEarly) {
        reason =
          `${store.orderCounter} orders placed so far — ` +
          `the window opens after order #${windowStart} ` +
          `(for the upcoming #${windowEnd} order).`;
      } else if (tooLate) {
        // The window passed — tell them the next one
        const nextC = c + 1;
        const nextWindow = nextC * this.N - 1;
        reason =
          `The window for order #${windowEnd} already closed ` +
          `(${store.orderCounter} orders placed). ` +
          `Next window opens after order #${nextWindow} ` +
          `(for the upcoming #${nextC * this.N} order).`;
      } else {
        reason = 'No eligible window at this time.';
      }

      throw new AppError(400, `Cannot generate discount code. ${reason}`);
    }

    const c = store.discountMilestonesGenerated + 1;
    const suffix = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    const code: DiscountCode = {
      code: `SAVE${this.X}-${suffix}`,
      discountPercent: this.X,
      isUsed: false,
      createdAt: new Date(),
      generatedForMilestone: c,
    };

    store.discountCodes.set(code.code, code);
    store.discountMilestonesGenerated += 1;
    return code;
  }

  /**
   * Validates a discount code string.
   * Throws AppError if the code doesn't exist or has already been used.
   */
  validateCode(code: string): DiscountCode {
    const discountCode = store.discountCodes.get(code);
    if (!discountCode) {
      throw new AppError(400, `Discount code '${code}' is invalid`);
    }
    if (discountCode.isUsed) {
      throw new AppError(400, `Discount code '${code}' has already been used`);
    }
    return discountCode;
  }

  /**
   * Validates a code and calculates the discount amount for the given subtotal.
   */
  applyCode(
    code: string,
    subtotal: number,
  ): { discountAmount: number; discountCode: DiscountCode } {
    const discountCode = this.validateCode(code);
    const discountAmount = parseFloat(((subtotal * discountCode.discountPercent) / 100).toFixed(2));
    return { discountAmount, discountCode };
  }

  /** Marks a code as used after the order is finalised */
  markCodeUsed(code: string, orderId: string): void {
    const discountCode = store.discountCodes.get(code);
    if (discountCode) {
      discountCode.isUsed = true;
      discountCode.usedByOrderId = orderId;
      discountCode.usedAt = new Date();
    }
  }
}

export const discountService = new DiscountService();
