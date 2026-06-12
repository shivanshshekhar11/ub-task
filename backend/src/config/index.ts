/**
 * Application configuration.
 *
 * DISCOUNT_ORDER_INTERVAL (N): Admin can generate a discount code for the upcoming
 * c*N-th order. The generation window is open when orderCounter is in [c*N-1, c*N).
 *
 * DISCOUNT_PERCENT (X): The percentage off applied by generated codes (1-100).
 *
 * Both values are env-configurable so the discount system is easy to test:
 *   e.g. DISCOUNT_ORDER_INTERVAL=2 triggers a code window after every 2nd order.
 */
export const config = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  /** Every Nth order earns a discount — admin generates the code before that order */
  DISCOUNT_ORDER_INTERVAL: parseInt(process.env.DISCOUNT_ORDER_INTERVAL ?? '5', 10),
  /** Discount percentage for generated codes (must be 1–100) */
  DISCOUNT_PERCENT: parseInt(process.env.DISCOUNT_PERCENT ?? '10', 10),
} as const;

/**
 * Validates discount-related config values.
 * Returns an array of human-readable error strings — empty means all good.
 *
 * Called at server startup (fail-fast) AND inside DiscountService (HTTP error
 * response) for defense-in-depth.
 */
export function getConfigErrors(): string[] {
  const errors: string[] = [];

  if (isNaN(config.DISCOUNT_ORDER_INTERVAL) || config.DISCOUNT_ORDER_INTERVAL <= 0) {
    errors.push(
      `DISCOUNT_ORDER_INTERVAL must be a positive integer greater than 0 ` +
      `(got '${process.env.DISCOUNT_ORDER_INTERVAL ?? ''}', resolved to ${config.DISCOUNT_ORDER_INTERVAL}).`,
    );
  }

  if (
    isNaN(config.DISCOUNT_PERCENT) ||
    config.DISCOUNT_PERCENT <= 0 ||
    config.DISCOUNT_PERCENT > 100
  ) {
    errors.push(
      `DISCOUNT_PERCENT must be an integer between 1 and 100 ` +
      `(got '${process.env.DISCOUNT_PERCENT ?? ''}', resolved to ${config.DISCOUNT_PERCENT}).`,
    );
  }

  return errors;
}
