import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '../../src/store/InMemoryStore';
import { DiscountService } from '../../src/services/DiscountService';
import { AppError } from '../../src/errors/AppError';
import { config } from '../../src/config';

describe('DiscountService', () => {
  let discountService: DiscountService;
  const N = config.DISCOUNT_ORDER_INTERVAL; // default 5

  beforeEach(() => {
    store.seed();
    discountService = new DiscountService();
  });

  // ── shouldGenerateDiscount ─────────────────────────────────────────────────
  //
  // Window for milestone c (c = discountMilestonesGenerated + 1):
  //   orderCounter ∈ [c*N − 1, c*N)
  //
  // For N=5:
  //   Code #1 window: orderCounter in [4, 5)  → exactly orderCounter == 4
  //   Code #2 window: orderCounter in [9, 10) → exactly orderCounter == 9

  describe('shouldGenerateDiscount', () => {
    it('returns false when no orders have been placed (window not open yet)', () => {
      // orderCounter=0, window starts at c*N-1=4 — too early
      expect(discountService.shouldGenerateDiscount()).toBe(false);
    });

    it('returns false when order count is below the window start', () => {
      store.orderCounter = N - 2; // e.g. 3 for N=5 — window opens at 4
      expect(discountService.shouldGenerateDiscount()).toBe(false);
    });

    it('returns true at the window start (c*N − 1 orders placed)', () => {
      store.orderCounter = N - 1; // e.g. 4 for N=5
      expect(discountService.shouldGenerateDiscount()).toBe(true);
    });

    it('returns false once the Nth order has been placed (window closed)', () => {
      store.orderCounter = N; // the Nth order was already placed without using the code
      // The window [N-1, N) is now closed; next window is [2N-1, 2N)
      expect(discountService.shouldGenerateDiscount()).toBe(false);
    });

    it('returns false when a code was already generated for the current window', () => {
      store.orderCounter = N - 1; // window is open
      store.discountMilestonesGenerated = 1; // but code #1 was already generated
      // Now c=2, window is [2N-1, 2N) — orderCounter is still at N-1, too early
      expect(discountService.shouldGenerateDiscount()).toBe(false);
    });

    it('returns true at the second window start (2*N − 1)', () => {
      store.orderCounter = 2 * N - 1; // e.g. 9 for N=5
      store.discountMilestonesGenerated = 1; // code #1 already generated
      expect(discountService.shouldGenerateDiscount()).toBe(true);
    });

    it('returns false after the second milestone order is placed', () => {
      store.orderCounter = 2 * N; // e.g. 10 for N=5
      store.discountMilestonesGenerated = 1;
      expect(discountService.shouldGenerateDiscount()).toBe(false);
    });
  });

  // ── generateCode ──────────────────────────────────────────────────────────

  describe('generateCode', () => {
    it('generates a code with the correct format (SAVE{X}-{SUFFIX})', () => {
      store.orderCounter = N - 1; // window is open
      const code = discountService.generateCode();
      expect(code.code).toMatch(new RegExp(`^SAVE${config.DISCOUNT_PERCENT}-[A-Z0-9]{8}$`));
    });

    it('sets the correct discount percent', () => {
      store.orderCounter = N - 1;
      const code = discountService.generateCode();
      expect(code.discountPercent).toBe(config.DISCOUNT_PERCENT);
    });

    it('sets generatedForMilestone = 1 for the first code', () => {
      store.orderCounter = N - 1;
      const code = discountService.generateCode();
      expect(code.generatedForMilestone).toBe(1);
    });

    it('increments discountMilestonesGenerated after generation', () => {
      store.orderCounter = N - 1;
      discountService.generateCode();
      expect(store.discountMilestonesGenerated).toBe(1);
    });

    it('throws 400 when too early (window not open yet)', () => {
      store.orderCounter = N - 2; // window opens at N-1
      const err = (() => { try { discountService.generateCode(); } catch (e) { return e; } })();
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toContain('Cannot generate');
    });

    it('throws 400 when the Nth order was already placed (window closed)', () => {
      store.orderCounter = N; // one order too late
      const err = (() => { try { discountService.generateCode(); } catch (e) { return e; } })();
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toContain('already closed');
    });

    it('throws when trying to generate a second code for the same window', () => {
      store.orderCounter = N - 1;
      discountService.generateCode(); // first generate succeeds
      // discountMilestonesGenerated is now 1, window for c=2 hasn't opened
      expect(() => discountService.generateCode()).toThrowError(AppError);
    });
  });

  // ── validateCode ──────────────────────────────────────────────────────────

  describe('validateCode', () => {
    it('returns the code when valid', () => {
      store.orderCounter = N - 1;
      const generated = discountService.generateCode();
      const validated = discountService.validateCode(generated.code);
      expect(validated.code).toBe(generated.code);
    });

    it('throws 400 for a non-existent code', () => {
      const err = (() => { try { discountService.validateCode('FAKE-CODE'); } catch (e) { return e; } })();
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    });

    it('throws 400 for an already-used code', () => {
      store.orderCounter = N - 1;
      const generated = discountService.generateCode();
      discountService.markCodeUsed(generated.code, 'order-123');
      expect(() => discountService.validateCode(generated.code)).toThrowError(AppError);
    });
  });

  // ── applyCode ─────────────────────────────────────────────────────────────

  describe('applyCode', () => {
    it('calculates the correct discount amount', () => {
      store.orderCounter = N - 1;
      const generated = discountService.generateCode();
      const { discountAmount } = discountService.applyCode(generated.code, 200);
      expect(discountAmount).toBe(parseFloat(((200 * config.DISCOUNT_PERCENT) / 100).toFixed(2)));
    });

    it('rounds the discount amount to 2 decimal places', () => {
      store.orderCounter = N - 1;
      const generated = discountService.generateCode();
      const { discountAmount } = discountService.applyCode(generated.code, 149.99);
      expect(discountAmount).toBe(
        parseFloat(((149.99 * config.DISCOUNT_PERCENT) / 100).toFixed(2)),
      );
    });
  });

  // ── markCodeUsed ──────────────────────────────────────────────────────────

  describe('markCodeUsed', () => {
    it('marks the code as used with the order ID and timestamp', () => {
      store.orderCounter = N - 1;
      const generated = discountService.generateCode();
      discountService.markCodeUsed(generated.code, 'order-abc');
      const code = store.discountCodes.get(generated.code)!;
      expect(code.isUsed).toBe(true);
      expect(code.usedByOrderId).toBe('order-abc');
      expect(code.usedAt).toBeInstanceOf(Date);
    });
  });
});
